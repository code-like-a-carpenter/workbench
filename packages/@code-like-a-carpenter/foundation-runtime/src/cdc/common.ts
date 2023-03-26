import type {AttributeValue} from '@aws-sdk/client-dynamodb';
import type {NativeAttributeValue} from '@aws-sdk/util-dynamodb';
import {unmarshall} from '@aws-sdk/util-dynamodb';
import type {
  Context,
  DynamoDBRecord,
  SQSHandler,
  StreamRecord,
} from 'aws-lambda';

import {assert} from '@code-like-a-carpenter/assert';
import {handleSQSEvent} from '@code-like-a-carpenter/lambda-handlers';
import {runWithNewSpan} from '@code-like-a-carpenter/telemetry';

import {AlreadyExistsError, OptimisticLockingError} from '../errors';

export type Callback = (
  record: UnmarshalledDynamoDBRecord,
  context: Context
) => Promise<void>;

export type Handler = SQSHandler;

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

type UnmarshalledStreamRecord = Omit<StreamRecord, 'NewImage' | 'OldImage'> & {
  NewImage?: Record<string, NativeAttributeValue> | undefined;
  OldImage?: Record<string, NativeAttributeValue> | undefined;
};
export type UnmarshalledDynamoDBRecord = Omit<DynamoDBRecord, 'dynamodb'> & {
  dynamodb: UnmarshalledStreamRecord;
};

export type VoidCallback = () => Promise<void>;

/**
 * Retries a callback up to 3 times in event of data freshness errors.
 */
export async function retry(cb: VoidCallback) {
  const maxAttempts = 5;
  for (let i = 0; i < maxAttempts; i++) {
    try {
      await runWithNewSpan(
        'retry',
        {
          attributes: {
            'com.code-like-a-carpenter.data.attempt': i,
            'com.code-like-a-carpenter.data.total_attempts': maxAttempts,
          },
        },
        cb
      );
      // terminate loop early because we've succeeded.
      return;
    } catch (err) {
      if (
        err instanceof AlreadyExistsError ||
        err instanceof OptimisticLockingError
      ) {
        await new Promise((resolve) =>
          setTimeout(resolve, (i + 1) * (1 + 1) * 1000)
        );
      } else {
        throw err;
      }
    }
  }
}

/** Unmarshalls a DynamoDB record so it can be used like something reasonable */
export function unmarshallRecord(
  ddbRecord: DynamoDBRecord
): UnmarshalledDynamoDBRecord {
  return {
    ...ddbRecord,
    dynamodb: {
      ...ddbRecord.dynamodb,
      NewImage: ddbRecord.dynamodb?.NewImage
        ? unmarshall(
            ddbRecord.dynamodb.NewImage as Record<string, AttributeValue>
          )
        : undefined,
      OldImage: ddbRecord.dynamodb?.OldImage
        ? unmarshall(
            ddbRecord.dynamodb.OldImage as Record<string, AttributeValue>
          )
        : undefined,
    },
  };
}
