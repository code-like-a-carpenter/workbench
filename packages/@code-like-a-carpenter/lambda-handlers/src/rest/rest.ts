import type {APIGatewayProxyHandler} from 'aws-lambda';
import type {Schema} from 'zod';
import {ZodError} from 'zod';
import {fromZodError} from 'zod-validation-error';

import {logger as rootLogger} from '@code-like-a-carpenter/logger';
import type {ExceptionTracingService} from '@code-like-a-carpenter/telemetry';
import {instrumentRestHandler} from '@code-like-a-carpenter/telemetry';

import {
  formatEarlyErrorResult,
  formatErrorResult,
  formatEvent,
  formatSuccessResult,
} from './formatters.ts';
import type {RestCallback, SimplifiedOperationObject} from './types.ts';

/**
 * Creates a handler for an API Gateway REST API (aka, an API Gateway V1 API).
 */
export function handleRestEvent<O extends SimplifiedOperationObject>(
  callback: RestCallback<O>,
  /**
   * If your service doesn't need exception tracing, you can pass in the
   * `noopExceptionTracingService`. Rather than making this field optional, I
   * decided that far fewer mistakes will be made if you have to explicitly
   * choose not to use tracing.
   */
  exceptionTracingService: ExceptionTracingService,
  schema?: Schema
): APIGatewayProxyHandler {
  return instrumentRestHandler(async (event, context) => {
    let restEvent;
    try {
      restEvent = formatEvent(event, schema);
    } catch (err) {
      if (err instanceof ZodError) {
        return {
          body: JSON.stringify({
            error: err,
            errors: err.errors,
            message: fromZodError(err).toString(),
            name: err.name,
            requestIds: {
              awsRequestId: context.awsRequestId,
              requestId: event.requestContext.requestId,
              xAmznTraceId: event.headers?.['X-Amzn-Trace-Id'],
            },
          }),
          statusCode: 400,
        };
      }
      return formatEarlyErrorResult(err, event, context);
    }

    const logger = rootLogger.child({});

    try {
      const result = await callback(restEvent, {context, logger});
      return formatSuccessResult(result);
    } catch (err) {
      return formatErrorResult(err, restEvent, context);
    }
  }, exceptionTracingService);
}
