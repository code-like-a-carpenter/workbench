import {definePlugin} from '@code-like-a-carpenter/cli-core';

import {handler as jsonSchemaHandler} from '../json-schema';

export const plugin = definePlugin((yargs) => {
  yargs.command(
    'json-schema',
    'Generates TypeScript definitions from JSON Schema files',
    (y) =>
      y
        .option('out-dir', {
          conflicts: [],
          demandOption: false,
          type: 'string',
        })
        .option('schemas', {
          conflicts: [],
          demandOption: true,
          type: 'array',
        }),
    async (args) => {
      await jsonSchemaHandler(args);
    }
  );
});
