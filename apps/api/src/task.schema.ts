import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class Task {
  @Prop({ required: true })
  title!: string;

  @Prop({ required: false })
  description?: string;

  @Prop({ required: true })
  project!: string;

  @Prop({ required: true, type: [String] })
  tags!: string[];

  @Prop({ required: true, enum: ['active', 'completed', 'backlog'] })
  status!: 'active' | 'completed' | 'backlog';

  @Prop({ required: true, default: 0 })
  timeSpent!: number;

  @Prop({ required: false, type: Date })
  startTime?: Date;

  @Prop({ required: false, type: Date })
  endTime?: Date;

  @Prop({ required: true, default: Date.now })
  createdAt!: Date;

  @Prop({ required: false, enum: ['low', 'medium', 'high'], default: 'medium' })
  priority?: 'low' | 'medium' | 'high';

  @Prop({ required: false })
  estimatedTime?: number;

  @Prop({ required: true })
  userId!: string;
}

export const TaskSchema = SchemaFactory.createForClass(Task);
