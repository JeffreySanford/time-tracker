import { Controller, Get } from '@nestjs/common';
import { TimeEntriesService } from './timeentries.service';

@Controller('time-entries')
export class TimeEntriesController {
  constructor(private readonly svc: TimeEntriesService) {}

  @Get()
  findAll() {
    return this.svc.findAll();
  }
}
