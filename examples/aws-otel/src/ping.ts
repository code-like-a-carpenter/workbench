import {exceptionTracingService} from '@clc/dependencies';

import {handleRestEvent} from '@code-like-a-carpenter/lambda-handlers';
import {runWithNewSpan} from '@code-like-a-carpenter/telemetry';

import type {operations} from './__generated__/api.ts';

export const ping = handleRestEvent<operations['ping']>(async (event) => {
  const throwType = event.queryStringParameters.get('throwType');

  if (throwType === 'immediate') {
    throw new Error('Something bad happened immediately');
  }

  await runWithNewSpan('slow span', async () => {
    await new Promise((resolve) => setTimeout(resolve, 1000));
    if (throwType === 'slow') {
      throw new Error('Something bad happened in the slow span');
    }
  });

  await runWithNewSpan('fast span', async () => {
    await new Promise((resolve) => setTimeout(resolve, 1));

    if (throwType === 'fast') {
      throw new Error('Something bad happened in the fast span');
    }
  });

  await Promise.all(
    [1, 2, 3].map(async () => {
      await runWithNewSpan(`parallel span`, async () => {
        await new Promise((resolve) => setTimeout(resolve, 1));
      });
    })
  );

  return {
    body: {status: 'ok'},
    statusCode: 200,
  };
}, exceptionTracingService);
