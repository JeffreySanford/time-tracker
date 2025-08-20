import { Controller, Get } from '@nestjs/common';
import { KanbanColumnsService } from './kanbancolumns.service';

@Controller('kanban-columns')
export class KanbanColumnsController {
  constructor(private readonly svc: KanbanColumnsService) {}

  @Get()
  findAll() {
    return this.svc.findAll();
  }
}
