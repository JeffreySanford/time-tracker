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
  subprojects?: any[];

  @Prop({ type: [String], default: [] })
  features?: string[];

  @Prop({ type: [String], default: [] })
  notes?: string[];
}

export const ProjectSchema = SchemaFactory.createForClass(Project);
