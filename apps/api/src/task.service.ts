import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Task } from './task.schema';
import { User } from './user.schema';
import { Observable, from, of } from 'rxjs';
import { mergeMap, mapTo, catchError } from 'rxjs/operators';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class TaskService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<Task>,
    @InjectModel(User.name) private userModel: Model<User>
  ) {}

  seedFromFileIfEmpty(filePath: string): Observable<void> {
    return from(this.taskModel.estimatedDocumentCount()).pipe(
      mergeMap(count => {
        if (count > 0) {
          // already seeded
          return of(undefined);
        }

        try {
          const raw = fs.readFileSync(filePath, 'utf8');
          const parsed = JSON.parse(raw);
          if (!Array.isArray(parsed)) {
            return of(undefined);
          }

          // get a fallback userId from seeded users (if any)
          return from(this.userModel.findOne().lean().exec()).pipe(
            mergeMap(firstUser => {
              const fallbackUserId = firstUser ? (firstUser.id || (firstUser._id && String((firstUser as any)._id))) : '';

              // Map incoming objects: prefer 'id' then '_id'; prefer 'project' then 'projectId'
              const docs = parsed.map((t: any) => ({
                title: t.title || t.key || '',
                description: t.description,
                project: t.project || t.projectId || '',
                tags: Array.isArray(t.tags) ? t.tags : [],
                status: (['active', 'completed', 'backlog'].includes(t.status) ? t.status : (t.status === 'done' ? 'completed' : 'active')),
                timeSpent: typeof t.timeSpent === 'number' ? t.timeSpent : 0,
                startTime: t.start ? new Date(t.start) : (t.startTime ? new Date(t.startTime) : undefined),
                endTime: t.end ? new Date(t.end) : (t.endTime ? new Date(t.endTime) : undefined),
                createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
                priority: t.priority,
                estimatedTime: t.estimatedTime,
                userId: Array.isArray(t.assignees) && t.assignees.length ? t.assignees[0] : (t.userId || fallbackUserId || '')
              }));

              return from(this.taskModel.insertMany(docs)).pipe(mapTo(undefined));
            })
          );
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('Failed seeding tasks:', err);
          return of(undefined);
        }
      }),
      catchError(err => {
        // eslint-disable-next-line no-console
        console.error('Failed seeding tasks:', err);
        return of(undefined);
      })
    );
  }

  createTask(taskData: Partial<Task>): Observable<Task> {
    const task = new this.taskModel(taskData);
    return from(task.save());
  }

  findAllByUser(userId: string): Observable<Task[]> {
  if (!userId) return from(this.taskModel.find({}).exec());
  return from(this.taskModel.find({ userId }).exec());
  }

  findById(id: string): Observable<Task | null> {
    return from(this.taskModel.findById(id).exec());
  }

  updateTask(id: string, updateData: Partial<Task>): Observable<Task | null> {
    return from(
      this.taskModel.findByIdAndUpdate(id, updateData, { new: true }).exec()
    );
  }

  deleteTask(id: string): Observable<Task | null> {
    return from(this.taskModel.findByIdAndDelete(id).exec());
  }

  findByProject(userId: string, projectId: string): Observable<Task[]> {
    if (!userId) return from(this.taskModel.find({ project: projectId }).exec());
    return from(this.taskModel.find({ userId, project: projectId }).exec());
  }

  findAll(): Observable<Task[]> {
  return from(this.taskModel.find({}).exec());
  }
}
