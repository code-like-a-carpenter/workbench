import {readFile} from 'node:fs/promises';
import path from 'node:path';

import {buildSchema} from 'graphql';

import {parse} from './parser';

export async function parseSchema(raw: string) {
  const coreSchema = await readFile(
    path.resolve(__dirname, '..', '..', '..', '..', './schema.graphqls'),
    'utf8'
  );

  const schema = buildSchema(`${coreSchema}\n${raw}`);

  return parse(
    schema,
    [],
    {
      defaultDispatcherConfig: {
        memorySize: 384,
        timeout: 90,
      },
      defaultHandlerConfig: {
        memorySize: 256,
        timeout: 30,
      },
      dependenciesModuleId: 'PLACEHOLDER',
    },
    {
      outputFile: './placeholder/output',
    }
  );
}
