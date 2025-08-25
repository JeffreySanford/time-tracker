import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CommitWorkLog } from './commitworklog.schema';
import { CommitSession } from './commitsession.schema';
import { Project } from './project.schema';
import * as crypto from 'crypto';
import { execSync } from 'child_process';
import * as path from 'path';

export interface ParsedCommit {
  hash: string;
  ts: number; // epoch ms
  authorName: string;
  authorEmail: string;
  subject: string;
  files: { path: string; additions: number; deletions: number }[];
  additions: number;
  deletions: number;
  filesChanged: number;
}

@Injectable()
export class GitIngestService {
  constructor(
    @InjectModel(CommitWorkLog.name) private worklogModel: Model<CommitWorkLog>,
    @InjectModel(CommitSession.name) private sessionModel: Model<CommitSession>,
    @InjectModel(Project.name) private projectModel: Model<Project>
  ) {}

  private projectsCache: string[] | null = null;
  private projectsCacheLoadedAt = 0;

  private async ensureProjectCache(force = false) {
    const STALE_MS = 5 * 60 * 1000; // 5 minutes
    if (force || !this.projectsCache || (Date.now() - this.projectsCacheLoadedAt) > STALE_MS) {
      const projects = await this.projectModel.find({}, { id: 1, _id: 0 }).lean().exec();
      this.projectsCache = projects.map(p => (p as any).id);
      this.projectsCacheLoadedAt = Date.now();
    }
  }

  classify(subject: string, files: string[]): string {
    const lower = (subject || '').toLowerCase();
    const prefix = /^(feat|fix|refactor|test|docs|chore|build|ci|perf)/.exec(lower);
    if (prefix) return prefix[1];
    if (files.some(f => f.startsWith('android/'))) return 'android';
    if (files.some(f => f.startsWith('ios/'))) return 'ios';
    if (files.some(f => f.startsWith('apps/api/'))) return 'backend';
    if (files.some(f => f.startsWith('apps/time-tracker/'))) return 'frontend';
    if (files.every(f => f.endsWith('.md'))) return 'docs';
    return 'general';
  }

  private deriveProjectIdFromPaths(paths: string[]): string | undefined {
    if (!paths || !paths.length) return undefined;
    // Common monorepo app roots -> project ids
    const mapTable: { prefix: string; project: string }[] = [
      { prefix: 'apps/time-tracker/', project: 'time-forge' },
      { prefix: 'apps/api/', project: 'api' },
      { prefix: 'apps/time-forge/', project: 'time-forge' },
      { prefix: 'packages/shared/', project: 'shared' },
    ];
    for (const { prefix, project } of mapTable) {
      if (paths.some(p => p.startsWith(prefix))) return project;
    }
    // Heuristic: take first path segment after apps/ as project id
    const appMatch = paths.find(p => p.startsWith('apps/'));
    if (appMatch) {
      const seg = appMatch.split('/')[1];
      if (seg) {
        // If we have a dynamic projects cache, prefer returning seg only if known
        if (this.projectsCache && this.projectsCache.includes(seg)) return seg;
        return seg;
      }
    }

    // Try dynamic match: any cached project id occurring in path segments
    if (this.projectsCache) {
      for (const id of this.projectsCache) {
        if (paths.some(p => p.includes('/' + id + '/') || p.startsWith(id + '/'))) return id;
      }
    }
    return undefined;
  }

  async ingest(parsed: ParsedCommit[]): Promise<{ inserted: number; updated: number; sessions: number }> {
    if (!parsed.length) return { inserted: 0, updated: 0, sessions: 0 };
  await this.ensureProjectCache().catch(() => {/* ignore cache errors */});
    // Upsert commit docs
    let inserted = 0, updated = 0;
    for (const c of parsed) {
      const category = this.classify(c.subject, c.files.map(f => f.path));
      const existing = await this.worklogModel.findOne({ hash: c.hash }).exec();
      if (existing) {
        existing.authorEmail = c.authorEmail.toLowerCase();
        existing.authorName = c.authorName;
        existing.timestamp = new Date(c.ts);
        existing.message = c.subject;
        existing.additions = c.additions;
        existing.deletions = c.deletions;
        existing.filesChanged = c.filesChanged;
        existing.paths = c.files.map(f => f.path);
        existing.category = category;
  if (!existing.projectId) existing.projectId = this.deriveProjectIdFromPaths(c.files.map(f => f.path));
        existing.raw = c;
        await existing.save();
        updated++;
      } else {
        await this.worklogModel.create({
          hash: c.hash,
          authorEmail: c.authorEmail.toLowerCase(),
          authorName: c.authorName,
          timestamp: new Date(c.ts),
          message: c.subject,
          additions: c.additions,
          deletions: c.deletions,
          filesChanged: c.filesChanged,
          paths: c.files.map(f => f.path),
          category,
          projectId: this.deriveProjectIdFromPaths(c.files.map(f => f.path)),
          raw: c,
        });
        inserted++;
      }
    }
    // Re-sessionize affected author(s)
    const authors = Array.from(new Set(parsed.map(p => p.authorEmail.toLowerCase())));
    const sessionsCreated = await this.sessionizeAuthors(authors);
    return { inserted, updated, sessions: sessionsCreated };
  }

  private async sessionizeAuthors(authors: string[]): Promise<number> {
    let created = 0;
    for (const author of authors) {
      const commits = await this.worklogModel.find({ authorEmail: author }).sort({ timestamp: 1 }).exec();
      if (!commits.length) continue;
      // remove old sessions for author
      await this.sessionModel.deleteMany({ authorEmail: author }).exec();
      let sessionId = crypto.randomUUID();
      let sessionStart = commits[0].timestamp;
      let prev = commits[0];
      let bucket: CommitWorkLog[] = [];
      const pushSession = async () => {
        if (!bucket.length) return;
        const endTs = bucket[bucket.length - 1].timestamp;
        // estimate per commit based on gap
        const MIN = 10, MAX = 120, GAP_BREAK = 45; // minutes
        for (let i = 0; i < bucket.length; i++) {
          const cur = bucket[i];
          const next = bucket[i + 1];
          let gapMin = next ? (next.timestamp.getTime() - cur.timestamp.getTime()) / 60000 : MIN;
          if (gapMin < MIN) gapMin = MIN;
          if (gapMin > MAX) gapMin = MAX;
          cur.estimatedMinutes = gapMin;
          cur.sessionId = sessionId;
          cur.estimationVersion = 1;
          await cur.save();
        }
        const total = bucket.reduce((s, c) => s + c.estimatedMinutes, 0);
        const categoriesSummary = bucket.reduce<Record<string, number>>((acc, c) => {
          acc[c.category] = (acc[c.category] || 0) + c.estimatedMinutes;
          return acc;
        }, {});
        const taskTokenRegex = /(TASK|TN|TF|PROJ|ISSUE|BUG)[-:#]?\d+/ig;
        const tasksSummary = bucket.reduce<Record<string, number>>((acc, c) => {
          const matches = c.message ? c.message.match(taskTokenRegex) : null;
          if (matches) {
            matches.forEach(m => {
              const key = m.toUpperCase();
              acc[key] = (acc[key] || 0) + c.estimatedMinutes;
            });
          }
          return acc;
        }, {});
        const commitMessages = bucket.map(c => c.message || '').filter(Boolean);
        // Determine dominant projectId among commits (mode)
        const projectCounts = bucket.reduce<Record<string, number>>((acc,c) => {
          if (c.projectId) acc[c.projectId] = (acc[c.projectId] || 0) + c.estimatedMinutes;
          return acc;
        }, {});
        const projectId = Object.entries(projectCounts).sort((a,b) => b[1]-a[1])[0]?.[0];
        await this.sessionModel.create({
          id: sessionId,
          authorEmail: author,
          startTs: sessionStart,
          endTs: endTs,
          totalEstimatedMinutes: total,
          commitCount: bucket.length,
          categoriesSummary,
          tasksSummary,
          commitMessages,
          projectId,
        });
        created++;
      };
      for (const commit of commits) {
        const gapMin = (commit.timestamp.getTime() - prev.timestamp.getTime()) / 60000;
        if (gapMin > 45) {
          await pushSession();
          // start new
          sessionId = crypto.randomUUID();
          sessionStart = commit.timestamp;
          bucket = [commit];
        } else {
          bucket.push(commit);
        }
        prev = commit;
      }
      await pushSession();
    }
    return created;
  }

  async recentSummary(days = 30, projectId?: string) {
    const since = new Date(Date.now() - days * 24 * 3600 * 1000);
    const match: any = { timestamp: { $gte: since } };
    if (projectId) match.projectId = projectId;
    const byDay = await this.worklogModel.aggregate([
      { $match: match },
      { $group: { _id: { $dateToString: { date: '$timestamp', format: '%Y-%m-%d' } }, minutes: { $sum: '$estimatedMinutes' } } },
      { $sort: { _id: 1 } }
    ]).exec();
    const byCategory = await this.worklogModel.aggregate([
      { $match: match },
      { $group: { _id: '$category', minutes: { $sum: '$estimatedMinutes' } } },
      { $sort: { minutes: -1 } }
    ]).exec();
    return { byDay, byCategory };
  }

  async recentSessions(days = 7, projectId?: string) {
    const since = new Date(Date.now() - days * 24 * 3600 * 1000);
  const query: any = { startTs: { $gte: since } };
  if (projectId) query.projectId = projectId;
  return this.sessionModel.find(query).sort({ startTs: 1 }).limit(500).lean().exec();
  }

  /**
   * Convenience helper to run `git log` locally on the API server (development only) and ingest commits
   * for the past N days. This avoids needing a separate script invocation from the client.
   */
  async ingestFromLocal(days: number) {
    try {
      const repoRoot = process.cwd();
      const since = `--since='${days}.days'`;
      // numstat gives per-file additions/deletions; use a custom pretty format to parse reliably
      const format = '%H%x09%an%x09%ae%x09%at%x09%s';
      const cmd = `git -C "${repoRoot}" log ${since} --numstat --pretty=format:${format}`;
      const raw = execSync(cmd, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'ignore'] });
      const lines = raw.split(/\r?\n/);
      const commits: ParsedCommit[] = [];
      let current: ParsedCommit | null = null;
      for (const line of lines) {
        if (!line.trim()) continue;
        if (line.includes('\t') && line.split('\t').length >= 5 && line.startsWith('0') === false && /^([0-9a-f]{7,40})\t/.test(line) === false) {
          // likely a numstat line (additions\tdeletions\tpath) OR a commit header depending on pattern
        }
        const parts = line.split('\t');
        if (parts.length >= 5 && /^[0-9a-f]{7,40}$/.test(parts[0])) {
          // commit header line
          if (current) commits.push(current);
            const [hash, authorName, authorEmail, tsStr, subject] = parts;
            current = {
              hash,
              authorName,
              authorEmail,
              ts: parseInt(tsStr, 10) * 1000,
              subject,
              files: [],
              additions: 0,
              deletions: 0,
              filesChanged: 0
            };
          continue;
        }
        // numstat line pattern: additions\tdeletions\tpath
        if (current && parts.length === 3) {
          const [addStr, delStr, filePath] = parts;
          const additions = addStr === '-' ? 0 : parseInt(addStr, 10) || 0;
          const deletions = delStr === '-' ? 0 : parseInt(delStr, 10) || 0;
          current.files.push({ path: filePath, additions, deletions });
          current.additions += additions;
          current.deletions += deletions;
          current.filesChanged = current.files.length;
        }
      }
      if (current) commits.push(current);
      const result = await this.ingest(commits);
      return { ...result, commits: commits.length };
    } catch (err) {
      return { error: 'Failed to run git log', message: String(err) };
    }
  }

  /**
   * Backfill projectId on existing commit work logs and sessions (idempotent).
   * 1. Load all worklogs missing projectId, derive and update.
   * 2. For authors affected, re-sessionize to persist projectId onto sessions.
   */
  async backfillProjectIds(): Promise<{ updatedCommits: number; regeneratedSessions: number; totalCommits: number }> {
    await this.ensureProjectCache(true).catch(()=>{});
    const missing = await this.worklogModel.find({ $or: [ { projectId: { $exists: false } }, { projectId: null } ] }).exec();
    let updatedCommits = 0;
    const affectedAuthors = new Set<string>();
    for (const wl of missing) {
      const proj = this.deriveProjectIdFromPaths(wl.paths || []);
      if (proj) {
        wl.projectId = proj;
        await wl.save();
        updatedCommits++;
        if (wl.authorEmail) affectedAuthors.add(wl.authorEmail.toLowerCase());
      }
    }
    let regeneratedSessions = 0;
    if (affectedAuthors.size) {
      regeneratedSessions = await this.sessionizeAuthors(Array.from(affectedAuthors));
    }
    const totalCommits = await this.worklogModel.estimatedDocumentCount();
    return { updatedCommits, regeneratedSessions, totalCommits };
  }
}
