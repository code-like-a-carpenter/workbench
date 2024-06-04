import type {DynamoDBStreamHandler} from 'aws-lambda';

import {assert} from '@code-like-a-carpenter/assert';
import {logger as rootLogger} from '@code-like-a-carpenter/logger';
import type {ExceptionTracingService} from '@code-like-a-carpenter/telemetry';
import {
  instrumentDynamoDBRecordHandler,
  instrumentDynamoDBStreamHandler,
} from '@code-like-a-carpenter/telemetry';

import type {DynamoCallback} from './types.ts';

export function handleDynamoDBStreamEvent(
  cb: DynamoCallback,
  /**
   * If your service doesn't need exception tracing, you can pass in the
   * `noopExceptionTracingService`. Rather than making this field optional, I
   * decided that far fewer mistakes will be made if you have to explicitly
   * choose not to use tracing.
   */
  exceptionTracingService: ExceptionTracingService
): DynamoDBStreamHandler {
  const instrumentedCb = instrumentDynamoDBRecordHandler(cb);
  return instrumentDynamoDBStreamHandler(async (event, context) => {
    const promises = event.Records.map(async (record) => {
      const logger = rootLogger.child({eventID: record.eventID});

      return await instrumentedCb(record, {context, logger});
    });

    const results = await Promise.allSettled(promises);

    return {
      batchItemFailures: results
        .filter((result) => result.status === 'rejected')
        .map((result, index) => {
          const record = event.Records[index];
          assert(
            typeof record !== 'undefined',
            'Record missing from DynamoDB Stream Event'
          );
          const {dynamodb} = record;
          assert(
            typeof dynamodb !== 'undefined',
            'dynamodb missing from DynamoDB Stream Event'
          );
          const {SequenceNumber} = dynamodb;
          assert(
            typeof SequenceNumber !== 'undefined',
            'SequenceNumber missing from DynamoDB Record. You need to specify FunctionResponseTypes[].ReportBatchItemFailures in your CloudFormation template.'
          );

          return {
            itemIdentifier: SequenceNumber,
          };
        }),
    };
  }, exceptionTracingService);
}
