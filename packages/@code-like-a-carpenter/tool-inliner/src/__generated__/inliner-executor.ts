import type {Executor} from '@nx/devkit';

import {handler} from '../inliner';

import type {InlinerExecutor} from './inliner-types';

const executor: Executor<InlinerExecutor> = async (args) => {
  await handler(args);

  return {success: true};
};

export default executor;
