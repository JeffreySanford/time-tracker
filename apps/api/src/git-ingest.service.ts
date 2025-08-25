import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CommitWorkLog } from './commitworklog.schema';
import { CommitSession } from './commitsession.schema';
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
    @InjectModel(CommitSession.name) private sessionModel: Model<CommitSession>
  ) {}

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

  async ingest(parsed: ParsedCommit[]): Promise<{ inserted: number; updated: number; sessions: number }> {
    if (!parsed.length) return { inserted: 0, updated: 0, sessions: 0 };
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
        await this.sessionModel.create({
          id: sessionId,
          authorEmail: author,
          startTs: sessionStart,
          endTs: endTs,
          totalEstimatedMinutes: total,
          commitCount: bucket.length,
          categoriesSummary,
          tasksSummary,
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

  async recentSummary(days = 30) {
    const since = new Date(Date.now() - days * 24 * 3600 * 1000);
    const byDay = await this.worklogModel.aggregate([
      { $match: { timestamp: { $gte: since } } },
      { $group: { _id: { $dateToString: { date: '$timestamp', format: '%Y-%m-%d' } }, minutes: { $sum: '$estimatedMinutes' } } },
      { $sort: { _id: 1 } }
    ]).exec();
    const byCategory = await this.worklogModel.aggregate([
      { $match: { timestamp: { $gte: since } } },
      { $group: { _id: '$category', minutes: { $sum: '$estimatedMinutes' } } },
      { $sort: { minutes: -1 } }
    ]).exec();
    return { byDay, byCategory };
  }

  async recentSessions(days = 7) {
    const since = new Date(Date.now() - days * 24 * 3600 * 1000);
    return this.sessionModel.find({ startTs: { $gte: since } }).sort({ startTs: 1 }).limit(500).lean().exec();
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
}
