import type {Executor} from '@nx/devkit';

import {handler} from '../foundation';

import type {Foundation} from './foundation-types';

const executor: Executor<Foundation> = async (args) => {
  await handler(args);

  return {success: true};
};

export default executor;
