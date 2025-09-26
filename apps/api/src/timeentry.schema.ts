import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class TimeEntry extends Document {
  @Prop({ required: true })
  override id?: string;

  @Prop()
  taskId?: string;

  @Prop()
  userId?: string;

  @Prop()
  start?: Date;

  @Prop()
  end?: Date;

  @Prop()
  minutes?: number;

  @Prop()
  billable?: boolean;
}

export const TimeEntrySchema = SchemaFactory.createForClass(TimeEntry);
