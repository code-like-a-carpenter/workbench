/**
 * @template T
 * @typedef {import('@nx/devkit').PromiseExecutor<T>} PromiseExecutor
 */
/** @typedef {import('./proxy-types.mts').StackProxySchema} StackProxySchema */

/** @type {PromiseExecutor<StackProxySchema>} */
export const executor = async (args) => {
  const {handler} = await import('../proxy.mjs');
  await handler(args);

  return {success: true};
};
