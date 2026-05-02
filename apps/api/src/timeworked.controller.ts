import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { TimeWorkedService } from './timeworked.service';

@Controller('api/timeworked')
export class TimeWorkedController {
  @Get('/health')
  @HttpCode(200)
  health() {
    return { status: 'ok' };
  }
  constructor(private readonly service: TimeWorkedService) {}


  @Post('start')
  start(@Body() data: { userId: string }) {
    // Start a new timer session
    return this.service.startSession(data.userId);
  }

  @Patch('stop/:id')
  stop(@Param('id') id: string, @Body() data: { endedAt?: Date }) {
    // Stop the timer session
    return this.service.stopSession(id, data.endedAt);
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }
}
