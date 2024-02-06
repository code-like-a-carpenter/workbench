import yargs from 'yargs';

import {assert} from '@code-like-a-carpenter/assert';

import {generateCode} from './codegen';

export function main() {
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
          outputs: {
            choices: ['cloudformation', 'typescript'],
            default: ['cloudformation', 'typescript'],
            description: 'Output formats',
            type: 'array',
          },
        }),
      ({outputs, ...rest}) => {
        const typesafe = outputs.map((o) => {
          assert(
            o === 'cloudformation' || o === 'typescript',
            `Invalid output ${o}`
          );
          return o;
        });
        return generateCode({...rest, outputs: typesafe});
      }
    )
    .help()
    .demandCommand().argv;
}

export * from './codegen';
export * from './config';
