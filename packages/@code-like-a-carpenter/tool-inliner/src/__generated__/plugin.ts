import {definePlugin} from '@code-like-a-carpenter/cli-core';

import {handler as inlinerHandler} from '../inliner.ts';

export const plugin = definePlugin((yargs) => {
  yargs.command(
    'inliner',
    'Inlines a text file as a string in a typescript file',
    (y) =>
      y
        .option('export-name', {
          conflicts: [],
          demandOption: true,
          type: 'string',
        })
        .option('source-file', {
          conflicts: [],
          demandOption: true,
          type: 'string',
        })
        .option('target-file', {
          conflicts: [],
          demandOption: true,
          type: 'string',
        }),
    async (args) => {
      await inlinerHandler(args);
    }
  );
});
