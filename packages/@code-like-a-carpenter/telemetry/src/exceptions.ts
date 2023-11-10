import {AssertionError} from 'assert';

import {ServiceException} from '@aws-sdk/smithy-client';
import type {Span} from '@opentelemetry/api';
import {SpanStatusCode} from '@opentelemetry/api';
import type {Scope} from '@sentry/serverless';
import {
  captureException as sentryCaptureException,
  withScope,
} from '@sentry/serverless';
import {snakeCase} from 'snake-case';

import {Exception} from '@code-like-a-carpenter/exception';
import type {Logger} from '@code-like-a-carpenter/logger';
import {logger as rootLogger} from '@code-like-a-carpenter/logger';

import type {NoVoidHandler} from './instrumentation';
import {getCurrentSpan} from './run-with';

// eslint-disable-next-line complexity
function addExceptionDetails(err: unknown, span?: Span, scope?: Scope) {
  if (err instanceof Exception) {
    Object.entries(err).forEach(([key, value]) => {
      span?.setAttribute(
        `com.code-like-a-carpenter.exception.${snakeCase(key)}`,
        JSON.stringify(value)
      );
    });
  }

  if (err instanceof ServiceException) {
    span?.setAttributes({
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
    });

    scope?.setContext('exception.aws', {
      $fault: err.$fault,
      '$metadata.attempts': err.$metadata?.attempts,
      '$metadata.cfId': err.$metadata?.cfId,
      '$metadata.extendedRequestId': err.$metadata?.extendedRequestId,
      '$metadata.httpStatusCode': err.$metadata?.httpStatusCode,
      '$metadata.requestId': err.$metadata?.requestId,
      '$metadata.totalRetryDelay': err.$metadata?.totalRetryDelay,
      '$response.statusCode': err.$response?.statusCode ?? '',
      '$retryable.throttling': err.$retryable?.throttling ?? false,
      // @ts-expect-error - as far as I can tell, this _does_ exist. I don't
      // know why tsc can't see it.
      $service: err.$service ?? '',
    });
  }

  if (err instanceof Error && err.cause instanceof Error) {
    span?.setAttributes({
      'exception.cause.message': err.cause.message,
      'exception.cause.name': err.cause.name,
      'exception.cause.stacktrace': err.cause.stack,
      'exception.cause.type': err.cause.constructor.name,
    });
    scope?.setContext('exception.cause', {
      message: err.cause.message,
      name: err.cause.name,
      stacktrace: err.cause.stack,
      type: err.cause.constructor.name,
    });
  }
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

  if (escaped) {
    // If the exception escaped, we assume a higher-level captureException call
    // will send it to Sentry.
    addExceptionDetails(err, span);
  } else {
    // If the exception has not escaped, we assume has been handled and someone
    // still thinks it should be reporter so therefore we send it to Sentry.
    withScope((scope) => {
      addExceptionDetails(err, span, scope);
      sentryCaptureException(err);
    });
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
  init(): void;
  wrapHandler<T, R>(handler: NoVoidHandler<T, R>): NoVoidHandler<T, R>;
}

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
  service.init();
  return service.wrapHandler(handler);
}

export const noopExceptionTracingService: ExceptionTracingService = {
  init() {},
  wrapHandler<T, R>(handler: NoVoidHandler<T, R>): NoVoidHandler<T, R> {
    return handler;
  },
};
