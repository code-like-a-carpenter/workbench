import type {Executor} from '@nx/devkit';

import {handler} from '../proxy.ts';

import type {StackProxySchema} from './proxy-types.ts';

const executor: Executor<StackProxySchema> = async (args) => {
  await handler(args);

  return {success: true};
};

export default executor;
