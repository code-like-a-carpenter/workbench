import {handleRestEvent} from '@code-like-a-carpenter/lambda-handlers';

import type {operations} from './__generated__/api';

export const ping = handleRestEvent<operations['ping']>(async () => ({
  body: {status: 'ok'},
  statusCode: 200,
}));
