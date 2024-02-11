import type {Executor} from '@nx/devkit';

import {handler} from '../proxy';

import type {StackProxySchema} from './proxy-types';

const executor: Executor<StackProxySchema> = async (args) => {
  await handler(args);

  return {success: true};
};

export default executor;
