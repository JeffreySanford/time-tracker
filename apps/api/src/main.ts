import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

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
    
    // Enable CORS for frontend development
    app.enableCors({
      origin: ['http://localhost:4200'],
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
