/**
 * @template T
 * @typedef {import('@nx/devkit').Executor<T>} Executor
 */
/** @typedef {import('./list-types.mts').StackListSchema} StackListSchema */

/**
 * @template T
 * @typedef {(...args: Parameters<Executor<T>>) => Promise<ReturnType<Executor<T>>>}  AsyncExecutor<T>
 */

/** @type {AsyncExecutor<StackListSchema>} */
export const executor = async (args) => {
  const {handler} = await import('../list.mjs');
  await handler(args);

  return {success: true};
};
