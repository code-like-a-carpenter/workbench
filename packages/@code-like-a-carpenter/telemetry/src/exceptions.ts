import {AssertionError} from 'assert';

import {SpanStatusCode} from '@opentelemetry/api';
import {ServiceException} from '@smithy/smithy-client';
import {snakeCase} from 'snake-case';

import {assert} from '@code-like-a-carpenter/assert';
import {Exception} from '@code-like-a-carpenter/exception';
import type {Logger} from '@code-like-a-carpenter/logger';
import {logger as rootLogger} from '@code-like-a-carpenter/logger';

import type {NoVoidHandler} from './instrumentation/index.ts';
import {getCurrentSpan} from './run-with.ts';

let exceptionTracingService: ExceptionTracingService;

function makeAttributes(err: unknown) {
  let attributes: Record<string, boolean | number | string | undefined> = {};
  if (err instanceof Exception) {
    Object.entries(err).forEach(([key, value]) => {
      attributes[`com.code-like-a-carpenter.exception.${snakeCase(key)}`] =
        JSON.stringify(value);
    });
  }

  if (err instanceof ServiceException) {
    attributes = {
      ...attributes,
      'exception.aws.$fault': err.$fault,
      'exception.aws.$metadata.attempts': err.$metadata?.attempts,
      'exception.aws.$metadata.cfId': err.$metadata?.cfId,
      'exception.aws.$metadata.extendedRequestId':
        err.$metadata?.extendedRequestId,
      'exception.aws.$metadata.httpStatusCode': err.$metadata?.httpStatusCode,
      'exception.aws.$metadata.requestId': err.$metadata?.requestId,
      'exception.aws.$metadata.totalRetryDelay': err.$metadata?.totalRetryDelay,
      'exception.aws.$response.statusCode': err.$response?.statusCode ?? '',
      'exception.aws.$retryable.throttling':
        err.$retryable?.throttling ?? false,
      // @ts-expect-error - as far as I can tell, this _does_ exist. I don't
      // know why tsc can't see it.
      'exception.aws.$service': err.$service ?? '',
    };
  }
  if (err instanceof Error && err.cause instanceof Error) {
    attributes = {
      ...attributes,
      'exception.cause.message': err.cause.message,
      'exception.cause.name': err.cause.name,
      'exception.cause.stacktrace': err.cause.stack,
      'exception.cause.type': err.cause.constructor.name,
    };
  }

  return attributes;
}

/**
 * @param e - the exception to capture
 * @param escaped - Indicates if the error was unhandled. In general, this will
 * be true until the exception reaches a catch block and is not rethrown.
 * @param logger - optional logger to use when OpenTelemetry is not in use. If
 * not supplied, the default CLC logger will be used
 */
export function captureException(
  e: unknown,
  escaped = true,
  logger: Logger = rootLogger
): Error {
  const err = reformError(e);
  const span = getCurrentSpan();

  if (span) {
    span.setStatus({code: SpanStatusCode.ERROR, message: err.message});
    span.recordException(err);
    span.setAttribute('exception.escaped', escaped);
  } else {
    // If we don't have a span, assume OpenTelemetry has not been configured, so
    // we want to log instead of suppressing the error.
    logger.error(
      'Logging error message because OpenTelemetry does not appear to be in use',
      {cause: e instanceof Error ? e.cause : undefined, err: e}
    );
  }

  const attributes = makeAttributes(err);
  span?.setAttributes(attributes);
  // If the exception escaped, we assume a higher-level captureException call
  // will send it to Sentry.
  if (!escaped) {
    // If the exception has not escaped,  we assume it has been handled and
    // someone still thinks it should be reported therefore we send it to Sentry
    // or Bugsnag or whatever.
    assert(
      exceptionTracingService,
      'It should be impossible to get here without exceptionTracingService being set'
    );
    exceptionTracingService.captureException(err, attributes);
  }

  return err;
}

/** Converts a non-error Error to an Error */
function reformError(e: unknown): Error {
  if (e instanceof Error || e instanceof AssertionError) {
    return e;
  }

  if (typeof e === 'string') {
    return new Exception(e, {cause: e});
  }

  return new Exception(`Unknown error`, {cause: e});
}

export interface ExceptionTracingService {
  captureException(
    e: Error,
    attributes: Record<string, boolean | number | string | undefined>
  ): void;

  init(): void;

  wrapHandler<T, R>(handler: NoVoidHandler<T, R>): NoVoidHandler<T, R>;
}

export type ExceptionTracingServiceInitializer =
  ExceptionTracingService['init'];
export type ExceptionTracingServiceWrapper =
  ExceptionTracingService['wrapHandler'];
export type ExceptionTracingServiceCaptureException =
  ExceptionTracingService['captureException'];

export function setupExceptionTracing<T, R>(
  handler: NoVoidHandler<T, R>,
  /**
   * If your service doesn't need exception tracing, you can pass in the
   * `noopExceptionTracingService`. Rather than making this field optional, I
   * decided that far fewer mistakes will be made if you have to explicitly
   * choose not to use tracing.
   */
  service: ExceptionTracingService
): NoVoidHandler<T, R> {
  exceptionTracingService = service;
  service.init();
  return service.wrapHandler(handler);
}

export const noopExceptionTracingService: ExceptionTracingService = {
  captureException() {},
  init() {},
  wrapHandler<T, R>(handler: NoVoidHandler<T, R>): NoVoidHandler<T, R> {
    return handler;
  },
};
