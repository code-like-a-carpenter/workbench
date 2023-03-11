import type {APIGatewayProxyEvent, APIGatewayProxyResult} from 'aws-lambda';
import type {
  OperationObject,
  ReferenceObject,
  ResponseObject,
} from 'openapi-typescript';

import type {Context} from '../types';

export interface ContentTypeJson {
  content: {'application/json': unknown};
}

export interface ContentTypeUrlEncoded {
  content: {'application/x-www-form-urlencoded': unknown};
}

export type RestRequestBody<O extends SimplifiedOperationObject> = O extends {
  requestBody: ContentTypeJson;
}
  ? O['requestBody']['content']['application/json']
  : O extends {requestBody: ContentTypeUrlEncoded}
  ? URLSearchParams
  : null;

export type RestRequestPathParameters<O extends SimplifiedOperationObject> =
  O extends {parameters: {path: unknown}} ? O['parameters']['path'] : null;

export interface RestCallbackEvent<O extends SimplifiedOperationObject>
  extends Omit<
    APIGatewayProxyEvent,
    | 'body'
    | 'headers'
    | 'multiValueHeaders'
    | 'multiValueQueryStringParameters'
    | 'pathParameters'
    | 'queryStringParameters'
  > {
  body: RestRequestBody<O>;
  headers: Headers;
  /**
   * Kept primarily in event it's needed for doing certain kinds of digest
   * authentication
   */
  originalEvent: APIGatewayProxyEvent;
  pathParameters: RestRequestPathParameters<O>;
  queryStringParameters: URLSearchParams;
}

export type RestCallbackResult<
  O extends SimplifiedOperationObject,
  S extends keyof O['responses'],
  R extends RestResponseBody<O, S>
> = Omit<APIGatewayProxyResult, 'body' | 'statusCode'> & R extends never
  ? {statusCode: S}
  : {body: R; statusCode: S};

export type RestResponseBody<
  O extends SimplifiedOperationObject,
  S extends keyof O['responses'] = keyof O['responses']
> = O['responses'][S] extends ContentTypeJson
  ? O['responses'][S]['content']['application/json']
  : never;

export type RestCallback<
  O extends SimplifiedOperationObject,
  S extends number & keyof O['responses'] = number & keyof O['responses'],
  R extends RestResponseBody<O, S> = RestResponseBody<O, S>
> = (
  event: RestCallbackEvent<O>,
  context: Context
) => Promise<RestCallbackResult<O, S, R>>;

/**
 * This is a simplified version of the `OperationObject` type from
 * openapi-typescript. Since openapi-typescript handles a lot more potential
 * inputs and outputs than are strictly relevant, `OperationObject` tends to
 * overcomplicate tsc when writing generics of the form
 * `<O extends OperationObject>`.
 */
export interface SimplifiedOperationObject
  extends Pick<OperationObject, 'requestBody'> {
  parameters?: SimplifiedParameterObject;
  responses?: SimplifiedResponsesObject;
}

export interface SimplifiedResponsesObject {
  [responseCode: string]: SimplifiedResponseObject | ReferenceObject;
}

export type SimplifiedResponseObject = Omit<ResponseObject, 'description'>;

export type SimplifiedParameterObject = Record<string, Record<string, string>>;
