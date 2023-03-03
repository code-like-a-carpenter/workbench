import path from 'node:path';

import type {Transaction, TransactionRequest} from 'dredd-transactions';
import type {HTTPMessage} from 'gavel';
import gavel from 'gavel';
import {diff} from 'jest-diff';

import {assert} from '@code-like-a-carpenter/assert';

export async function testTransaction(
  transaction: Transaction,
  baseUrl: string
) {
  const {request} = transaction;

  const {body} = request;
  // Create a fake URL to separate the path from the query string...
  const requestUri = new URL(request.uri, 'https://example.com');

  const uri = new URL(baseUrl);
  // ...then append the path to the base URL since API Gateway will give us a
  // URL that already has part of a pathname
  uri.pathname = path.join(uri.pathname, requestUri.pathname);
  uri.search = requestUri.search;

  const fullUri = uri.toString();
  const headers = await buildHeaders(request);
  const method = request.method.toLowerCase();

  const payload: RequestInit = {
    body: method === 'get' || method === 'head' ? undefined : body,
    headers,
    method,
    redirect: 'manual',
  };

  const result = await fetch(fullUri, payload);

  await runAssertions(transaction, result);
}

async function runAssertions(
  transaction: Transaction,
  fetchResult: Response
): Promise<void> {
  const {response} = transaction;
  const expected: HTTPMessage = transactionResponseToHTTPMessage(transaction);

  const actual: HTTPMessage = await fetchResultToHTTPMessage(fetchResult);

  const validations = gavel.validate(expected, actual);

  try {
    expect(validations.valid).toBe(true);
  } catch (err) {
    const msg = Object.entries(validations.fields)
      .filter(([, {valid}]) => !valid)
      .map(
        ([field, {errors, values}]) =>
          `${errors.map(({message}) => message).join('\n')}\n\n${diff(
            field === 'body' ? JSON.parse(values.expected) : values.expected,
            field === 'body' ? JSON.parse(values.actual) : values.actual
          )}`
      )
      .join('\n');

    throw new Error(msg);
  }
  // There was at least one case where I saw gavel fail to validate the status
  // so this is a backup.
  expect(fetchResult.status).toEqual(Number(response.status));
}

export function unwrapHeaders(headers: Headers) {
  // @ts-expect-error - Docs says entries exists, even if node types don't.
  const entries = headers.entries();
  return [...entries].reduce((acc, [name, value]) => {
    acc[name] = value;
    return acc;
  }, {} as Record<string, string>);
}

async function buildHeaders(request: TransactionRequest): Promise<Headers> {
  const headers = new Headers();

  for (const {name, value} of request.headers) {
    headers.set(name, value);
  }
  return headers;
}

function transactionResponseToHTTPMessage({
  name,
  response,
}: Transaction): HTTPMessage {
  assert(
    response.body || response.schema,
    `One of body or schema is required for example ${name}`
  );
  return {
    body: response.body,
    bodySchema: response.schema ? JSON.parse(response.schema) : undefined,
    headers: response.headers.reduce((acc, {name: headerName, value}) => {
      acc[headerName] = value;
      return acc;
    }, {} as Record<string, string>),
    statusCode: Number(response.status),
  };
}

async function fetchResultToHTTPMessage(
  result: Response
): Promise<HTTPMessage> {
  return {
    body: await result.text(),
    headers: unwrapHeaders(result.headers),
    statusCode: result.status,
  };
}
