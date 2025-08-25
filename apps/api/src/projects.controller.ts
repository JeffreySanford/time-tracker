import { Controller, Get, Param, Patch, Body } from '@nestjs/common';
import { ProjectsService } from './projects.service';

@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Get(':id')
  getProject(@Param('id') id: string) {
    // Return Observable directly; Nest will subscribe and send response when it resolves.
    return this.projectsService.findById(id);
  }

  @Patch(':id')
  updateProject(@Param('id') id: string, @Body() body: { isCodeProject?: boolean; isBillable?: boolean }) {
    return this.projectsService.updateProjectFlags(id, { isCodeProject: body.isCodeProject, isBillable: body.isBillable });
  }
}
