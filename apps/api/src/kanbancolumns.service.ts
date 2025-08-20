import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as fs from 'fs';
import { KanbanColumn } from './kanbancolumn.schema';
import { Observable, from, of } from 'rxjs';
import { mergeMap, mapTo, catchError } from 'rxjs/operators';

@Injectable()
export class KanbanColumnsService {
  constructor(@InjectModel(KanbanColumn.name) private colModel: Model<KanbanColumn>) {}

  seedFromFileIfEmpty(filePath: string): Observable<void> {
    return from(this.colModel.estimatedDocumentCount()).pipe(
      mergeMap(count => {
        if (count > 0) return of(undefined);

        try {
          const raw = fs.readFileSync(filePath, 'utf8');
          const parsed = JSON.parse(raw);
          if (!Array.isArray(parsed)) return of(undefined);

          const docs = parsed.map((c: any) => ({ id: c.id || c._id || '', name: c.name || '' }));
          return from(this.colModel.insertMany(docs)).pipe(mapTo(undefined));
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('Failed seeding kanban columns:', err);
          return of(undefined);
        }
      }),
      catchError(err => {
        // eslint-disable-next-line no-console
        console.error('Failed seeding kanban columns:', err);
        return of(undefined);
      })
    );
  }

  findAll(): Observable<KanbanColumn[]> {
    return from(this.colModel.find().lean().exec());
  }
}
