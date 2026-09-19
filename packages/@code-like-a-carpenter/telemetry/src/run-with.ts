import {readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import type {Context, Span, SpanOptions} from '@opentelemetry/api';
import {SpanKind, trace} from '@opentelemetry/api';

import {assert} from '@code-like-a-carpenter/assert';

import {captureException} from './exceptions.ts';

export type SpanHandler<T> = (span: Span) => T;

export function getCurrentSpan() {
  return trace.getActiveSpan();
}

let tracer: ReturnType<typeof trace.getTracer> | undefined;
function loadPkg() {
  console.log({
    d: __dirname,
    i: import.meta.url,
  });
  const dirname =
    typeof import.meta.url === 'string' && import.meta.url.length > 0
      ? path.dirname(fileURLToPath(import.meta.url))
      : __dirname;

  try {
    // when readinng from dist
    const pkg = JSON.parse(
      readFileSync(path.join(dirname, '..', '..', 'package.json'), 'utf8')
    );
    return pkg;
  } catch (err) {
    // when readinng from src
    const pkg = JSON.parse(
      readFileSync(path.join(dirname, '..', 'package.json'), 'utf8')
    );
    return pkg;
  }
}
export function getTracer() {
  if (tracer) {
    return tracer;
  }

  const pkg = loadPkg();
  assert(pkg, 'Could not find package.json for this module');
  assert('name' in pkg, 'Package.json must have a name');
  assert(typeof pkg.name === 'string', 'Package name must be a string');
  return trace.getTracer(pkg.name, pkg.version);
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
