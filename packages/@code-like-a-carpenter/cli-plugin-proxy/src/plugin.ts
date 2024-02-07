import {assert} from '@code-like-a-carpenter/assert';
import {definePlugin} from '@code-like-a-carpenter/cli-core';
import {findLocalPackages} from '@code-like-a-carpenter/tooling-common';

import {startAllProxies} from './proxy';
import {findEndpoints, findStacks} from './stacks';

export const plugin = definePlugin((yargs) => {
  yargs.command({
    builder: (y) =>
      y
        .options({
          all: {
            description:
              'When set, attempts to identify all packages in the repo (based on npm workspaces) that contain stack definitions and proxies them',
            type: 'boolean',
          },
          endpoint: {
            description:
              'An arbitrary endpoint to proxy. May be set multiple times.',
            type: 'array',
          },
          port: {
            default: 3000,
            description: 'The local port on which to listen',
            type: 'number',
          },
          project: {
            conflicts: ['all'],
            description: 'The project to proxy. May be set multiple times.',
            type: 'array',
          },
          stack: {
            description:
              "If you have access to the stack's name, you can specify it directly rather than inferring it from the stack's yml file (which is effectively what all the other options do). May be set multiple times.",
            type: 'array',
          },
        })
        .positional('bareEndpoint', {
          conflicts: ['all', 'endpoint', 'project', 'stack'],
          description:
            'An arbitrary endpoint to proxy directly to localhost (no subdomains).',
          type: 'string',
        })
        .check(({all, bareEndpoint, endpoint, project, stack}) => {
          if (!all && !bareEndpoint && !endpoint && !project && !stack) {
            throw new Error(
              'You must specify at least one of --all, bareEndpoint, --endpoint, --project, or --stack'
            );
          }

          return true;
        }),
    command: 'proxy [bareEndpoint]',
    async handler(args) {
      let stacks: string[] = [];

      if (args.all || args.project) {
        const localPackages = await findLocalPackages();
        if (args.project) {
          const projectSet = new Set(args.project as string[]);
          for (const key of localPackages.keys()) {
            if (!projectSet.has(key)) {
              localPackages.delete(key);
            }
          }
        }
        stacks = stacks.concat(await findStacks(localPackages));
      }

      if (args.stack) {
        stacks = stacks.concat(args.stack as string[]);
      }

      const endpoints = await findEndpoints(stacks);
      if (args.endpoint) {
        args.endpoint.forEach((endpoint, index) => {
          assert(typeof endpoint === 'string', 'endpoint must be a string');
          endpoints.set(`stack${index}`, endpoint);
        });
      }

      await startAllProxies({
        endpoints,
        port: args.port,
      });
    },
  });
});
