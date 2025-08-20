import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as fs from 'fs';
import { TimeEntry } from './timeentry.schema';
import { Observable, from, of } from 'rxjs';
import { mergeMap, mapTo, catchError } from 'rxjs/operators';

@Injectable()
export class TimeEntriesService {
  constructor(@InjectModel(TimeEntry.name) private teModel: Model<TimeEntry>) {}

  seedFromFileIfEmpty(filePath: string): Observable<void> {
    return from(this.teModel.estimatedDocumentCount()).pipe(
      mergeMap(count => {
        if (count > 0) return of(undefined);
        try {
          const raw = fs.readFileSync(filePath, 'utf8');
          const parsed = JSON.parse(raw);
          if (!Array.isArray(parsed)) return of(undefined);

          const docs = parsed.map((t: any) => ({
            id: t.id || t._id || '',
            taskId: t.taskId || t.task || t._taskId || '',
            userId: t.userId || t.user || '',
            durationMinutes: t.durationMinutes || t.duration || 0,
            note: t.note || t.description || '',
            startedAt: t.startedAt ? new Date(t.startedAt) : new Date(),
          }));

          return from(this.teModel.insertMany(docs)).pipe(mapTo(undefined));
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('Failed seeding time entries:', err);
          return of(undefined);
        }
      }),
      catchError(err => {
        // eslint-disable-next-line no-console
        console.error('Failed seeding time entries:', err);
        return of(undefined);
      })
    );
  }

  findAll(): Observable<TimeEntry[]> {
    return from(this.teModel.find().lean().exec());
  }
}
