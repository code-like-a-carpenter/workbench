import type {APIGatewayAuthorizerResultContext} from 'aws-lambda/common/api-gateway';
import type {APIGatewayTokenAuthorizerWithContextHandler} from 'aws-lambda/trigger/api-gateway-authorizer';

import {HttpException} from '@code-like-a-carpenter/errors';
import {logger as rootLogger} from '@code-like-a-carpenter/logger';
import type {ExceptionTracingService} from '@code-like-a-carpenter/telemetry';
import {instrumentRestTokenAuthorizer} from '@code-like-a-carpenter/telemetry';

import type {RestTokenAuthorizerCallback} from './types.ts';

export function handleRestTokenAuthorizerEvent<
  TAuthorizerContext extends APIGatewayAuthorizerResultContext,
>(
  callback: RestTokenAuthorizerCallback<TAuthorizerContext>,
  /**
   * If your service doesn't need exception tracing, you can pass in the
   * `noopExceptionTracingService`. Rather than making this field optional, I
   * decided that far fewer mistakes will be made if you have to explicitly
   * choose not to use tracing.
   */
  exceptionTracingService: ExceptionTracingService
): APIGatewayTokenAuthorizerWithContextHandler<
  TAuthorizerContext | {message: string; name: string; status: number}
> {
  return instrumentRestTokenAuthorizer<
    TAuthorizerContext | {message: string; name: string; status: number}
  >(async (event, context) => {
    const logger = rootLogger.child({});
    try {
      const {context: ctx, principalId} = await callback(event, {
        context,
        logger,
      });
      return generatePolicy('Allow', event.methodArn, ctx, principalId);
    } catch (err) {
      if (err instanceof HttpException) {
        return generatePolicy('Deny', event.methodArn, {
          message: err.message,
          name: err.name,
          status: err.code,
        });
      }

      throw err;
    }
  }, exceptionTracingService);
}

/* Helper function to generate an IAM policy */
export function generatePolicy<
  E extends 'Allow' | 'Deny',
  TAuthorizerContext extends APIGatewayAuthorizerResultContext,
>(
  effect: E,
  resource: string,
  context: E extends 'Allow'
    ? TAuthorizerContext
    : {message: string; name: string; status: number},
  principalId = 'anonymous'
) {
  return {
    context,
    policyDocument: {
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: effect,
          Resource: '*',
        },
      ],
      Version: '2012-10-17',
    },
    principalId,
  };
}
