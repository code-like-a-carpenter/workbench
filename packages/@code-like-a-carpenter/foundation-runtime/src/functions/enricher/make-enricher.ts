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
> {
  sdk: SDK<SOURCE, TARGET, CREATE_TARGET_INPUT, UPDATE_TARGET_INPUT>;

  constructor(
    sdk: SDK<SOURCE, TARGET, CREATE_TARGET_INPUT, UPDATE_TARGET_INPUT>
  ) {
    this.sdk = sdk;
  }

  async enrich(unmarshalledRecord: UnmarshalledDynamoDBRecord) {
    const {createTargetModel, updateTargetModel, unmarshallSourceModel} =
      this.sdk;
    assert(
      unmarshalledRecord.dynamodb?.NewImage,
      'NewImage missing from DynamoDB Stream Event. This should never happen.'
    );
    const source = unmarshallSourceModel(unmarshalledRecord.dynamodb?.NewImage);
    try {
      const item = await this.load(source);

      const modelToUpdate = await this.update(source, item);
      if (modelToUpdate) {
        return await updateTargetModel(modelToUpdate);
      }
    } catch (err) {
      if (err instanceof NotFoundError) {
        const modelToCreate = await this.create(source);
        if (modelToCreate) {
          return await createTargetModel(modelToCreate);
        }
      }
      throw err;
    }
  }

  abstract load(record: SOURCE): Promise<TARGET>;
  abstract create(record: SOURCE): Promise<CREATE_TARGET_INPUT | undefined>;
  abstract update(
    record: SOURCE,
    target: TARGET
  ): Promise<UPDATE_TARGET_INPUT | undefined>;
}
