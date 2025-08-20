import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as fs from 'fs';
import { Label } from './label.schema';
import { Observable, from, of } from 'rxjs';
import { mergeMap, mapTo, catchError } from 'rxjs/operators';

@Injectable()
export class LabelsService {
  constructor(@InjectModel(Label.name) private labelModel: Model<Label>) {}

  seedFromFileIfEmpty(filePath: string): Observable<void> {
    return from(this.labelModel.estimatedDocumentCount()).pipe(
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

          return from(this.labelModel.insertMany(docs)).pipe(mapTo(undefined));
        } catch (err) {
           
          console.error('Failed seeding labels:', err);
          return of(undefined);
        }
      }),
      catchError(err => {
         
        console.error('Failed seeding labels:', err);
        return of(undefined);
      })
    );
  }
}
