import type {APIGatewayProxyHandler} from 'aws-lambda';

import {logger as rootLogger} from '@code-like-a-carpenter/logger';

import {
  formatErrorResult,
  formatEvent,
  formatSuccessResult,
} from './formatters';
import type {RestCallback} from './types';

/**
 * Creates a handler for an API Gateway REST API (aka, an API Gateway V1 API).
 */
export function handleRestEvent(
  callback: RestCallback
): APIGatewayProxyHandler {
  return async (event, context) => {
    const restEvent = formatEvent(event);

    const logger = rootLogger.child({});

    try {
      const result = await callback(restEvent, {context, logger});
      return formatSuccessResult(result);
    } catch (err) {
      return formatErrorResult(err, restEvent, context);
    }
  };
}
