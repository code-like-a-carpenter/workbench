/**
 * @template T
 * @typedef {import('@nx/devkit').Executor<T>} Executor
 */
/** @typedef {import('./json-schema-types.mts').JsonSchemaTool} JsonSchemaTool */

/**
 * @template T
 * @typedef {(...args: Parameters<Executor<T>>) => Promise<ReturnType<Executor<T>>>}  AsyncExecutor<T>
 */

/** @type {AsyncExecutor<JsonSchemaTool>} */
export const executor = async (args) => {
  const {handler} = await import('../json-schema.mjs');
  await handler(args);

  return {success: true};
};
