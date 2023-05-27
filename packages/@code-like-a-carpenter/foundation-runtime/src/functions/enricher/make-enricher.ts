import {assert} from '@code-like-a-carpenter/assert';
import {getCurrentSpan} from '@code-like-a-carpenter/telemetry';

import {NotFoundError} from '../../errors';
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
 * Returns a function that handles a DynamoDB for the SOURCE and produces a
 * TARGET
 */
export function makeEnricher<
  SOURCE,
  TARGET,
  CREATE_TARGET_INPUT,
  UPDATE_TARGET_INPUT
>(
  constructor: EnricherConstructor<
    SOURCE,
    TARGET,
    CREATE_TARGET_INPUT,
    UPDATE_TARGET_INPUT
  >,
  sdk: SDK<SOURCE, TARGET, CREATE_TARGET_INPUT, UPDATE_TARGET_INPUT>
): Handler {
  const enricher = new constructor(sdk);

  return makeSqsHandler(async (unmarshalledRecord) => {
    await enricher.enrich(unmarshalledRecord);
  });
}

export interface EnricherConstructor<
  SOURCE,
  TARGET,
  CREATE_TARGET_INPUT,
  UPDATE_TARGET_INPUT
> {
  new (
    sdk: SDK<SOURCE, TARGET, CREATE_TARGET_INPUT, UPDATE_TARGET_INPUT>
  ): Enricher<SOURCE, TARGET, CREATE_TARGET_INPUT, UPDATE_TARGET_INPUT>;
}

export abstract class Enricher<
  SOURCE,
  TARGET,
  CREATE_TARGET_INPUT,
  UPDATE_TARGET_INPUT
> extends CDCHandler {
  sdk: SDK<SOURCE, TARGET, CREATE_TARGET_INPUT, UPDATE_TARGET_INPUT>;

  constructor(
    sdk: SDK<SOURCE, TARGET, CREATE_TARGET_INPUT, UPDATE_TARGET_INPUT>
  ) {
    super();
    this.sdk = sdk;
  }

  async enrich(unmarshalledRecord: UnmarshalledDynamoDBRecord) {
    return this.runWithNewSpan('enrich', async () => {
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

      try {
        const target = await this.runWithNewSpan('load', () =>
          this.load(source, previous)
        );

        getCurrentSpan()?.setAttributes({
          'com.code-like-a-carpenter.foundation.target.exists': !!target,
        });

        const modelToUpdate = await this.runWithNewSpan('update', () =>
          this.update(source, target, previous)
        );

        getCurrentSpan()?.setAttributes({
          'com.code-like-a-carpenter.foundation.should-update': !!modelToUpdate,
        });

        if (modelToUpdate) {
          await this.runWithNewSpan('updateTargetModel', () =>
            updateTargetModel(modelToUpdate)
          );
        }
        return;
      } catch (err) {
        if (err instanceof NotFoundError) {
          const modelToCreate = await this.runWithNewSpan('create', () =>
            this.create(source, previous)
          );

          getCurrentSpan()?.setAttributes({
            'com.code-like-a-carpenter.foundation.should-create':
              !!modelToCreate,
          });

          if (modelToCreate) {
            await this.runWithNewSpan('createTargetModel', () =>
              createTargetModel(modelToCreate)
            );
          }
          return;
        }
        throw err;
      }
    });
  }

  abstract load(
    record: SOURCE,
    // previous always comes last so that implementations can treat it as
    // optional
    previous: SOURCE | undefined
  ): Promise<TARGET>;

  abstract create(
    record: SOURCE,
    // previous always comes last so that implementations can treat it as
    // optional
    previous: SOURCE | undefined
  ): Promise<CREATE_TARGET_INPUT | undefined>;

  abstract update(
    record: SOURCE,
    target: TARGET,
    // previous always comes last so that implementations can treat it as
    // optional
    previous: SOURCE | undefined
  ): Promise<UPDATE_TARGET_INPUT | undefined>;
}
