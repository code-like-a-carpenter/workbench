import type {SQSHandler} from 'aws-lambda';

import {logger as rootLogger} from '@code-like-a-carpenter/logger';
import type {ExceptionTracingService} from '@code-like-a-carpenter/telemetry';
import {
  captureException,
  instrumentSQSHandler,
  instrumentSQSMessageHandler,
} from '@code-like-a-carpenter/telemetry';

import type {SQSCallback} from './types';

export function handleSQSEvent(
  cb: SQSCallback /**
   * If your service doesn't need exception tracing, you can pass in the
   * `noopExceptionTracingService`. Rather than making this field optional, I
   * decided that far fewer mistakes will be made if you have to explicitly
   * choose not to use tracing.
   */,
  exceptionTracingService: ExceptionTracingService
): SQSHandler {
  const instrumentedCb = instrumentSQSMessageHandler(cb);
  return instrumentSQSHandler(async (event, context) => {
    const promises = event.Records.map(async (record) => {
      const logger = rootLogger.child({messageId: record.messageId});

      try {
        await instrumentedCb(record, {context, logger});
      } catch (err) {
        // It's not really escaping, we're just rethrowing it so that it ends up
        // in the Promise.allSettled() results.
        captureException(err, false, logger);
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
  }, exceptionTracingService);
}
