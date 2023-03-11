import type {SQSHandler} from 'aws-lambda';

import {logger as rootLogger} from '@code-like-a-carpenter/logger';
import {captureException} from '@code-like-a-carpenter/telemetry';

import type {SQSCallback} from './types';

export function handleSQSEvent(cb: SQSCallback): SQSHandler {
  return async (event, context) => {
    const promises = event.Records.map(async (record) => {
      const logger = rootLogger.child({messageId: record.messageId});

      try {
        await cb(record, {context, logger});
      } catch (err) {
        // It's not really escaping, we're just rethrowing it so that it ends up
        // in the Promise.allSettled() results.
        captureException(err, false);
        throw err;
      }
    });

    const results = await Promise.allSettled(promises);

    return {
      batchItemFailures: results
        .filter((result) => result.status === 'rejected')
        .map((result, index) => ({
          itemIdentifier: event.Records[index].messageId,
        })),
    };
  };
}
