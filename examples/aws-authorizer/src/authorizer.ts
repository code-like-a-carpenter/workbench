import {
  Forbidden,
  NotFound,
  PaymentRequired,
  Unauthorized,
} from '@code-like-a-carpenter/errors';
import {
  generatePolicy,
  handleRestTokenAuthorizerEvent,
} from '@code-like-a-carpenter/lambda-handlers';

import {exceptionTracingService} from '../../dependencies.mts';

type AuthorizerContext =
  | {
      scheme: 'Bearer';
      token: string;
    }
  | {
      scheme: 'Basic';
      user: string;
      password: string;
    };

export const authorize = handleRestTokenAuthorizerEvent<AuthorizerContext>(
  async (event) => {
    const [scheme, token] = event.authorizationToken.split(' ');

    if (scheme === 'Bearer') {
      if (token === '401') {
        throw new Unauthorized('Invalid or missing token');
      }
      if (token === '402') {
        throw new PaymentRequired('You must pay to access this resource');
      }
      if (token === '403') {
        throw new Forbidden('You are not authorized to access this resource');
      }
      if (token === '404') {
        throw new NotFound('Could not find specified resource');
      }

      return {
        context: {
          scheme,
          token,
        },
        principalId: 'authenticated',
      };
    }

    if (scheme === 'Basic') {
      const [user, password] = Buffer.from(token, 'base64')
        .toString('utf8')
        .split(':');

      return generatePolicy('Allow', event.methodArn, {
        password,
        scheme,
        user,
      });
    }

    throw new Unauthorized(`${scheme} must be one of 'Bearer' or 'Basic'`);
  },
  exceptionTracingService
);
