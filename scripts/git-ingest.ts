#!/usr/bin/env ts-node
/**
 * Simple local script to parse git log and POST commits to API ingest endpoint.
 * Usage: npx ts-node scripts/git-ingest.ts --since=2025-08-01 --endpoint=http://localhost:4200/api/git/ingest
 */
import { execSync } from 'node:child_process';
import * as http from 'node:http';
import * as https from 'node:https';

interface Args { [k: string]: string | boolean; }
const args: Args = process.argv.slice(2).reduce((acc, cur) => {
  const [k, v] = cur.split('=');
  if (k.startsWith('--')) acc[k.substring(2)] = v === undefined ? true : v;
  return acc;
}, {} as Args);

const since = (args['since'] as string) || '30.days';
const endpoint = (args['endpoint'] as string) || 'http://localhost:3000/api/git/ingest';
const SEP = '||';

const cmd = `git log --since="${since}" --pretty=format:%H${SEP}%at${SEP}%an${SEP}%ae${SEP}%s --numstat`;
const raw = execSync(cmd, { encoding: 'utf8' });

type ParsedCommit = {
  hash: string; ts: number; authorName: string; authorEmail: string; subject: string;
  files: { path: string; additions: number; deletions: number }[]; additions: number; deletions: number; filesChanged: number;
};

const commits: ParsedCommit[] = [];
let current: ParsedCommit | null = null;
for (const line of raw.split('\n')) {
  if (!line.trim()) continue;
  if (line.includes(SEP) && line.split(SEP).length >= 5 && /^[0-9a-f]{7,40}\|/.test(line.replace(/\|\|/g, '|'))) {
    if (current) commits.push(current);
    const [hash, ts, an, ae, ...rest] = line.split(SEP);
    current = { hash, ts: Number(ts) * 1000, authorName: an, authorEmail: ae.toLowerCase(), subject: rest.join(SEP), files: [], additions: 0, deletions: 0, filesChanged: 0 };
  } else if (current) {
    const parts = line.split('\t');
    if (parts.length === 3) {
      const [a, d, path] = parts;
      const add = a === '-' ? 0 : Number(a);
      const del = d === '-' ? 0 : Number(d);
      current.files.push({ path, additions: add, deletions: del });
      current.additions += add; current.deletions += del; current.filesChanged++;
    }
  }
}
if (current) commits.push(current);

const data = JSON.stringify({ commits });
const url = new URL(endpoint);
const client = url.protocol === 'https:' ? https : http;

const req = client.request({ hostname: url.hostname, port: url.port, path: url.pathname, method: 'POST', headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) } }, res => {
  let body = '';
  res.on('data', c => body += c);
  res.on('end', () => {
    console.log('Ingest response', res.statusCode, body);
  });
});
req.on('error', err => { console.error('Ingest failed', err); process.exitCode = 1; });
req.write(data); req.end();
