/**
 * @template T
 * @typedef {import('@nx/devkit').PromiseExecutor<T>} PromiseExecutor
 */
/** @typedef {import('./inliner-types.mts').InlinerExecutor} InlinerExecutor */

/** @type {PromiseExecutor<InlinerExecutor>} */
export const executor = async (args) => {
  const {handler} = await import('../inliner.mjs');
  await handler(args);

  return {success: true};
};
