import type {Executor} from '@nx/devkit';

import {handler} from '../json-schema.ts';

import type {JsonSchemaTool} from './json-schema-types.ts';

const executor: Executor<JsonSchemaTool> = async (args) => {
  await handler(args);

  return {success: true};
};

export default executor;
