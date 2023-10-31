import {assert} from '@code-like-a-carpenter/assert';
import {getCurrentSpan} from '@code-like-a-carpenter/telemetry';

import type {ResultType} from '../../types';
import {CDCHandler} from '../common/cdc-handler';
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
  UPDATE_TARGET_INPUT extends object,
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
  UPDATE_TARGET_INPUT extends object,
> {
  new (
    sdk: SDK<SOURCE, TARGET, CREATE_TARGET_INPUT, UPDATE_TARGET_INPUT>
  ): MultiReducer<SOURCE, TARGET, CREATE_TARGET_INPUT, UPDATE_TARGET_INPUT>;
}

export abstract class MultiReducer<
  SOURCE,
  TARGET,
  CREATE_TARGET_INPUT extends object,
  UPDATE_TARGET_INPUT extends object,
> extends CDCHandler {
  sdk: SDK<SOURCE, TARGET, CREATE_TARGET_INPUT, UPDATE_TARGET_INPUT>;

  constructor(
    sdk: SDK<SOURCE, TARGET, CREATE_TARGET_INPUT, UPDATE_TARGET_INPUT>
  ) {
    super();
    this.sdk = sdk;
  }

  async reduce(unmarshalledRecord: UnmarshalledDynamoDBRecord): Promise<void> {
    return this.runWithNewSpan('multi-reduce', async () => {
      const {createTargetModel, updateTargetModel, unmarshallSourceModel} =
        this.sdk;
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

      const sources = await this.runWithNewSpan('loadSources', () =>
        this.loadSources(source, previous)
      );

      getCurrentSpan()?.setAttributes({
        'com.code-like-a-carpenter.foundation.sources.count': sources.length,
      });

      const targets = await this.runWithNewSpan('loadTargets', () =>
        this.loadTargets(source, previous)
      );

      getCurrentSpan()?.setAttributes({
        'com.code-like-a-carpenter.foundation.targets.count': targets.length,
      });

      const models = await this.runWithNewSpan('createOrUpdate', () =>
        this.createOrUpdate(source, sources, targets, previous)
      );

      const modelsToCreate = models.filter(
        (model): model is CREATE_TARGET_INPUT => !('version' in model)
      );
      const modelsToUpdate = models.filter(
        (model): model is UPDATE_TARGET_INPUT => 'version' in model
      );

      getCurrentSpan()?.setAttributes({
        'com.code-like-a-carpenter.foundation.targets-to-create.count':
          modelsToCreate.length,
        'com.code-like-a-carpenter.foundation.targets-to-update.count':
          modelsToUpdate.length,
      });

      await Promise.all([
        Promise.all(
          modelsToCreate.map((model) =>
            this.runWithNewSpan('createTargetModel', () =>
              createTargetModel(model)
            )
          )
        ),
        Promise.all(
          modelsToUpdate.map((model) =>
            this.runWithNewSpan('updateTargetModel', () =>
              updateTargetModel(model)
            )
          )
        ),
      ]);
    });
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
