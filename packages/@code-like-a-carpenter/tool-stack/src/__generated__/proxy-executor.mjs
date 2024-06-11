/**
 * @template T
 * @typedef {import('@nx/devkit').Executor<T>} Executor
 */
/** @typedef {import('./proxy-types.mts').StackProxySchema} StackProxySchema */

/**
 * @template T
 * @typedef {(...args: Parameters<Executor<T>>) => Promise<ReturnType<Executor<T>>>}  AsyncExecutor<T>
 */

/** @type {AsyncExecutor<StackProxySchema>} */
export const executor = async (args) => {
  const {handler} = await import('../proxy.mjs');
  await handler(args);

  return {success: true};
};
