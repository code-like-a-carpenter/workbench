import {definePlugin} from '@code-like-a-carpenter/cli-core';

import {main} from './main';

export const plugin = definePlugin((yargs) => {
  yargs.command({
    builder: {
      awsSdkVersion: {
        default: '3.188.0',
        demandOption: true,
        description:
          'Version of the AWS SDK to use. Defaults to the one included with the Lambda Node 18 runtime at time of writing.',
        type: 'string',
      },
      'definitely-typed': {
        demandOption: true,
        type: 'array',
      },
      'dev-patterns': {
        default: ['*.spec.[jt]sx?'],
        demandOption: true,
        description:
          'Glob patterns for files that should be considered dev dependencies',
        type: 'array',
      },
      'dry-run': {
        default: false,
        demandOption: true,
        description:
          'Exits non-zero if any packages do not have the correct dependencies',
        type: 'boolean',
      },
      'ignore-dirs': {
        default: ['.aws-sam', 'dist', 'node_modules', 'build', 'public/build'],
        demandOption: true,
        type: 'array',
      },
      'package-name': {
        type: 'string',
      },
    },
    command: 'deps',
    describe: 'Add/remove dependencies based on code analysis',
    async handler(args) {
      // @ts-expect-error - sometimes the types for yargs figure out the args
      // type, but not this time
      return main(args);
    },
  });
});
