import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { AnyAuditEvent } from '@time-tracker/observability-shared';
import { AuditService } from './audit.service';

@Controller('api/observability')
export class ObservabilityController {
  constructor(private readonly audit: AuditService) {}

  @Post('events')
  @HttpCode(202)
  ingest(@Body() body: { events: AnyAuditEvent[] }) {
    if (!body || !Array.isArray(body.events)) {
      return { accepted: 0, error: 'events array required' };
    }
    this.audit.emitBatch(body.events);
    return { accepted: body.events.length };
  }

  @Get('metrics')
  metrics() {
    return this.audit.metrics();
  }
}
