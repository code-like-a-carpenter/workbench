import {assert} from '@code-like-a-carpenter/assert';

import type {Handler, UnmarshalledDynamoDBRecord} from './common';
import {makeSqsHandler} from './common';

interface SDK<T> {
  unmarshallSourceModel: (item: Record<string, unknown>) => T;
}

/**
 * Makes an SQS handler that expects the payload to be a DynamoDB Stream Record.
 */
export function makeReactorHandler<T>(
  constructor: ReactorConstructor<T>,
  sdk: SDK<T>
): Handler {
  const reactor = new constructor(sdk);
  return makeSqsHandler(async (record) => {
    await reactor.react(record);
  });
}

export interface ReactorConstructor<T> {
  new (sdk: SDK<T>): Reactor<T>;
}

export abstract class Reactor<T> {
  sdk: SDK<T>;
  constructor(sdk: SDK<T>) {
    this.sdk = sdk;
  }

  react(unmarshalledRecord: UnmarshalledDynamoDBRecord): Promise<void> {
    const {unmarshallSourceModel} = this.sdk;
    assert(
      unmarshalledRecord.dynamodb?.NewImage,
      'NewImage missing from DynamoDB Stream Event. This should never happen.'
    );
    const source = unmarshallSourceModel(unmarshalledRecord.dynamodb?.NewImage);
    return this.handle(source);
  }

  protected abstract handle(source: T): Promise<void>;
}
