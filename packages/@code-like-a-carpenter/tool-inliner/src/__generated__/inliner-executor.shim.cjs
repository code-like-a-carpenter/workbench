// @ts-expect-error
async function exec(...args) {
  const {executor} = await import('./inliner-executor.mjs');
  // @ts-expect-error
  return executor(...args);
}
module.exports = exec;
