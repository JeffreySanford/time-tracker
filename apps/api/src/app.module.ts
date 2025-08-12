
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TimeWorkedModule } from './timeworked.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useFactory: async () => ({
        uri: process.env.MONGO_URI || 'mongodb://localhost:27017/time-tracker',
      }),
    }),
    TimeWorkedModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
