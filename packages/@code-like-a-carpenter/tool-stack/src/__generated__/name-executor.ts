import type {Executor} from '@nx/devkit';

import {handler} from '../name.ts';

import type {StackNameSchema} from './name-types.ts';

const executor: Executor<StackNameSchema> = async (args) => {
  await handler(args);

  return {success: true};
};

export default executor;
