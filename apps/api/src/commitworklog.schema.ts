import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'commit_work_logs', timestamps: true })
export class CommitWorkLog extends Document {
  @Prop({ required: true, unique: true })
  hash!: string;

  @Prop({ required: true })
  authorEmail!: string;

  @Prop() authorName?: string;

  @Prop({ required: true })
  timestamp!: Date; // commit time

  @Prop() message?: string;

  @Prop({ default: 'general' })
  category!: string;

  @Prop({ default: 'time-tracker' })
  repository!: string;

  @Prop({ default: 0 })
  additions!: number;

  @Prop({ default: 0 })
  deletions!: number;

  @Prop({ default: 0 })
  filesChanged!: number;

  @Prop({ type: [String], default: [] })
  paths!: string[];

  @Prop({ type: String })
  sessionId?: string; // FK-like to CommitSession.id

  @Prop({ default: 0 })
  estimatedMinutes!: number;

  @Prop({ default: 1 })
  estimationVersion!: number;

  @Prop({ type: Object })
  raw?: unknown; // raw parsed data for future recalculation
}

export const CommitWorkLogSchema = SchemaFactory.createForClass(CommitWorkLog);
