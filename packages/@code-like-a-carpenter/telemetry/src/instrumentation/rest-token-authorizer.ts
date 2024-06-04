import type {Attributes} from '@opentelemetry/api';
import {SpanKind, trace} from '@opentelemetry/api';
import {BasicTracerProvider} from '@opentelemetry/sdk-trace-base';
import type {APIGatewayAuthorizerResultContext} from 'aws-lambda/common/api-gateway';
import type {
  APIGatewayAuthorizerWithContextResult,
  APIGatewayTokenAuthorizerEvent,
} from 'aws-lambda/trigger/api-gateway-authorizer';

import {assert} from '@code-like-a-carpenter/assert';

import type {ExceptionTracingService} from '../exceptions.ts';
import {captureException, setupExceptionTracing} from '../exceptions.ts';
import {runWithNewSpan} from '../run-with.ts';

import type {NoVoidHandler} from './types.ts';

type NoVoidAPIGatewayAuthorizerWithContextResult<
  TAuthorizerContext extends APIGatewayAuthorizerResultContext,
> = NoVoidHandler<
  APIGatewayTokenAuthorizerEvent,
  APIGatewayAuthorizerWithContextResult<TAuthorizerContext>
>;

export function instrumentRestTokenAuthorizer<
  TAuthorizerContext extends APIGatewayAuthorizerResultContext,
>(
  handler: NoVoidAPIGatewayAuthorizerWithContextResult<TAuthorizerContext>,
  /**
   * If your service doesn't need exception tracing, you can pass in the
   * `noopExceptionTracingService`. Rather than making this field optional, I
   * decided that far fewer mistakes will be made if you have to explicitly
   * choose not to use tracing.
   */
  exceptionTracingService: ExceptionTracingService
): NoVoidAPIGatewayAuthorizerWithContextResult<TAuthorizerContext> {
  const tracedHandler = setupExceptionTracing(handler, exceptionTracingService);

  let cold = true;
  return async (event, context) => {
    try {
      const wasCold = cold;
      cold = false;

      // event.methodArn should be of the form:
      // arn:aws:execute-api:{regionId}:{accountId}:{apiId}/{stage}/{httpVerb}/[{resource}/[{child-resources}]]
      const usefulParts = event.methodArn.split(':').pop();
      assert(
        usefulParts,
        `methodArn is not in the expected format. Expected arn:aws:execute-api:{regionId}:{accountId}:{apiId}/{stage}/{httpVerb}/[{resource}/[{child-resources}]] but received ${event.methodArn}`
      );
      const [, , httpMethod, ...pathParts] = usefulParts.split('/');
      const path = pathParts.join('/');
      const resource = `${httpMethod} ${path}`;

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
        'http.method': httpMethod,
        'http.route': resource,
        'http.schema': 'https',
        'http.target': path,
      };

      return await runWithNewSpan(
        resource,
        {attributes, kind: SpanKind.SERVER},
        () => tracedHandler(event, context)
      );
    } catch (err) {
      // We're considering this not to be escaped so that we alert on it, but
      // we rethrow so that API Gateway does the default thing and renders an
      // Internal Server Error of some kind.
      captureException(err, false);
      throw err;
    } finally {
      const provider = trace.getTracerProvider();
      if (provider instanceof BasicTracerProvider) {
        await provider.forceFlush();
      }
    }
  };
}
