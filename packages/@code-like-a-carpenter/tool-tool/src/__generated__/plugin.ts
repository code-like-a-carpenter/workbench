import {definePlugin} from '@code-like-a-carpenter/cli-core';

import {handler as toolHandler} from '../tool.ts';

export const plugin = definePlugin((yargs) => {
  yargs.command(
    'tool',
    'No description provided',
    (y) =>
      y.option('schema-dir', {
        conflicts: [],
        demandOption: true,
        type: 'string',
      }),
    async (args) => {
      await toolHandler(args);
    }
  );
});
