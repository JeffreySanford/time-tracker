import { Controller, Get, Res } from '@nestjs/common';
import { Response } from 'express';

@Controller()
export class HealthController {
  @Get('health')
  health(@Res() res: Response) {
    return res.status(200).json({ status: 'ok' });
  }
}
