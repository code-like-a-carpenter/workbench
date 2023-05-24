import {assert} from '@code-like-a-carpenter/assert';
import {getCurrentSpan} from '@code-like-a-carpenter/telemetry';

import {CDCHandler} from '../common/cdc-handler';
import type {Handler} from '../common/handlers';
import {makeSqsHandler} from '../common/handlers';
import type {UnmarshalledDynamoDBRecord} from '../common/unmarshall-record';

interface SDK<T> {
  unmarshallSourceModel: (item: Record<string, unknown>) => T;
}

/**
 * Makes an SQS handler that expects the payload to be a DynamoDB Stream Record.
 */
export function makeReactor<T>(
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

export abstract class Reactor<T> extends CDCHandler {
  sdk: SDK<T>;
  constructor(sdk: SDK<T>) {
    super();
    this.sdk = sdk;
  }

  react(unmarshalledRecord: UnmarshalledDynamoDBRecord): Promise<void> {
    return this.runWithNewSpan('react', async () => {
      const {unmarshallSourceModel} = this.sdk;
      assert(
        unmarshalledRecord.dynamodb?.NewImage,
        'NewImage missing from DynamoDB Stream Event. This should never happen.'
      );
      const source = unmarshallSourceModel(
        unmarshalledRecord.dynamodb?.NewImage
      );
      const previous =
        unmarshalledRecord.dynamodb?.OldImage &&
        unmarshallSourceModel(unmarshalledRecord.dynamodb.OldImage);

      getCurrentSpan()?.setAttributes({
        'com.code-like-a-carpenter.foundation.previous.exists': !!previous,
      });

      return this.runWithNewSpan('handle', () => this.handle(source, previous));
    });
  }

  protected abstract handle(source: T, previous: T | undefined): Promise<void>;
}
