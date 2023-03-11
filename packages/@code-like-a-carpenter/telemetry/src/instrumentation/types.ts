import type {Context} from 'aws-lambda/handler';

export type NoVoidHandler<TEvent, TResult> = (
  event: TEvent,
  context: Context
) => Promise<TResult>;
