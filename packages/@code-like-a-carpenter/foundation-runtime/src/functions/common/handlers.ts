import type {Context, SQSHandler} from 'aws-lambda';

import {assert} from '@code-like-a-carpenter/assert';
import {handleSQSEvent} from '@code-like-a-carpenter/lambda-handlers';

import {retry} from './retry';
import type {UnmarshalledDynamoDBRecord} from './unmarshall-record';
import {unmarshallRecord} from './unmarshall-record';

export type Callback = (
  record: UnmarshalledDynamoDBRecord,
  context: Context
) => Promise<void>;

export type Handler = SQSHandler;

/** Makes a handler the dispatched event from a DynamoDB Stream. */

/** Make a handler for an SQS event */
export function makeSqsHandler(cb: Callback): Handler {
  return handleSQSEvent(async (record, context) => {
    const eventBridgeRecord = JSON.parse(record.body);

    assert(
      'detail' in eventBridgeRecord,
      'EventBridge record is missing "detail" field'
    );
    assert(
      'dynamodb' in eventBridgeRecord.detail,
      'EventBridge record is missing "detail.dynamodb" field'
    );
    const ddbRecord = eventBridgeRecord.detail;

    const unmarshalledRecord = unmarshallRecord(ddbRecord);

    return await retry(() => cb(unmarshalledRecord, context.context));
  });
}
