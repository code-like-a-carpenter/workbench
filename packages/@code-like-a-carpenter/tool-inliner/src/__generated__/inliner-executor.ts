import type {Executor} from '@nx/devkit';

import {handler} from '../inliner.ts';

import type {InlinerExecutor} from './inliner-types.ts';

const executor: Executor<InlinerExecutor> = async (args) => {
  await handler(args);

  return {success: true};
};

export default executor;
