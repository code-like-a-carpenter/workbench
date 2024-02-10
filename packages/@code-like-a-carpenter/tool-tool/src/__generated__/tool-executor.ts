import type {Executor} from '@nx/devkit';

import {handler} from '../tool';

import type {ToolTool} from './tool-types';

const executor: Executor<ToolTool> = async (args) => {
  await handler(args);

  return {success: true};
};

export default executor;
