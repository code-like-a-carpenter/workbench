/**
 * @template T
 * @typedef {import('@nx/devkit').PromiseExecutor<T>} PromiseExecutor
 */
/** @typedef {import('./tool-types.mts').ToolTool} ToolTool */

/** @type {PromiseExecutor<ToolTool>} */
export const executor = async (args) => {
  const {handler} = await import('../tool.mjs');
  await handler(args);

  return {success: true};
};
