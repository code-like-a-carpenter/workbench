import type {Executor} from '@nx/devkit';

import {handler} from '../deps';

import type {DepsExecutor} from './deps-types';

const executor: Executor<DepsExecutor> = async (args) => {
  await handler(args);

  return {success: true};
};

export default executor;
