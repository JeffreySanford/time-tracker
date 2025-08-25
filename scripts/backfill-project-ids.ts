#!/usr/bin/env ts-node
/**
 * CLI script to trigger projectId backfill and session regeneration.
 * Usage: npx ts-node scripts/backfill-project-ids.ts
 */
import 'dotenv/config';
import { connect } from 'mongoose';
import { CommitWorkLog, CommitWorkLogSchema } from '../apps/api/src/commitworklog.schema';
import { CommitSession, CommitSessionSchema } from '../apps/api/src/commitsession.schema';
import { Project, ProjectSchema } from '../apps/api/src/project.schema';
import { GitIngestService } from '../apps/api/src/git-ingest.service';
import { Model } from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

async function main() {
  let uri = process.env.MONGO_URI || 'mongodb://localhost:27017/time-tracker';
  if (!process.env.MONGO_URI && process.env.USE_IN_MEMORY === 'true') {
    const mongod = await MongoMemoryServer.create();
    uri = mongod.getUri();
    console.log('[backfill] Using in-memory MongoDB:', uri);
  }
  await connect(uri);
  const mongoose = (await import('mongoose')).default;
  const commitWorkLogModel = mongoose.model<CommitWorkLog>('CommitWorkLog', CommitWorkLogSchema, 'commit_work_logs');
  const commitSessionModel = mongoose.model<CommitSession>('CommitSession', CommitSessionSchema, 'commit_sessions');
  const projectModel = mongoose.model<Project>('Project', ProjectSchema, 'projects');
  const service = new GitIngestService(commitWorkLogModel as unknown as Model<CommitWorkLog>, commitSessionModel as unknown as Model<CommitSession>, projectModel as unknown as Model<Project>);
  const result = await service.backfillProjectIds();
  console.log('[backfill] Result:', result);
  process.exit(0);
}

main().catch(err => {
  console.error('[backfill] Failed:', err);
  process.exit(1);
});
