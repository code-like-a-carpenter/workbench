import assert from 'assert';

/**
 * Waits for a function to successfully resolve, within a given timeout.
 *
 * This should _probably_ only be used in tests and maybe shell-scripts. In
 * production code, you'll need a more tailored approach to make sure you only
 * wait in event of expected failure types, not _all_ failure types.
 * @param fn
 * @param timeout
 */
export async function waitFor<T>(fn: () => Promise<T>, timeout = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeout * 2) {
    try {
      return await fn();
    } catch (err) {
      if (Date.now() - start < timeout) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      } else {
        throw err;
      }
    }
  }

  assert.fail(`${fn.name ?? 'fn'} did not succeed within timeout`);
}
