/**
 * @template T
 * @typedef {import('@nx/devkit').Executor<T>} Executor
 */
/** @typedef {import('./inliner-types.mts').InlinerExecutor} InlinerExecutor */

/**
 * @template T
 * @typedef {(...args: Parameters<Executor<T>>) => Promise<ReturnType<Executor<T>>>}  AsyncExecutor<T>
 */

/** @type {AsyncExecutor<InlinerExecutor>} */
export const executor = async (args) => {
  const {handler} = await import('../inliner.mjs');
  await handler(args);

  return {success: true};
};
