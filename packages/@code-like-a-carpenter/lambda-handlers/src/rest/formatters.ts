import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Context as LambdaContext,
} from 'aws-lambda';

import {assert} from '@code-like-a-carpenter/assert';
import {HttpException} from '@code-like-a-carpenter/errors';

import type {RestCallbackEvent, RestCallbackResult} from './types';

function safeJsonParse(obj: string) {
  try {
    return JSON.parse(obj);
  } catch (err) {
    return obj;
  }
}

function safeUrlEncodedParse(body: string) {
  const params = new URLSearchParams(body);
  // Some clients (namely, the Dredd test runner), add "[]" to the end of field
  // names, which _is not_ expected by new URLSearchParams().
  params.forEach((value, key) => {
    if (key.endsWith('[]')) {
      params.set(key.slice(0, -2), value);
    }
  });
  return params;
}

export function formatEvent(event: APIGatewayProxyEvent): RestCallbackEvent {
  const {
    body,
    pathParameters,
    headers,
    multiValueHeaders,
    multiValueQueryStringParameters,
    queryStringParameters,
    ...rest
  } = event;

  const h = new Headers();

  Object.entries(headers)
    .filter(([, value]) => typeof value !== 'undefined')
    .forEach(([key, value]) => {
      assert(
        typeof value !== 'undefined',
        'Previous filter step should prevent this from firing'
      );
      h.set(key, value);
    });

  Object.entries(multiValueHeaders ?? {})
    .filter(
      ([key, value]) =>
        value &&
        Array.isArray(value) &&
        value.length > 1 &&
        h.get(key) !== value[0]
    )
    .forEach(([key, value]) => {
      assert(
        typeof value !== 'undefined',
        'Previous filter step should prevent this from firing'
      );
      for (const item of value) {
        h.append(key, item);
      }
    });

  const searchParams = new URLSearchParams();
  Object.entries(multiValueQueryStringParameters ?? {}).forEach(
    ([key, value]) => {
      for (const v of value ?? []) {
        searchParams.append(key, v ?? '');
      }
    }
  );

  // As far as I can tell, we probably never need to look at single-value. Even
  // items with one value appear to show up as multi-value.
  Object.entries(queryStringParameters || {})
    // Items that have multiple values would already have been added
    .filter(([key]) => !searchParams.has(key))
    .forEach(([key, value]) => {
      searchParams.set(key, value ?? '');
    });

  return {
    ...rest,
    body:
      body === null
        ? null
        : h.get('content-type')?.includes('application/x-www-form-urlencoded')
        ? safeUrlEncodedParse(body)
        : safeJsonParse(body),
    headers: h,
    originalEvent: event,
    pathParameters: pathParameters ?? {},
    queryStringParameters: searchParams,
  };
}

export function formatSuccessResult(
  result: RestCallbackResult
): APIGatewayProxyResult {
  return {
    ...result,
    body: 'body' in result ? JSON.stringify(result.body, null, 2) : '',
  };
}

export function formatErrorResult(
  err: unknown,
  event: RestCallbackEvent,
  context: LambdaContext
): APIGatewayProxyResult {
  if (err instanceof HttpException) {
    return {
      // TODO body: JSON.stringify(err.render(event, context)),
      body: JSON.stringify(err),
      statusCode: err.code,
    };
  }

  if (err instanceof Error) {
    return {
      body: JSON.stringify({
        message: err.message,
        name: err.name,
        requestIds: {
          awsRequestId: context.awsRequestId,
          requestId: event.requestContext.requestId,
          xAmznTraceId: event.headers.get('X-Amzn-Trace-Id'),
        },
        stack: err.stack,
      }),
      statusCode: 500,
    };
  }

  return {
    body: JSON.stringify(err),
    statusCode: 500,
  };
}
