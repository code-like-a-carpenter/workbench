import {assert} from '@code-like-a-carpenter/assert';

import {NotFoundError} from '../../errors';
import type {ResultType} from '../../types';
import type {Handler} from '../common/handlers';
import {makeSqsHandler} from '../common/handlers';
import type {UnmarshalledDynamoDBRecord} from '../common/unmarshall-record';

interface SDK<SOURCE, TARGET, CREATE_TARGET_INPUT, UPDATE_TARGET_INPUT> {
  createTargetModel: (
    target: CREATE_TARGET_INPUT
  ) => Promise<ResultType<TARGET>>;
  unmarshallSourceModel: (item: Record<string, unknown>) => SOURCE;
  updateTargetModel: (
    target: UPDATE_TARGET_INPUT
  ) => Promise<ResultType<TARGET>>;
}

/**
 * Makes an SQS handler that expects the payload to be a DynamoDB Stream Record.
 */
export function makeReducer<
  SOURCE,
  TARGET,
  CREATE_TARGET_INPUT,
  UPDATE_TARGET_INPUT
>(
  constructor: ReducerConstructor<
    SOURCE,
    TARGET,
    CREATE_TARGET_INPUT,
    UPDATE_TARGET_INPUT
  >,
  sdk: SDK<SOURCE, TARGET, CREATE_TARGET_INPUT, UPDATE_TARGET_INPUT>
): Handler {
  const reducer = new constructor(sdk);
  return makeSqsHandler(async (record) => {
    await reducer.reduce(record);
  });
}

export interface ReducerConstructor<
  SOURCE,
  TARGET,
  CREATE_TARGET_INPUT,
  UPDATE_TARGET_INPUT
> {
  new (
    sdk: SDK<SOURCE, TARGET, CREATE_TARGET_INPUT, UPDATE_TARGET_INPUT>
  ): Reducer<SOURCE, TARGET, CREATE_TARGET_INPUT, UPDATE_TARGET_INPUT>;
}

export abstract class Reducer<
  SOURCE,
  TARGET,
  CREATE_TARGET_INPUT,
  UPDATE_TARGET_INPUT
> {
  sdk: SDK<SOURCE, TARGET, CREATE_TARGET_INPUT, UPDATE_TARGET_INPUT>;
  constructor(
    sdk: SDK<SOURCE, TARGET, CREATE_TARGET_INPUT, UPDATE_TARGET_INPUT>
  ) {
    this.sdk = sdk;
  }

  async reduce(unmarshalledRecord: UnmarshalledDynamoDBRecord): Promise<void> {
    const {createTargetModel, updateTargetModel, unmarshallSourceModel} =
      this.sdk;
    assert(
      unmarshalledRecord.dynamodb?.NewImage,
      'NewImage missing from DynamoDB Stream Event. This should never happen.'
    );

    const source = unmarshallSourceModel(unmarshalledRecord.dynamodb?.NewImage);
    const previous =
      unmarshalledRecord.dynamodb?.OldImage &&
      unmarshallSourceModel(unmarshalledRecord.dynamodb.OldImage);
    const sources = await this.loadSources(source, previous);
    try {
      const target = await this.loadTarget(source, previous);

      const modelToUpdate = await this.update(
        source,
        sources,
        target,
        previous
      );
      if (modelToUpdate) {
        await updateTargetModel(modelToUpdate);
        return;
      }
    } catch (err) {
      if (err instanceof NotFoundError) {
        const modelToCreate = await this.create(source, sources, previous);
        if (modelToCreate) {
          await createTargetModel(modelToCreate);
          return;
        }
      }
      throw err;
    }
  }

  protected abstract loadTarget(
    source: SOURCE,
    // previous always comes last so that implementations can treat it as
    // optional
    previous: SOURCE | undefined
  ): Promise<TARGET>;
  protected abstract loadSources(
    source: SOURCE,
    // previous always comes last so that implementations can treat it as
    // optional
    previous: SOURCE | undefined
  ): Promise<readonly SOURCE[]>;
  protected abstract create(
    source: SOURCE,
    sources: readonly SOURCE[],
    // previous always comes last so that implementations can treat it as
    // optional
    previous: SOURCE | undefined
  ): Promise<CREATE_TARGET_INPUT | undefined>;
  protected abstract update(
    source: SOURCE,
    sources: readonly SOURCE[],
    target: TARGET,
    // previous always comes last so that implementations can treat it as
    // optional
    previous: SOURCE | undefined
  ): Promise<UPDATE_TARGET_INPUT | undefined>;
}
