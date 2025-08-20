import { Controller, Get, Param } from '@nestjs/common';
import { Post, Body, Patch, Delete } from '@nestjs/common';
import { TaskService } from './task.service';
import { Task } from './task.schema';

@Controller('api/tasks')
export class TasksController {
  constructor(private readonly taskService: TaskService) {}

  @Get()
  findAll() {
    return this.taskService.findAll();
  }

  @Get('project/:projectId')
  findByProject(@Param('projectId') projectId: string) {
    return this.taskService.findByProject('', projectId);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.taskService.findById(id);
  }

  @Post()
  create(@Body() taskData: Partial<Task>) {
    return this.taskService.createTask(taskData);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateData: Partial<Task>) {
    return this.taskService.updateTask(id, updateData);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.taskService.deleteTask(id);
  }
}
