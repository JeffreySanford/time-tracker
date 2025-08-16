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
