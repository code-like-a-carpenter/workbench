/**
 * @template T
 * @typedef {import('@nx/devkit').Executor<T>} Executor
 */
/** @typedef {import('./name-types.mts').StackNameSchema} StackNameSchema */

/**
 * @template T
 * @typedef {(...args: Parameters<Executor<T>>) => Promise<ReturnType<Executor<T>>>}  AsyncExecutor<T>
 */

/** @type {AsyncExecutor<StackNameSchema>} */
export const executor = async (args) => {
  const {handler} = await import('../name.mjs');
  await handler(args);

  return {success: true};
};
