import {assert} from '@code-like-a-carpenter/assert';

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
export function makeMultiReducer<
  SOURCE,
  TARGET,
  CREATE_TARGET_INPUT extends object,
  UPDATE_TARGET_INPUT extends object
>(
  constructor: MultiReducerConstructor<
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

export interface MultiReducerConstructor<
  SOURCE,
  TARGET,
  CREATE_TARGET_INPUT extends object,
  UPDATE_TARGET_INPUT extends object
> {
  new (
    sdk: SDK<SOURCE, TARGET, CREATE_TARGET_INPUT, UPDATE_TARGET_INPUT>
  ): MultiReducer<SOURCE, TARGET, CREATE_TARGET_INPUT, UPDATE_TARGET_INPUT>;
}

export abstract class MultiReducer<
  SOURCE,
  TARGET,
  CREATE_TARGET_INPUT extends object,
  UPDATE_TARGET_INPUT extends object
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
    const target = await this.loadTargets(source, previous);

    const models = await this.createOrUpdate(source, sources, target, previous);
    const modelsToCreate = models.filter(
      (model): model is CREATE_TARGET_INPUT => !('version' in model)
    );
    const modelsToUpdate = models.filter(
      (model): model is UPDATE_TARGET_INPUT => 'version' in model
    );

    await Promise.all([
      Promise.all(modelsToCreate.map((model) => createTargetModel(model))),
      Promise.all(modelsToUpdate.map((model) => updateTargetModel(model))),
    ]);
  }

  protected abstract loadTargets(
    source: SOURCE,
    // previous always comes last so that implementations can treat it as
    // optional
    previous: SOURCE | undefined
  ): Promise<TARGET[]>;

  protected abstract loadSources(
    source: SOURCE,
    // previous always comes last so that implementations can treat it as
    // optional
    previous: SOURCE | undefined
  ): Promise<readonly SOURCE[]>;

  protected abstract createOrUpdate(
    source: SOURCE,
    sources: readonly SOURCE[],
    targets: readonly TARGET[],
    // previous always comes last so that implementations can treat it as
    // optional
    previous: SOURCE | undefined
  ): Promise<(CREATE_TARGET_INPUT | UPDATE_TARGET_INPUT)[]>;
}
