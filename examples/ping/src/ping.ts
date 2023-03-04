import {handleRestEvent} from '@code-like-a-carpenter/lambda-handlers';

export const ping = handleRestEvent(async () => {
  return {body: {status: 'ok'}, statusCode: 200};
});
