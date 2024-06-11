import {EnvironmentError} from './errors/environment-error.mjs';
import {TypeNarrowingError} from './errors/type-narrowing-error.mjs';

/**
 * Returns the value of the environment variable with the given key, using
 * fallback if supplied or throwing otherwise.
 *
 * @param {string} key
 * @param {string} [fallback]
 * @returns {string}
 */
export function env(key, fallback) {
  if (key in process.env) {
    const value = process.env[key];
    if (typeof value === 'undefined') {
      throw new TypeNarrowingError();
    }

    return value;
  }

  if (typeof fallback !== 'undefined') {
    return fallback;
  }

  throw new EnvironmentError(key);
}
