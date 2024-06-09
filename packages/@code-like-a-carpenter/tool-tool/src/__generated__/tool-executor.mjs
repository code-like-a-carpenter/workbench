/**
 * @template T
 * @typedef {import('@nx/devkit').Executor<T>} Executor
 */
/** @typedef {import('./tool-types.mts').ToolTool} ToolTool */

/**
 * @template T
 * @typedef {(...args: Parameters<Executor<T>>) => Promise<ReturnType<Executor<T>>>}  AsyncExecutor<T>
 */

/** @type {AsyncExecutor<ToolTool>} */
export const executor = async (args) => {
  const {handler} = await import('../tool.mjs');
  await handler(args);

  return {success: true};
};
