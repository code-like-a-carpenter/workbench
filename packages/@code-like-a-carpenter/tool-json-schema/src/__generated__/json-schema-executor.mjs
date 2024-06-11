/**
 * @template T
 * @typedef {import('@nx/devkit').PromiseExecutor<T>} PromiseExecutor
 */
/** @typedef {import('./json-schema-types.mts').JsonSchemaTool} JsonSchemaTool */

/** @type {PromiseExecutor<JsonSchemaTool>} */
export const executor = async (args) => {
  const {handler} = await import('../json-schema.mjs');
  await handler(args);

  return {success: true};
};
