import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type ProjectDocument = Project & Document;

@Schema({ timestamps: true })
export class Project {
  @Prop({ required: true })
  id!: string;

  @Prop({ required: true })
  name!: string;

  @Prop()
  color?: string;

  @Prop()
  bgColor?: string;

  @Prop()
  description?: string;

  @Prop()
  category?: string;

  @Prop()
  owner?: string;

  @Prop()
  progress?: number;

  @Prop({ type: [Object], default: [] })
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  subprojects?: any[];

  @Prop({ type: [String], default: [] })
  features?: string[];

  @Prop({ type: [String], default: [] })
  notes?: string[];

  @Prop({ default: true })
  isCodeProject?: boolean;

  @Prop({ default: true })
  isBillable?: boolean; // new billing flag
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
