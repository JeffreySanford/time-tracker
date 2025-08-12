import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema()
export class TimeWorked {
  @Prop({ required: true })
  userId!: string;

  @Prop({ required: true })
  duration!: number; // seconds

  @Prop({ required: true })
  startedAt!: Date;

  @Prop({ required: false, type: Date })
  endedAt?: Date | null;
}

export const TimeWorkedSchema = SchemaFactory.createForClass(TimeWorked);
