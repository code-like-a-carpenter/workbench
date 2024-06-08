import {handleRestEvent} from '@code-like-a-carpenter/lambda-handlers';

import {exceptionTracingService} from '../../dependencies.mts';

import type {operations} from './__generated__/api.ts';

export const root = handleRestEvent<operations['root']>(
  async () => ({
    body: `<html lang="en"><body><h1>It works!</h1></body></html>`,
    statusCode: 200,
  }),
  exceptionTracingService
);
