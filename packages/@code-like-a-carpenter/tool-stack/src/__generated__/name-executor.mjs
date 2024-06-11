/**
 * @template T
 * @typedef {import('@nx/devkit').PromiseExecutor<T>} PromiseExecutor
 */
/** @typedef {import('./name-types.mts').StackNameSchema} StackNameSchema */

/** @type {PromiseExecutor<StackNameSchema>} */
export const executor = async (args) => {
  const {handler} = await import('../name.mjs');
  await handler(args);

  return {success: true};
};
