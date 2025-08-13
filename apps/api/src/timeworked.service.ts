import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { TimeWorked } from './timeworked.schema';
import { Observable, from } from 'rxjs';

@Injectable()
export class TimeWorkedService {
  constructor(
    @InjectModel(TimeWorked.name) private timeWorkedModel: Model<TimeWorked>
  ) {}


  startSession(userId: string): Observable<TimeWorked> {
    const startedAt = new Date();
    const session = new this.timeWorkedModel({
      userId,
      startedAt,
      duration: 0,
      endedAt: null,
    });
    return from(session.save());
  }

  stopSession(id: string, endedAt?: Date): Observable<TimeWorked> {
    return from(
      this.timeWorkedModel.findById(id).then(session => {
        if (!session) throw new Error('Session not found');
        session.endedAt = endedAt || new Date();
        session.duration = Math.floor((session.endedAt.getTime() - session.startedAt.getTime()) / 1000);
        return session.save();
      })
    );
  }

  findAll(): Observable<TimeWorked[]> {
    return from(this.timeWorkedModel.find().exec());
  }
}
