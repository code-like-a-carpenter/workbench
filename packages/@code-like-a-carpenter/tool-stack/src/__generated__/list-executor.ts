import type {Executor} from '@nx/devkit';

import {handler} from '../list.ts';

import type {StackListSchema} from './list-types.ts';

const executor: Executor<StackListSchema> = async (args) => {
  await handler(args);

  return {success: true};
};

export default executor;
