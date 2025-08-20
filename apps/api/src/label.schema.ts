import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Label extends Document {
  @Prop({ required: true })
  id?: string;

  @Prop()
  name?: string;

  @Prop()
  color?: string;
}

export const LabelSchema = SchemaFactory.createForClass(Label);
