import type {DynamoDBStreamHandler} from 'aws-lambda';

import {assert} from '@code-like-a-carpenter/assert';
import {logger as rootLogger} from '@code-like-a-carpenter/logger';

import type {DynamoCallback} from './types';

export function handleDynamoDBStreamEvent(
  cb: DynamoCallback
): DynamoDBStreamHandler {
  return async (event, context) => {
    const promises = event.Records.map(async (record) => {
      const logger = rootLogger.child({eventID: record.eventID});

      return await cb(record, {context, logger});
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
  };
}
