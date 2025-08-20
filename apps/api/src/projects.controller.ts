import { Controller, Get, Param } from '@nestjs/common';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get(':id')
  getProject(@Param('id') id: string) {
    // Return Observable directly; Nest will subscribe and send response when it resolves.
    return this.projectsService.findById(id);
  }
}
