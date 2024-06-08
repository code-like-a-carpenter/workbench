import type {Context} from 'aws-lambda/handler.js';

export type NoVoidHandler<TEvent, TResult> = (
  event: TEvent,
  context: Context
) => Promise<TResult>;
