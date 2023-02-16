import {runWithNewSpan} from '@code-like-a-carpenter/telemetry';

export interface Interactor<T, R, C> {
  (args: T, context: C): Promise<R>;
}

/**
 * Executes an arbitrary piece of business logic.
 *
 * @param interactor - Function containing the business logic we want to apply
 * @param args - The arguments to pass to the interactor
 * @param context - Other "stuff" relevant to your app that might be needed by
 * all interactors. For example, a logger, or perhaps a long-lived database
 * connection
 */
export async function interact<T, R, C extends object>(
  interactor: Interactor<T, R, C>,
  args: T,
  context: C
): Promise<R> {
  if (
    'logger' in context &&
    typeof context.logger === 'object' &&
    context.logger !== null &&
    'child' in context.logger &&
    typeof context.logger.child === 'function'
  ) {
    context = {
      ...context,
      logger: context.logger.child({interactor: interactor.name}),
    };
  }

  return runWithNewSpan(interactor.name, () => interactor(args, context));
}
