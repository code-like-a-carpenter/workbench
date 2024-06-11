import {definePlugin} from '@code-like-a-carpenter/cli-core';

import {handler as toolHandler} from '../tool.mjs';

export const plugin = definePlugin((yargs) => {
  yargs.command(
    'tool',
    'No description provided',
    (y) =>
      y
        .option('build-before-run', {
          conflicts: [],
          default: true,
          demandOption: false,
          type: 'boolean',
        })
        .option('schema-dir', {
          conflicts: [],
          demandOption: true,
          type: 'string',
        }),
    async (args) => {
      await toolHandler(args);
    }
  );
});
