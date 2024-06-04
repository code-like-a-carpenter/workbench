import type {Executor} from '@nx/devkit';

import {handler} from '../deps.ts';

import type {DepsExecutor} from './deps-types.ts';

const executor: Executor<DepsExecutor> = async (args) => {
  await handler(args);

  return {success: true};
};

export default executor;
