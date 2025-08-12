import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TimeWorkedService } from './timeworked.service';
import { TimeWorkedController } from './timeworked.controller';
import { TimeWorked, TimeWorkedSchema } from './timeworked.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: TimeWorked.name, schema: TimeWorkedSchema },
    ]),
  ],
  providers: [TimeWorkedService],
  controllers: [TimeWorkedController],
})
export class TimeWorkedModule {}
