import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project, ProjectDocument } from './project.schema';
import * as fs from 'fs';
import * as path from 'path';
import { Observable, from, of } from 'rxjs';
import { mergeMap, mapTo, catchError } from 'rxjs/operators';

@Injectable()
export class ProjectsService {
  private readonly logger = new Logger(ProjectsService.name);

  constructor(@InjectModel(Project.name) private projectModel: Model<ProjectDocument>) {}

  seedFromFileIfEmpty(filePath: string): Observable<void> {
    return from(this.projectModel.estimatedDocumentCount()).pipe(
      mergeMap(count => {
        if (count > 0) {
          this.logger.log('Projects collection already has data; skipping seed.');
          return of(undefined);
        }

        try {
          const raw = fs.readFileSync(filePath, 'utf8');
          const parsed = JSON.parse(raw);
          if (!Array.isArray(parsed)) return of(undefined);

          return from(this.projectModel.insertMany(parsed.map(p => ({ ...p })))).pipe(
            mapTo(undefined)
          );
        } catch (err) {
          this.logger.error('Failed seeding projects:', err);
          return of(undefined);
        }
      }),
      catchError(err => {
        this.logger.error('Failed seeding projects:', err);
        return of(undefined);
      })
    );
  }

  findById(id: string): Observable<any> {
    return from(this.projectModel.findOne({ id }).lean().exec());
  }
}
