import stringify from 'fast-safe-stringify';

import {env} from '@code-like-a-carpenter/env';

import type {Meta, ConsoleLevels, LeveledLogger} from './types.ts';

const PARENT = Symbol('parent');
const PARENT_KEY = Symbol('parent_key');

export class ConsoleLogger implements LeveledLogger<ConsoleLevels> {
  private readonly dev: boolean;
  private readonly meta: Meta;

  constructor({
    dev = env('NODE_ENV', 'development') !== 'production',
    meta = {},
  } = {}) {
    this.dev = dev;
    this.meta = meta;
  }

  error(message: string): void;
  error(message: string, meta: Meta): void;
  error(message: string, meta: Meta = {}): void {
    this._log('error', message, meta);
  }

  warn(message: string): void;
  warn(message: string, meta: Meta): void;
  warn(message: string, meta: Meta = {}): void {
    this._log('warn', message, meta);
  }

  log(message: string): void;
  log(message: string, meta: Meta): void;
  log(message: string, meta: Meta = {}): void {
    this._log('log', message, meta);
  }

  info(message: string): void;
  info(message: string, meta: Meta): void;
  info(message: string, meta: Meta = {}): void {
    this._log('info', message, meta);
  }

  debug(message: string): void;
  debug(message: string, meta: Meta): void;
  debug(message: string, meta: Meta = {}): void {
    this._log('debug', message, meta);
  }

  trace(message: string): void;
  trace(message: string, meta: Meta): void;
  trace(message: string, meta: Meta = {}): void {
    this._log('trace', message, meta);
  }

  _log(level: ConsoleLevels, message: string): void;
  _log(level: ConsoleLevels, message: string, meta: Meta): void;
  _log(level: ConsoleLevels, message: string, meta: Meta = {}): void {
    let input = {
      ...this.meta,
      ...meta,
      level,
      message,
    };

    // Make a second copy that puts message first to make it easier to read in
    // the local terminal. This should not be done in prod because it's an extra
    // copy, but there's no good way to get this behavior without it.
    if (this.dev) {
      const {message: msg, ...rest} = input;
      input = {
        message,
        ...rest,
      };
    }

    let output;
    try {
      output = JSON.stringify(input, replacer, this.dev ? 2 : 0);
    } catch (err) {
      this._log(
        'warn',
        'JSON.stringify failed, falling back to fast-safe-stringify',
        {
          err,
        }
      );

      output = stringify(input, replacer, this.dev ? 2 : 0);
    }
    console[level](output);
  }

  child(meta: Meta) {
    return new ConsoleLogger({dev: this.dev, meta: {...this.meta, ...meta}});
  }
}

function isErrorLike(val: unknown) {
  return (
    typeof val === 'object' &&
    (val instanceof Error ||
      (Object.prototype.hasOwnProperty.call(val, 'message') &&
        Object.prototype.hasOwnProperty.call(val, 'stack')))
  );
}

// eslint-disable-next-line complexity
function replacer(this: any, key: string, value: any): any {
  if (
    key === '' &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    'err' in value &&
    isErrorLike(value.err)
  ) {
    const {err, ...rest} = value;
    value = {
      ...err,
      message: err.message,
      stack: err.stack,
      ...rest,
    };
  }

  // eslint-disable-next-line no-invalid-this
  if (this[PARENT_KEY] === 'headers') {
    if (key === 'authorization') {
      return '<redacted>';
    }
  }

  // eslint-disable-next-line no-invalid-this
  if (this[PARENT_KEY] === 'user') {
    if (key === 'login' || key === 'displayName' || key === 'email') {
      return '<redacted>';
    }
  }

  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    // eslint-disable-next-line no-invalid-this
    value[PARENT] = this[PARENT];
    value[PARENT_KEY] = key;
  }

  return value;
}
