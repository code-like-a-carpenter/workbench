import type {APIGatewayAuthorizerResultContext} from 'aws-lambda/common/api-gateway.js';
import type {
  APIGatewayTokenAuthorizerEvent,
  APIGatewayAuthorizerWithContextResult,
} from 'aws-lambda/trigger/api-gateway-authorizer.js';

import type {Context} from '../types.ts';

export type RestTokenAuthorizerResult<
  TAuthorizerContext extends APIGatewayAuthorizerResultContext,
> = Omit<
  APIGatewayAuthorizerWithContextResult<TAuthorizerContext>,
  'policyDocument'
> &
  Partial<
    Pick<
      APIGatewayAuthorizerWithContextResult<TAuthorizerContext>,
      'policyDocument'
    >
  >;

export type RestTokenAuthorizerCallback<
  TAuthorizerContext extends APIGatewayAuthorizerResultContext,
> = (
  event: APIGatewayTokenAuthorizerEvent,
  context: Context
) => Promise<RestTokenAuthorizerResult<TAuthorizerContext>>;
