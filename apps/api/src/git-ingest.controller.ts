import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { GitIngestService, ParsedCommit } from './git-ingest.service';

@Controller('api/git')
export class GitIngestController {
  constructor(private svc: GitIngestService) {}

  @Post('ingest')
  ingest(@Body() body: { commits: ParsedCommit[] }) {
    return this.svc.ingest(body.commits || []);
  }

  // Convenience endpoint: have the API itself run git log locally (repo root) for the given days window
  // NOTE: This executes a git command on the server; intended only for local dev.
  @Post('ingest/local')
  ingestLocal(@Query('days') days?: string) {
    const d = Math.max(1, Math.min(parseInt(days || '30', 10) || 30, 365));
    return this.svc.ingestFromLocal(d);
  }

  @Get('summary')
  summary(@Query('days') days?: string) {
    const d = Math.max(1, Math.min(parseInt(days || '30', 10) || 30, 365));
    return this.svc.recentSummary(d);
  }

  @Get('sessions')
  sessions(@Query('days') days?: string) {
    const d = Math.max(1, Math.min(parseInt(days || '7', 10) || 7, 365));
    return this.svc.recentSessions(d);
  }
}
