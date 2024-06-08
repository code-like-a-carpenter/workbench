/**
 * @template T
 * @typedef {import('@nx/devkit').Executor<T>} Executor
 */
/** @typedef {import('./deps-types.mts').DepsExecutor} DepsExecutor */

/**
 * @template T
 * @typedef {(...args: Parameters<Executor<T>>) => Promise<ReturnType<Executor<T>>>}  AsyncExecutor<T>
 */

/** @type {AsyncExecutor<DepsExecutor>} */
export const executor = async (args) => {
  const {handler} = await import('../deps.mjs');
  await handler(args);

  return {success: true};
};
