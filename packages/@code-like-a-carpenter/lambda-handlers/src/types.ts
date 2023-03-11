import type {Context as LambdaContext} from 'aws-lambda';

import type {Logger} from '@code-like-a-carpenter/logger';

export interface Context {
  context: LambdaContext;
  logger: Logger;
}
