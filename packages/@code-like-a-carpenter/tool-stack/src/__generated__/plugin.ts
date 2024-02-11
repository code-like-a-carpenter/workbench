import {definePlugin} from '@code-like-a-carpenter/cli-core';

import {handler as listHandler} from '../list';
import {handler as nameHandler} from '../name';

export const plugin = definePlugin((yargs) => {
  yargs.command(
    'stack:list',
    'Lists all the stacks in the repo (based a bunch of assumptions)',
    (y) =>
      y
        .option('as-projects', {
          conflicts: [],
          demandOption: false,
          type: 'boolean',
        })
        .option('test', {
          conflicts: [],
          demandOption: false,
          type: 'array',
        }),
    async (args) => {
      await listHandler(args);
    }
  );
  yargs.command(
    'stack:name',
    'Produces an AWS-safe stack name based on various environmental and input conditions',
    (y) =>
      y
        .option('project-name', {
          conflicts: ['name'],
          demandOption: false,
          type: 'string',
        })
        .option('name', {
          conflicts: ['projectName'],
          demandOption: false,
          type: 'string',
        }),
    async (args) => {
      await nameHandler(args);
    }
  );
});
