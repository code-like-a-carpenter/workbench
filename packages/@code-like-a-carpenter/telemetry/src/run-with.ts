import assert from 'assert';

import type {Context, Span, SpanOptions} from '@opentelemetry/api';
import {SpanKind, trace} from '@opentelemetry/api';

import {env} from '@code-like-a-carpenter/env';

import {captureException} from './exceptions.ts';

export type SpanHandler<T> = (span: Span) => T;

export function getCurrentSpan() {
  return trace.getActiveSpan();
}

export function getTracer(
  name = env('AWS_LAMBDA_FUNCTION_NAME', 'unknown'),
  version = env('AWS_LAMBDA_FUNCTION_VERSION', 'unknown')
) {
  return trace.getTracer(name, version);
}

/** Runs `fn` with inside specified span */
export function runWithSpan<T>(span: Span, fn: SpanHandler<T>): T {
  const onFinally = () => span.end();

  const onCatch = (e: unknown) => {
    throw captureException(e);
  };

  let result;
  try {
    result = fn(span) as T | Promise<T>;
    if (result instanceof Promise) {
      return result
        .then((v) => v)
        .catch(onCatch)
        .finally(onFinally) as unknown as T;
    }
    return result;
  } catch (e) {
    if (!(result instanceof Promise)) {
      return onCatch(e);
    }
    throw e;
  } finally {
    if (!(result instanceof Promise)) {
      onFinally();
    }
  }
}

/** Runs `fn` with inside a newly-created new span */
export function runWithNewSpan<T>(name: string, fn: SpanHandler<T>): T;
export function runWithNewSpan<T>(
  name: string,
  options: SpanOptions,
  fn: SpanHandler<T>
): T;
export function runWithNewSpan<T>(
  name: string,
  options: SpanOptions | SpanHandler<T>,
  fn?: SpanHandler<T>
): T {
  if (!fn) {
    fn = options as SpanHandler<T>;
    options = {};
  }

  return getTracer().startActiveSpan(
    name,
    {kind: SpanKind.INTERNAL, ...options},
    (span) => {
      assert(typeof fn === 'function', 'fn must be a function');
      return runWithSpan(span, fn);
    }
  );
}

/**
 * Run `fn` with a new span created from `name`, linked to another span. Use
 * this, for example, when processing a message from a queue, and you want to
 * link the span to the span that created the message.
 *
 * @example
 * ```ts
 *  const rawCtx = record.messageAttributes?.AWSTraceHeader?.stringValue;
 *  if (rawCtx) {
 *    const ctx = api.propagation.extract(api.context.active(), rawCtx)
 *    return runWithNewSpanLinked(
 *      `${eventSource} process`,
 *      {kind: SpanKind.CONSUMER},
 *      ctx,
 *      (span) => doWork()
 *    );
 *  }
 *  return runWithNewSpan(
 *    `${eventSource} process`,
 *    {kind: SpanKind.CONSUMER},
 *    (span) => doWork()
 *  );
 *```
 */
export function runWithNewLinkedSpan<T>(
  name: string,
  attrs: SpanOptions,
  context: Context | Context[],
  fn: SpanHandler<T>
): T {
  const links = attrs.links ?? [];
  (Array.isArray(context) ? context : [context]).forEach((ctx) => {
    const spanContext = trace.getSpanContext(ctx);

    if (spanContext) {
      links.push({context: spanContext});
    }
  });

  return runWithNewSpan(
    name,
    {
      kind: SpanKind.INTERNAL,
      ...attrs,
      links,
    },
    fn
  );
}
