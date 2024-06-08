import {handleRestEvent} from '@code-like-a-carpenter/lambda-handlers';

import {exceptionTracingService} from '../../dependencies.mts';

import type {operations} from './__generated__/api.ts';

export const ping = handleRestEvent<operations['ping']>(
  async () => ({
    body: {status: 'ok'},
    statusCode: 200,
  }),
  exceptionTracingService
);
