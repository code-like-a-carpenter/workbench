import type {Executor} from '@nx/devkit';

import {handler} from '../list';

import type {StackListSchema} from './list-types';

const executor: Executor<StackListSchema> = async (args) => {
  await handler(args);

  return {success: true};
};

export default executor;
