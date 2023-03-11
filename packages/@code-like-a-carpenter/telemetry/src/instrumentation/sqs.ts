import type {Attributes, Link} from '@opentelemetry/api';
import {
  context as contextAPI,
  propagation,
  SpanKind,
  trace,
} from '@opentelemetry/api';
import {BasicTracerProvider} from '@opentelemetry/sdk-trace-base';
import {AWSLambda} from '@sentry/serverless';
import type {
  SQSBatchResponse,
  SQSEvent,
  SQSRecord,
} from 'aws-lambda/trigger/sqs';

import {runWithNewSpan} from '../run-with';

import type {NoVoidHandler} from './types';

/**
 * Like SQSHandler, but requires the promise form and disallows the nodeback
 * form.
 */
export type NoVoidSQSHandler = NoVoidHandler<SQSEvent, SQSBatchResponse | void>;

const sharedLinks = new WeakMap<SQSRecord, Link>();
/**
 * Instruments an SQS handler.
 *
 * Do not use this in addition to `withTelemetry`. `withTelemetry` is on its way
 * to being deprecated and does exactly the same thing but in a more general and
 * harder to read way.
 */
export function instrumentSQSHandler(
  handler: NoVoidSQSHandler
): NoVoidSQSHandler {
  let cold = true;
  return async (event, context) => {
    const wasCold = cold;
    cold = false;

    // @ts-expect-error: Sentry uses the generalized AWS Handler type, which
    // allows for nodeback-style handlers.
    const sentryWrappedHandler: NoVoidSQSHandler =
      AWSLambda.wrapHandler(handler);

    const attributes: Attributes = {
      'aws.lambda.invoked_arn': context.invokedFunctionArn,
      'cloud.account.id': context.invokedFunctionArn.split(':')[5],
      'faas.coldstart': wasCold,
      'faas.execution': context.awsRequestId,
      'faas.id': `${context.invokedFunctionArn
        .split(':')
        .slice(0, 7)
        .join(':')}:${context.functionVersion}`,

      'faas.trigger': 'pubsub',
      'messaging.operation': 'process',
      'messaging.source.kind': 'queue',
      'messaging.system': 'AmazonSQS',
    };

    const links = new Map<SQSRecord, Link>();
    const eventSources = new Set<string>();

    for (const record of event.Records) {
      const traceHeader = record.messageAttributes?.AWSTraceHeader?.stringValue;
      if (traceHeader) {
        const ctx = propagation.extract(contextAPI.active(), traceHeader);
        const spanCtx = trace.getSpanContext(ctx);
        if (spanCtx) {
          links.set(record, {context: spanCtx});
          sharedLinks.set(record, {context: spanCtx});
        }
      }
      eventSources.add(record.eventSource);
    }

    const eventSource =
      eventSources.size === 1
        ? event.Records[0].eventSource
        : 'multiple_sources';

    try {
      return await runWithNewSpan(
        `${eventSource} process`,
        {
          attributes,
          kind: SpanKind.CONSUMER,
          links: Array.from(links.values()),
        },
        () => sentryWrappedHandler(event, context)
      );
    } finally {
      const provider = trace.getTracerProvider();
      if (provider instanceof BasicTracerProvider) {
        await provider.forceFlush();
      }
    }
  };
}

export interface SQSMessageHandler<T> {
  (record: SQSRecord, context: T): Promise<void>;
}

export function instrumentSQSMessageHandler<T>(
  cb: SQSMessageHandler<T>
): SQSMessageHandler<T> {
  return async (record, context) => {
    const attributes: Attributes = {
      'faas.trigger': 'pubsub',
      'messaging.operation': 'process',
      'messaging.source.kind': 'queue',
      'messaging.system': 'AmazonSQS',
    };

    return await runWithNewSpan(
      `${record.eventSource} process`,
      {
        attributes,
        kind: SpanKind.CONSUMER,
        links: sharedLinks.has(record) ? [sharedLinks.get(record)!] : [],
      },
      () => cb(record, context)
    );
  };
}
