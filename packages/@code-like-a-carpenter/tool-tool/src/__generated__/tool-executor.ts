import type {Executor} from '@nx/devkit';

import {handler} from '../tool.ts';

import type {ToolTool} from './tool-types.ts';

const executor: Executor<ToolTool> = async (args) => {
  await handler(args);

  return {success: true};
};

export default executor;
