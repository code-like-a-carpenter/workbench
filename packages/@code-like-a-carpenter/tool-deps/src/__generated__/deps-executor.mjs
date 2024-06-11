/**
 * @template T
 * @typedef {import('@nx/devkit').PromiseExecutor<T>} PromiseExecutor
 */
/** @typedef {import('./deps-types.mts').DepsExecutor} DepsExecutor */

/** @type {PromiseExecutor<DepsExecutor>} */
export const executor = async (args) => {
  const {handler} = await import('../deps.mjs');
  await handler(args);

  return {success: true};
};
