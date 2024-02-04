import type {Executor} from '@nx/devkit';

// eslint-disable-next-line  workspaces/no-absolute-imports
import {main} from '@code-like-a-carpenter/tooling-deps';

import type {DepsExecutor} from './schema';

const runExecutor: Executor<DepsExecutor> = async (options) => {
  await main(options as object);
  return {
    success: true,
  };
};

export default runExecutor;
