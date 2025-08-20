import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ProjectsService } from './projects.service';
import { TaskService } from './task.service';
import { UsersService } from './users.service';
import { TagsService } from './tags.service';
import { KanbanColumnsService } from './kanbancolumns.service';
import { TimeEntriesService } from './timeentries.service';

async function bootstrap() {
  let mongoUri = 'mongodb://localhost:27017/time-tracker';
  try {
    if (process.env.NODE_ENV === 'development') {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      mongoUri = await mongod.getUri();
      process.env.MONGO_URI = mongoUri;
      console.log(`[MongoMemoryServer] Started in-memory MongoDB at: ${mongoUri}`);
    } else {
      console.log(`[MongoDB] Using persistent MongoDB at: ${mongoUri}`);
    }
    const app = await NestFactory.create(AppModule);

    // If running in development with an in-memory MongoDB, seed projects collection from the frontend JSON
  if (process.env.NODE_ENV === 'development') {
      try {
    // get the ProjectsService instance
    const projectsService = app.get(ProjectsService) as ProjectsService | null;
    if (projectsService && typeof projectsService.seedFromFileIfEmpty === 'function') {
          const projectsJsonPath = require('path').resolve(__dirname, '..', 'time-tracker', 'src', 'assets', 'projects.json');
          // the path above may not exist from api package; try relative to repo root fallback
          const fs = require('fs');
          let filePath = projectsJsonPath;
          if (!fs.existsSync(filePath)) {
            filePath = require('path').resolve(process.cwd(), 'apps', 'time-tracker', 'src', 'assets', 'projects.json');
          }
          await projectsService.seedFromFileIfEmpty(filePath);
        }
        // seed users and tags first so tasks can reference user IDs
        try {
          const usersService = app.get(UsersService) as UsersService | null;
          const tagsService = app.get(TagsService) as TagsService | null;
          const fs3 = require('fs');
          if (usersService && typeof usersService.seedFromFileIfEmpty === 'function') {
            let usersPath = require('path').resolve(__dirname, '..', 'time-tracker', 'src', 'assets', 'users.json');
            if (!fs3.existsSync(usersPath)) {
              usersPath = require('path').resolve(process.cwd(), 'apps', 'time-tracker', 'src', 'assets', 'users.json');
            }
            await usersService.seedFromFileIfEmpty(usersPath);
          }
          if (tagsService && typeof tagsService.seedFromFileIfEmpty === 'function') {
            let tagsPath = require('path').resolve(__dirname, '..', 'time-tracker', 'src', 'assets', 'tags.json');
            if (!fs3.existsSync(tagsPath)) {
              tagsPath = require('path').resolve(process.cwd(), 'apps', 'time-tracker', 'src', 'assets', 'tags.json');
            }
            await tagsService.seedFromFileIfEmpty(tagsPath);
          }
        } catch (err) {
          console.warn('Users/Tags seeding skipped due to error:', String(err));
        }

        // seed tasks as well using the TaskService if available (after users/tags)
        try {
          const taskService = app.get(TaskService) as TaskService | null;
          if (taskService && typeof taskService.seedFromFileIfEmpty === 'function') {
            const tasksJsonPath = require('path').resolve(__dirname, '..', 'time-tracker', 'src', 'assets', 'tasks.json');
            const fs2 = require('fs');
            let tasksFilePath = tasksJsonPath;
            if (!fs2.existsSync(tasksFilePath)) {
              tasksFilePath = require('path').resolve(process.cwd(), 'apps', 'time-tracker', 'src', 'assets', 'tasks.json');
            }
            await taskService.seedFromFileIfEmpty(tasksFilePath);
          }
        } catch (err) {
          console.warn('Task seeding skipped due to error:', String(err));
        }
        // seed kanban columns and time entries
        try {
          const kcSvc = app.get(KanbanColumnsService) as KanbanColumnsService | null;
          const teSvc = app.get(TimeEntriesService) as TimeEntriesService | null;
          const fs4 = require('fs');
          if (kcSvc && typeof kcSvc.seedFromFileIfEmpty === 'function') {
            let kcPath = require('path').resolve(__dirname, '..', 'time-tracker', 'src', 'assets', 'kanbanColumns.json');
            if (!fs4.existsSync(kcPath)) {
              kcPath = require('path').resolve(process.cwd(), 'apps', 'time-tracker', 'src', 'assets', 'kanbanColumns.json');
            }
            await kcSvc.seedFromFileIfEmpty(kcPath);
          }
          if (teSvc && typeof teSvc.seedFromFileIfEmpty === 'function') {
            let tePath = require('path').resolve(__dirname, '..', 'time-tracker', 'src', 'assets', 'timeEntries.json');
            if (!fs4.existsSync(tePath)) {
              tePath = require('path').resolve(process.cwd(), 'apps', 'time-tracker', 'src', 'assets', 'timeEntries.json');
            }
            await teSvc.seedFromFileIfEmpty(tePath);
          }
        } catch (err) {
          console.warn('Kanban/TimeEntries seeding skipped due to error:', String(err));
        }
      } catch (err) {
        console.warn('Project seeding skipped due to error:', String(err));
      }
    }
    
    // Enable CORS for frontend development and mobile testing (Android emulator/device)
    const allowedOrigins = [
      'http://localhost:4200',
      'http://10.0.2.2:4200', // Android emulator -> host localhost
      'capacitor://localhost',
      'http://localhost',
    ];

    const isDev = process.env.NODE_ENV === 'development';
    // allow local network IPs during development (e.g. http://192.168.1.194:4200)
    const localNetworkRegex = /^https?:\/\/(10\.|192\.168\.)\d{1,3}\.\d{1,3}(:\d+)?$/;

    app.enableCors({
      origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // allow requests with no origin (native apps, curl, server-to-server)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) return callback(null, true);
        if (isDev && localNetworkRegex.test(origin)) return callback(null, true);
        return callback(new Error('CORS policy: origin not allowed'), false);
      },
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      credentials: true,
    });
    
    await app.listen(3000);
    console.log(`[NestJS] Server started on http://localhost:3000`);
  } catch (err) {
    console.error('[MongoMemoryServer] Failed to start in-memory MongoDB:', err);
    process.exit(1);
  }
}
bootstrap();
