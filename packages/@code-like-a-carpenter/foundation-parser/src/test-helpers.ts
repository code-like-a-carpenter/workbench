import {readFile} from 'node:fs/promises';
import path from 'node:path';

import {buildSchema} from 'graphql';

import {defaultConfig} from './config';
import {parse} from './parse';

export async function parseSchema(raw: string) {
  const coreSchema = await readFile(
    path.resolve(__dirname, '..', '..', '..', '..', './schema.graphqls'),
    'utf8'
  );

  const schema = buildSchema(`${coreSchema}\n${raw}`);

  return parse(schema, [], defaultConfig, {});
}
