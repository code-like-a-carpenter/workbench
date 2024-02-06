// eslint-disable-next-line  workspaces/no-absolute-imports
import {generateCode} from '@code-like-a-carpenter/foundation-cli';

import type {FoundationExecutor} from './schema';

export default async function runExecutor(options: FoundationExecutor) {
  await generateCode(options);
  return {
    success: true,
  };
}
