// This package is a wrapper around node assert.
// eslint-disable-next-line no-restricted-imports
import nodeAssert, {AssertionError} from 'assert';

/**
 * @callback Provider
 * @returns {string | Error}
 */

/**
 * @param value {unknown}
 * @param message {string | Error | Provider}
 * @returns {asserts value}
 */
export function assert(value, message) {
  if (typeof message === 'string' || message instanceof Error) {
    nodeAssert.ok(value, message);
  } else {
    try {
      nodeAssert.ok(value);
    } catch (err) {
      const realError = message();
      if (realError instanceof Error) {
        throw realError;
      }
      throw new AssertionError({message: realError});
    }
  }
}

export {
  deepEqual,
  deepStrictEqual,
  // Removing the next line for now because it's missing from esbuild's node
  // builtins polyfill
  // doesNotMatch,
  doesNotReject,
  doesNotThrow,
  equal,
  fail,
  ifError,
  // Removing the next line for now because it's missing from esbuild's node
  // builtins polyfill
  // match,
  notDeepEqual,
  notDeepStrictEqual,
  notEqual,
  notStrictEqual,
  ok,
  rejects,
  strictEqual,
  throws,
  AssertionError,
} from 'assert';
