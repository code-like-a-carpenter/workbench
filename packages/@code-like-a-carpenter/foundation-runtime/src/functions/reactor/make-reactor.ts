import type {Callback, Handler} from '../common/handlers';
import {makeSqsHandler} from '../common/handlers';

/**
 * Makes an SQS handler that expects the payload to be a DynamoDB Stream Record.
 */
export function makeReactor(cb: Callback): Handler {
  return makeSqsHandler(cb);
}
