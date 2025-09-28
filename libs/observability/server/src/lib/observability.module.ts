import { Global, Module, MiddlewareConsumer, Provider } from '@nestjs/common';
import { CorrelationMiddleware } from './correlation.middleware';
import { AuditService } from './audit.service';
import { RequestTimingInterceptor } from './request-timing.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ObservabilityController } from './observability.controller';

function isEnabled() {
  return (
    process.env['OBS_ENABLE'] === '1' || process.env['OBS_ENABLE'] === 'true'
  );
}

function buildInterceptorProvider(): Provider | undefined {
  if (!isEnabled()) return undefined;
  return { provide: APP_INTERCEPTOR, useClass: RequestTimingInterceptor };
}

@Global()
@Module({
  controllers: isEnabled() ? [ObservabilityController] : [],
  providers: [
    AuditService,
    ...(buildInterceptorProvider() ? [buildInterceptorProvider()!] : []),
  ],
  exports: [AuditService],
})
export class ObservabilityModule {
  configure(consumer: MiddlewareConsumer) {
    if (isEnabled()) {
      consumer.apply(CorrelationMiddleware).forRoutes('*');
    }
  }
}
