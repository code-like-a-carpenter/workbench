import type {Attributes} from '@opentelemetry/api';
import {SpanKind, trace} from '@opentelemetry/api';
import {BasicTracerProvider} from '@opentelemetry/sdk-trace-base';
import type {DynamoDBBatchResponse, DynamoDBStreamEvent} from 'aws-lambda';
import type {DynamoDBRecord} from 'aws-lambda/trigger/dynamodb-stream';

import type {ExceptionTracingService} from '../index.ts';
import {setupExceptionTracing} from '../index.ts';
import {runWithNewSpan} from '../run-with.ts';

import type {NoVoidHandler} from './types.ts';

export type NoVoidDynamoDBStreamHandler = NoVoidHandler<
  DynamoDBStreamEvent,
  DynamoDBBatchResponse
>;

export function instrumentDynamoDBStreamHandler(
  handler: NoVoidDynamoDBStreamHandler,
  /**
   * If your service doesn't need exception tracing, you can pass in the
   * `noopExceptionTracingService`. Rather than making this field optional, I
   * decided that far fewer mistakes will be made if you have to explicitly
   * choose not to use tracing.
   */
  exceptionTracingService: ExceptionTracingService
): NoVoidDynamoDBStreamHandler {
  const tracedHandler = setupExceptionTracing(handler, exceptionTracingService);

  let cold = true;
  return async (event, context) => {
    try {
      const wasCold = cold;
      cold = false;

      const attributes: Attributes = {
        'aws.lambda.invoked_arn': context.invokedFunctionArn,
        'cloud.account.id': context.invokedFunctionArn.split(':')[5],
        'faas.coldstart': wasCold,
        'faas.execution': context.awsRequestId,
        'faas.id': `${context.invokedFunctionArn
          .split(':')
          .slice(0, 7)
          .join(':')}:${context.functionVersion}`,
        'faas.trigger': 'datasource',
      };

      return await runWithNewSpan(
        'aws:dynamodb process',
        {
          attributes,
          kind: SpanKind.CONSUMER,
        },
        () => tracedHandler(event, context)
      );
    } finally {
      const provider = trace.getTracerProvider();
      if (provider instanceof BasicTracerProvider) {
        await provider.forceFlush();
      }
    }
  };
}

export interface DynamoDBRecordHandler<T> {
  (record: DynamoDBRecord, context: T): Promise<void>;
}

export function instrumentDynamoDBRecordHandler<T>(
  cb: DynamoDBRecordHandler<T>
): DynamoDBRecordHandler<T> {
  return async (record, context) => {
    const attributes: Attributes = {
      'faas.document.collection': record.eventSourceARN?.split('/')[1],
      'faas.document.name': JSON.stringify(record.dynamodb?.Keys),
      'faas.document.operation': record.eventName?.toLowerCase(),
      'faas.document.time': record.dynamodb?.ApproximateCreationDateTime,
      'faas.trigger': 'datasource',
    };

    return await runWithNewSpan(
      'aws:dynamodb process record',
      {
        attributes,
        kind: SpanKind.CONSUMER,
      },
      () => cb(record, context)
    );
  };
}
