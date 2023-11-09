import type {Attributes} from '@opentelemetry/api';
import {SpanKind, trace} from '@opentelemetry/api';
import {BasicTracerProvider} from '@opentelemetry/sdk-trace-base';
import type {APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda';

import {setupExceptionTracing} from '..';
import {runWithNewSpan} from '../run-with';

import type {NoVoidHandler} from './types';

/**
 * Like APIGatewayProxyHandler, but requires the promise form and disallows the
 * nodeback form.
 */
export type NoVoidAPIGatewayProxyHandler = NoVoidHandler<
  APIGatewayProxyEvent,
  APIGatewayProxyResult
>;

/**
 * Instruments a REST API (API Gateway V1) handler.
 *
 * Do not use this in addition to `withTelemetry`. `withTelemetry` is on its way
 * to being deprecated and does exactly the same thing but in a more general and
 * harder to read way.
 */
export function instrumentRestHandler(
  handler: NoVoidAPIGatewayProxyHandler
): NoVoidAPIGatewayProxyHandler {
  const tracedHandler = setupExceptionTracing(handler);

  let cold = true;
  return async (event, context) => {
    try {
      const wasCold = cold;
      cold = false;

      const attributes: Attributes = {
        'aws.lambda.invoked_arn': context.invokedFunctionArn,
        'cloud.account.id': context.invokedFunctionArn.split(':')[5],
        'faas.coldstart': wasCold,
        'faas.execution': context.awsRequestId,
        'faas.id': `${context.invokedFunctionArn
          .split(':')
          .slice(0, 7)
          .join(':')}:${context.functionVersion}`,
        'faas.trigger': 'http',
        'http.host': event.requestContext.domainName,
        'http.method': event.httpMethod,
        'http.route': event.resource,
        'http.schema': 'https',
        'http.target': event.path,
      };

      return await runWithNewSpan(
        event.resource,
        {attributes, kind: SpanKind.SERVER},
        async (span) => {
          const result = await tracedHandler(event, context);
          if ('statusCode' in result) {
            span.setAttribute('http.status_code', result.statusCode);
          }
          return result;
        }
      );
    } finally {
      const provider = trace.getTracerProvider();
      if (provider instanceof BasicTracerProvider) {
        await provider.forceFlush();
      }
    }
  };
}
