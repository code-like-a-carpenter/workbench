import {EnvironmentError} from './errors/environment-error.ts';
import {TypeNarrowingError} from './errors/type-narrowing-error.ts';

/**
 * Returns the value of the environment variable with the given key, using
 * fallback if supplied or throwing otherwise.
 */
export function env(key: string, fallback?: string): string {
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
