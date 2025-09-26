import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema({ timestamps: true })
export class User extends Document {
  @Prop({ required: true })
  override id?: string;

  @Prop()
  name?: string;

  @Prop()
  email?: string;

  @Prop()
  avatarUrl?: string;

  @Prop()
  role?: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
