// @ts-expect-error
async function exec(...args) {
  const {default: handler} = await import('./executor.mjs');
  return handler(...args);
}
module.exports = exec;
