import {handleRestEvent} from '@code-like-a-carpenter/lambda-handlers';

import type {operations} from './__generated__/api';

export const root = handleRestEvent<operations['root']>(async () => ({
  body: `<html lang="en"><body><h1>It works!</h1></body></html>`,
  statusCode: 200,
}));