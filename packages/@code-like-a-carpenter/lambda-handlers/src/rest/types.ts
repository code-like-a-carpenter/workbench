import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context as LambdaContext,
} from 'aws-lambda';

import type {Logger} from '@code-like-a-carpenter/logger';

interface Context {
  context: LambdaContext;
  logger: Logger;
}

export interface RestCallbackEvent
  extends Omit<
    APIGatewayProxyEvent,
    | 'body'
    | 'headers'
    | 'multiValueHeaders'
    | 'multiValueQueryStringParameters'
    | 'pathParameters'
    | 'queryStringParameters'
  > {
  body: object;
  headers: Headers;
  /**
   * Kept primarily in event it's needed for doing certain kinds of digest
   * authentication
   */
  originalEvent: APIGatewayProxyEvent;
  pathParameters: Record<string, string | undefined>;
  queryStringParameters: URLSearchParams;
}

export interface RestCallbackResult
  extends Omit<APIGatewayProxyResult, 'body' | 'statusCode'> {
  statusCode: number;
  body: object;
}

export type RestCallback = (
  event: RestCallbackEvent,
  context: Context
) => Promise<RestCallbackResult>;
