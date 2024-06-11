/**
 * @template T
 * @typedef {import('@nx/devkit').PromiseExecutor<T>} PromiseExecutor
 */
/** @typedef {import('./list-types.mts').StackListSchema} StackListSchema */

/** @type {PromiseExecutor<StackListSchema>} */
export const executor = async (args) => {
  const {handler} = await import('../list.mjs');
  await handler(args);

  return {success: true};
};
