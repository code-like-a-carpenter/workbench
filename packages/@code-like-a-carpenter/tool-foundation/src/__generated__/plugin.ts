import {definePlugin} from '@code-like-a-carpenter/cli-core';

import {handler as foundationHandler} from '../foundation';

export const plugin = definePlugin((yargs) => {
  yargs.command(
    'foundation',
    'No description provided',
    (y) =>
      y
        .option('config', {
          conflicts: [],
          demandOption: true,
          type: 'string',
        })
        .option('outputs', {
          conflicts: [],
          demandOption: false,
          type: 'array',
        }),
    async (args) => {
      await foundationHandler(args);
    }
  );
});
