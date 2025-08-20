import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as fs from 'fs';
import { Tag } from './tag.schema';
import { Observable, from, of } from 'rxjs';
import { mergeMap, mapTo, catchError } from 'rxjs/operators';

@Injectable()
export class TagsService {
  constructor(@InjectModel(Tag.name) private tagModel: Model<Tag>) {}

  seedFromFileIfEmpty(filePath: string): Observable<void> {
    return from(this.tagModel.estimatedDocumentCount()).pipe(
      mergeMap(count => {
        if (count > 0) return of(undefined);
        try {
          const raw = fs.readFileSync(filePath, 'utf8');
          const parsed = JSON.parse(raw);
          if (!Array.isArray(parsed)) return of(undefined);

          const docs = parsed.map((l: any) => ({
            id: l.id || l._id || '',
            name: l.name || '',
            color: l.color || ''
          }));

          return from(this.tagModel.insertMany(docs)).pipe(mapTo(undefined));
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('Failed seeding tags:', err);
          return of(undefined);
        }
      }),
      catchError(err => {
        // eslint-disable-next-line no-console
        console.error('Failed seeding tags:', err);
        return of(undefined);
      })
    );
  }
}
