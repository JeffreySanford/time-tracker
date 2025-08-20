import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as fs from 'fs';
import { User } from './user.schema';
import { Observable, from, of } from 'rxjs';
import { mergeMap, mapTo, catchError } from 'rxjs/operators';

@Injectable()
export class UsersService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  seedFromFileIfEmpty(filePath: string): Observable<void> {
    return from(this.userModel.estimatedDocumentCount()).pipe(
      mergeMap(count => {
        if (count > 0) return of(undefined);
        try {
          const raw = fs.readFileSync(filePath, 'utf8');
          const parsed = JSON.parse(raw);
          if (!Array.isArray(parsed)) return of(undefined);

          const docs = parsed.map((u: any) => ({
            id: u.id || u._id || '',
            name: u.name || '',
            email: u.email || '',
            avatarUrl: u.avatarUrl || '',
            role: u.role || ''
          }));

          return from(this.userModel.insertMany(docs)).pipe(mapTo(undefined));
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error('Failed seeding users:', err);
          return of(undefined);
        }
      }),
      catchError(err => {
        // eslint-disable-next-line no-console
        console.error('Failed seeding users:', err);
        return of(undefined);
      })
    );
  }
}
