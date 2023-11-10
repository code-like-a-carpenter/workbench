import {handleRestEvent} from '@code-like-a-carpenter/lambda-handlers';

import {exceptionTracingService} from '../../dependencies';

import type {operations} from './__generated__/api';

export const ping = handleRestEvent<operations['ping']>(
  async (event) => ({
    body: {context: event.requestContext.authorizer, status: 'ok'},
    statusCode: 200,
  }),
  exceptionTracingService
);
