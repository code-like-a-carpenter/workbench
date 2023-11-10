import type {EventBridgeClient} from '@aws-sdk/client-eventbridge';

import type {ExceptionTracingService} from '@code-like-a-carpenter/telemetry';

export interface WithTableName {
  tableName: string;
}

export interface WithEventBridge {
  eventBridge: EventBridgeClient;
}

export interface WithExceptionTracing {
  exceptionTracingService: ExceptionTracingService;
}
