import type {Attributes, SpanOptions} from '@opentelemetry/api';
import {SpanKind} from '@opentelemetry/api';
import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context,
  DynamoDBStreamEvent,
  SQSEvent,
} from 'aws-lambda';
import type {
  APIGatewayAuthorizerResult,
  APIGatewayTokenAuthorizerEvent,
} from 'aws-lambda/trigger/api-gateway-authorizer.js';

import {runWithNewSpan} from './run-with.ts';

interface DynamoDBStreamHandlerResult {
  batchItemFailures: {itemIdentifier: string}[];
}

export function withTelemetry<
  E extends
    | APIGatewayProxyEvent
    | APIGatewayTokenAuthorizerEvent
    | DynamoDBStreamEvent
    | SQSEvent,
  C extends Context,
  R extends
    | APIGatewayProxyResult
    | APIGatewayAuthorizerResult
    | DynamoDBStreamHandlerResult
    | void,
>(
  name: string,
  options: SpanOptions,
  fn: (event: E, context: C) => Promise<R>
) {
  let cold = true;
  return async (event: E, context: C): Promise<R> => {
    const wasCold = cold;
    cold = false;

    const {attributes: baseAttributes = {}, kind: k, ...rest} = options;
    let kind = k ?? SpanKind.SERVER;

    let attributes: Attributes = {
      ...baseAttributes,
      'aws.lambda.invoked_arn': context.invokedFunctionArn,
      'cloud.account.id': context.invokedFunctionArn.split(':')[5],
      'faas.coldstart': wasCold,
      'faas.execution': context.awsRequestId,
      'faas.id': `${context.invokedFunctionArn
        .split(':')
        .slice(0, 7)
        .join(':')}:${context.functionVersion}`,
    };

    if ('authorizationToken' in event && 'type' in event) {
      name = 'authorize';
    } else if ('httpMethod' in event) {
      attributes = {
        ...attributes,
        'faas.trigger': 'http',
        'http.host': event.requestContext.domainName,
        'http.method': event.httpMethod,
        'http.route': event.resource,
        'http.schema': 'https',
        'http.target': event.path,
      };
      name = event.resource;
    } else if ('Records' in event && 'dynamodb' in event.Records[0]) {
      kind = SpanKind.CONSUMER;
      name = `aws:dynamodb process`;
    } else if ('Records' in event && 'messageAttributes' in event.Records[0]) {
      const eventSource =
        (event as SQSEvent).Records.reduce(
          (acc, record) => acc.add(record.eventSource),
          new Set<string>()
        ).size === 1
          ? event.Records[0].eventSource
          : 'multiple_sources';
      name = `${eventSource} process`;
    }

    return runWithNewSpan(name, {attributes, kind, ...rest}, async (span) => {
      const result = await fn(event, context);
      if (result && typeof result === 'object' && 'statusCode' in result) {
        span.setAttribute('http.status_code', result.statusCode);
      }
      return result;
    });
  };
}
