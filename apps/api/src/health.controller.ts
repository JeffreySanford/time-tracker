import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';
import { SeedingStateService } from './seeding-state.service';

@Controller('api')
export class HealthController {
  constructor(private readonly seeding: SeedingStateService) {}

  @Get('health')
  health(@Res() res: Response) {
    const s = this.seeding.snapshot;
    return res.status(200).json({ status: 'ok', seeding: s });
  }

  @Get('ready')
  ready(@Res() res: Response) {
    const s = this.seeding.snapshot;
    const ready = s.completed && s.errors.length === 0;
    return res.status(ready ? 200 : 503).json({ ready, seeding: s });
  }
}
