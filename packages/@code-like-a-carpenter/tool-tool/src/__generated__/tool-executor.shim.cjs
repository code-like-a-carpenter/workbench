// @ts-expect-error
async function exec(...args) {
  const {executor} = await import('./tool-executor.mjs');
  // @ts-expect-error
  return executor(...args);
}
module.exports = exec;