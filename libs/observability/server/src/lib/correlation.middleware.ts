import { Injectable, NestMiddleware } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class CorrelationMiddleware implements NestMiddleware {
  use(req: Request & { id?: string }, res: Response, next: NextFunction) {
    const existing = (req.headers['x-request-id'] as string) || undefined;
    const id = existing || randomUUID();
    req.id = id;
    res.setHeader('x-request-id', id);
    next();
  }
}
