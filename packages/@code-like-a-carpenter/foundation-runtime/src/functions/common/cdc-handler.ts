import type {SpanOptions} from '@opentelemetry/api';

import {assert} from '@code-like-a-carpenter/assert';
import type {SpanHandler} from '@code-like-a-carpenter/telemetry';
import {runWithNewSpan} from '@code-like-a-carpenter/telemetry';

export class CDCHandler {
  protected runWithNewSpan<T>(name: string, fn: SpanHandler<T>): T;
  protected runWithNewSpan<T>(
    name: string,
    options: SpanOptions,
    fn: SpanHandler<T>
  ): T;
  protected runWithNewSpan<T>(
    name: string,
    options: SpanOptions | SpanHandler<T>,
    fn?: SpanHandler<T>
  ): T {
    if (!fn) {
      fn = options as SpanHandler<T>;
      options = {};
    }
    assert(typeof fn === 'function', 'fn must be a function');
    assert(typeof options === 'object', 'options must be an object');
    return runWithNewSpan(`${this.constructor.name}.${name}`, options, fn);
  }
}
