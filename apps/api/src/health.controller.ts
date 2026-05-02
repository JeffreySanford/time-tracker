import {
  Controller,
  Get,
  HttpCode,
  ServiceUnavailableException,
} from '@nestjs/common';
import { SeedingStateService } from './seeding-state.service';

@Controller('api')
export class HealthController {
  constructor(private readonly seeding: SeedingStateService) {}

  @Get('health')
  @HttpCode(200)
  health() {
    const s = this.seeding.snapshot;
    return { status: 'ok', seeding: s };
  }

  @Get('ready')
  ready() {
    const s = this.seeding.snapshot;
    const ready = s.completed && s.errors.length === 0;
    if (!ready) {
      throw new ServiceUnavailableException({ ready, seeding: s });
    }
    return { ready, seeding: s };
  }
}
