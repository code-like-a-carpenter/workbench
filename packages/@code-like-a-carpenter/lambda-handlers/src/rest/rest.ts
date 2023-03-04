import type {APIGatewayProxyHandler} from 'aws-lambda';

import {logger as rootLogger} from '@code-like-a-carpenter/logger';
import {instrumentRestHandler} from '@code-like-a-carpenter/telemetry';

import {
  formatErrorResult,
  formatEvent,
  formatSuccessResult,
} from './formatters';
import type {RestCallback, SimplifiedOperationObject} from './types';

/**
 * Creates a handler for an API Gateway REST API (aka, an API Gateway V1 API).
 */
export function handleRestEvent<O extends SimplifiedOperationObject>(
  callback: RestCallback<O>
): APIGatewayProxyHandler {
  return instrumentRestHandler(async (event, context) => {
    const restEvent = formatEvent(event);

    const logger = rootLogger.child({});

    try {
      const result = await callback(restEvent, {context, logger});
      return formatSuccessResult(result);
    } catch (err) {
      return formatErrorResult(err, restEvent, context);
    }
  });
}
