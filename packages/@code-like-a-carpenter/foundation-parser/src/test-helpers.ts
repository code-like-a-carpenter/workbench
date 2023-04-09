import {buildSchema} from 'graphql';

import {schema as coreSchema} from '@code-like-a-carpenter/foundation-intermediate-representation';

import {ParserConfigSchema} from './config';
import {parse} from './parser';

export async function parseSchema(raw: string) {
  const schema = buildSchema(`${coreSchema}\n${raw}`);

  return parse(
    schema,
    [],
    ParserConfigSchema.parse({
      actionsModuleId: './placeholder/actions',
      dependenciesModuleId: './placeholder/dependencies',
    }),
    {
      outputFile: './placeholder/output',
    }
  );
}
