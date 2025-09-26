import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class Tag extends Document {
  @Prop({ required: true })
  override id?: string;

  @Prop()
  name?: string;

  @Prop()
  color?: string;
}

export const TagSchema = SchemaFactory.createForClass(Tag);
