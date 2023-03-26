import {PutEventsCommand} from '@aws-sdk/client-eventbridge';
import type {DynamoDBStreamHandler} from 'aws-lambda';

import {assert} from '@code-like-a-carpenter/assert';
import {handleDynamoDBStreamEvent} from '@code-like-a-carpenter/lambda-handlers';

import type {WithEventBridge, WithTableName} from '../types';

/** Factory for creating a table dispatcher. */
export function makeDynamoDBStreamDispatcher({
  eventBridge,
  tableName,
}: WithEventBridge & WithTableName): DynamoDBStreamHandler {
  return handleDynamoDBStreamEvent(async (record) => {
    const modelName = record.dynamodb?.NewImage?._et.S;
    assert(
      modelName,
      'DynamoDB Stream Event emitted for record without an "_et" field.'
    );

    const entry = {
      Detail: JSON.stringify(record),
      DetailType: record.eventName,
      Resources: record.eventSourceARN
        ? [record.eventSourceARN.split('/stream')[0]]
        : [],
      Source: [tableName, modelName].join('.'),
      Time: record.dynamodb?.ApproximateCreationDateTime
        ? new Date(record.dynamodb.ApproximateCreationDateTime)
        : undefined,
    };

    await eventBridge.send(
      new PutEventsCommand({
        Entries: [entry],
      })
    );
  });
}
