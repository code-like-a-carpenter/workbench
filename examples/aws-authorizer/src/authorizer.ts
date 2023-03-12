import {
  Forbidden,
  NotFound,
  PaymentRequired,
  Unauthorized,
} from '@code-like-a-carpenter/errors';

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

export const authorize = async (event) => {
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

    return generatePolicy('Allow', event.methodArn, {
      scheme,
      token,
    });
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

  return generatePolicy('Deny', event.methodArn, {
    message: `${scheme} must be one of 'Bearer' or 'Basic'`,
  });
};

// Help function to generate an IAM policy
function generatePolicy<E extends 'Allow' | 'Deny'>(
  effect: E,
  resource: string,
  context: E extends 'Allow'
    ? AuthorizerContext
    : {
        message: string;
      }
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
    principalId: effect === 'Allow' ? 'authenticated' : 'anonymous',
  };
}
