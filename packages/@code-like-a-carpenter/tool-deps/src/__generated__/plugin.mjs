import {definePlugin} from '@code-like-a-carpenter/cli-core';

import {handler as depsHandler} from '../deps.mjs';

export const plugin = definePlugin((yargs) => {
  yargs.command(
    'deps',
    'No description provided',
    (y) =>
      y
        .option('aws-sdk-version', {
          conflicts: [],
          default: '3.726.1',
          demandOption: false,
          type: 'string',
        })
        .option('dev-patterns', {
          conflicts: [],
          default: ['*.spec.[jt]sx?'],
          demandOption: false,
          type: 'array',
        })
        .option('dry-run', {
          conflicts: [],
          default: false,
          demandOption: false,
          type: 'boolean',
        })
        .option('ignore-dirs', {
          conflicts: [],
          default: [
            '.aws-sam',
            'dist',
            'node_modules',
            'build',
            'public/build',
          ],
          demandOption: false,
          type: 'array',
        })
        .option('package-name', {
          conflicts: [],
          demandOption: false,
          type: 'string',
        })
        .option('definitely-typed', {
          conflicts: [],
          demandOption: false,
          type: 'array',
        }),
    async (args) => {
      await depsHandler(args);
    }
  );
});
