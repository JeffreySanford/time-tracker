import { Module } from '@nestjs/common';
import { TimeWorkedModule } from './timeworked.module';
import { HealthController } from './health.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ProjectsService } from './projects.service';
import { ProjectsController } from './projects.controller';
import { Project, ProjectSchema } from './project.schema';
import { TaskService } from './task.service';
import { TasksController } from './tasks.controller';
import { Task, TaskSchema } from './task.schema';
import { UsersService } from './users.service';
import { TagsService } from './tags.service';
import { User, UserSchema } from './user.schema';
import { Tag, TagSchema } from './tag.schema';
import { KanbanColumnsService } from './kanbancolumns.service';
import { KanbanColumn, KanbanColumnSchema } from './kanbancolumn.schema';
import { TimeEntriesService } from './timeentries.service';
import { TimeEntry, TimeEntrySchema } from './timeentry.schema';
import { KanbanColumnsController } from './kanbancolumns.controller';
import { TimeEntriesController } from './timeentries.controller';
import { SeedingStateService } from './seeding-state.service';
import { CommitWorkLog, CommitWorkLogSchema } from './commitworklog.schema';
import { CommitSession, CommitSessionSchema } from './commitsession.schema';
import { GitIngestService } from './git-ingest.service';
import { GitIngestController } from './git-ingest.controller';
import { ObservabilityModule } from '@time-tracker/observability-server';

@Module({
  imports: [
    ObservabilityModule,
    MongooseModule.forRootAsync({
      useFactory: async () => {
        // Prefer explicit MONGO_URI when provided
        let uri = process.env['MONGO_URI'];
        if (uri) {
          // use provided URI
          console.log('[MongoDB] Using MONGO_URI from environment');
          return { uri };
        }

        // Try localhost first (matches previous behavior)
        const local = 'mongodb://localhost:27017/time-tracker';
        // If we cannot rely on a local mongod, start an in-memory server for dev
        try {
          console.log(
            '[MongoDB] No MONGO_URI provided; starting in-memory MongoDB for development...',
          );
          const mongod = await MongoMemoryServer.create();
          uri = mongod.getUri();
          console.log('[MongoDB] Using in-memory MongoDB at:', uri);
          return { uri };
        } catch (err) {
          // fallback to localhost if in-memory cannot be started
          console.warn(
            '[MongoDB] Failed to start in-memory MongoDB, falling back to localhost:',
            err,
          );
          return { uri: local };
        }
      },
    }),
    TimeWorkedModule,
    MongooseModule.forFeature([
      { name: Project.name, schema: ProjectSchema },
      { name: Task.name, schema: TaskSchema },
      { name: User.name, schema: UserSchema },
      { name: Tag.name, schema: TagSchema },
      { name: KanbanColumn.name, schema: KanbanColumnSchema },
      { name: TimeEntry.name, schema: TimeEntrySchema },
      { name: CommitWorkLog.name, schema: CommitWorkLogSchema },
      { name: CommitSession.name, schema: CommitSessionSchema },
    ]),
  ],
  controllers: [
    HealthController,
    ProjectsController,
    TasksController,
    KanbanColumnsController,
    TimeEntriesController,
    GitIngestController,
  ],
  providers: [
    ProjectsService,
    TaskService,
    UsersService,
    TagsService,
    KanbanColumnsService,
    TimeEntriesService,
    SeedingStateService,
    GitIngestService,
  ],
})
export class AppModule {}
