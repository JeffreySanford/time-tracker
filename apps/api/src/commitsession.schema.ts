import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ collection: 'commit_sessions', timestamps: true })
export class CommitSession extends Document {
  @Prop({ required: true, unique: true })
  id!: string; // UUID

  @Prop({ required: true })
  authorEmail!: string;

  @Prop({ required: true })
  startTs!: Date;

  @Prop({ required: true })
  endTs!: Date;

  @Prop({ default: 0 })
  totalEstimatedMinutes!: number;

  @Prop({ default: 0 })
  commitCount!: number;

  @Prop({ type: Object, default: {} })
  categoriesSummary!: Record<string, number>; // category -> minutes

  @Prop({ type: Object, default: {} })
  tasksSummary!: Record<string, number>; // taskToken -> minutes aggregated
}

export const CommitSessionSchema = SchemaFactory.createForClass(CommitSession);
