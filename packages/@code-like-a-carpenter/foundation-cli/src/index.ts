import yargs from 'yargs';

import {generateCode} from './codegen';

yargs(process.argv.slice(2))
  .command(
    'codegen',
    'Generate code from a GraphQL schema',
    (y) =>
      y.options({
        config: {
          default: '.foundationrc',
          description: 'Path to the config file',
          type: 'string',
        },
      }),
    (argv) => generateCode(argv)
  )
  .help()
  .demandCommand().argv;

export * from './config';
