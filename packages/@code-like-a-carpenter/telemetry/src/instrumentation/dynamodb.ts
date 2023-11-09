import type {Attributes} from '@opentelemetry/api';
import {SpanKind, trace} from '@opentelemetry/api';
import {BasicTracerProvider} from '@opentelemetry/sdk-trace-base';
import type {DynamoDBBatchResponse, DynamoDBStreamEvent} from 'aws-lambda';
import type {DynamoDBRecord} from 'aws-lambda/trigger/dynamodb-stream';

import {setupExceptionTracing} from '..';
import {runWithNewSpan} from '../run-with';

import type {NoVoidHandler} from './types';

export type NoVoidDynamoDBStreamHandler = NoVoidHandler<
  DynamoDBStreamEvent,
  DynamoDBBatchResponse
>;

export function instrumentDynamoDBStreamHandler(
  handler: NoVoidDynamoDBStreamHandler
): NoVoidDynamoDBStreamHandler {
  const tracedHandler = setupExceptionTracing(handler);

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
