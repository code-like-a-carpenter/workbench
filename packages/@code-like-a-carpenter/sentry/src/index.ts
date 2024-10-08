import {
  captureException as sentryCaptureException,
  init as sentryInit,
  withScope,
  wrapHandler as sentryWrapHandler,
} from '@sentry/aws-serverless';

import {env} from '@code-like-a-carpenter/env';
import {ClientError} from '@code-like-a-carpenter/errors';
import type {
  ExceptionTracingServiceInitializer,
  ExceptionTracingServiceWrapper,
  ExceptionTracingServiceCaptureException,
} from '@code-like-a-carpenter/telemetry';

export const captureException: ExceptionTracingServiceCaptureException = (
  e: Error,
  attributes: Record<string, boolean | number | string | undefined>
) => {
  withScope((scope) => {
    scope.setContext('attributes', attributes);
    sentryCaptureException(e);
  });
};

export const init: ExceptionTracingServiceInitializer = () => {
  const dsn = env('SENTRY_DSN', '');
  if (!dsn) {
    console.warn('Missing SENTRY_DSN, Sentry will not be initialized');
    return;
  }

  const release = env('SENTRY_RELEASE', env('SHA', ''));
  if (!release) {
    console.warn(
      'Missing SENTRY_RELEASE and unable to fallback to SHA, Sentry will not be initialized'
    );
    return;
  }

  const environment = env('SENTRY_ENVIRONMENT', '');

  try {
    sentryInit({
      beforeSend(event, hint) {
        // Ignore client errors since they're normal and expected. (Of course,
        // we'll need metrics on them to alert if they happen _too_ often.)
        if (hint.originalException instanceof ClientError) {
          return null;
        }

        // If this exception was picked up though Sentry otel integration, and
        // if it escaped, then it's still possible code higher up the stack will
        // handle it. We don't want it to get to Sentry (and therefore possibly
        // page someone) until it's about to escape the process. If a Lambda
        // bubbles all the way up, either it'll be captured with escaped=false
        // set explicitly or the unhandled exception handler will catch it.
        if (
          event.contexts &&
          event.contexts.otel &&
          event.contexts.otel.attributes &&
          typeof event.contexts.otel.attributes === 'object' &&
          'exception.escaped' in event.contexts.otel.attributes &&
          event.contexts.otel.attributes['exception.escaped'] === true
        ) {
          return null;
        }

        return event;
      },
      dsn,
      environment,
      // It appears `instrumenter: otel` is only relevant for performance
      // instrumentation, not error reporting.
      // instrumenter: 'otel',
      release,
      sampleRate: Number(env('SENTRY_SAMPLE_RATE', '1')),
    });
  } catch (err) {
    if (process.env.NODE_ENV !== 'test') {
      throw err;
    }
  }
};

export const wrapHandler: ExceptionTracingServiceWrapper = (handler) => {
  return sentryWrapHandler(handler) as typeof handler;
};
