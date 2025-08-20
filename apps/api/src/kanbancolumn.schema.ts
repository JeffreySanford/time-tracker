import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class KanbanColumn extends Document {
  @Prop({ required: true })
  id?: string;

  @Prop()
  name?: string;
}

export const KanbanColumnSchema = SchemaFactory.createForClass(KanbanColumn);
