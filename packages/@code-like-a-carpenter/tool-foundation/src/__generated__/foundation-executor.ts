import type {Executor} from '@nx/devkit';

import {handler} from '../foundation.ts';

import type {Foundation} from './foundation-types.ts';

const executor: Executor<Foundation> = async (args) => {
  await handler(args);

  return {success: true};
};

export default executor;
