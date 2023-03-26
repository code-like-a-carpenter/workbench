import type {
  GraphQLInterfaceType,
  GraphQLObjectType,
  GraphQLSchema,
} from 'graphql';
import type {GraphQLType} from 'graphql/type/definition';

import {assert} from '@code-like-a-carpenter/assert';
import type {
  Field,
  Model,
} from '@code-like-a-carpenter/foundation-intermediate-representation';

import type {Config} from './config';
import {
  extractPrimaryKey,
  extractSecondaryIndexes,
  extractTTLConfig,
} from './extractors';
import {extractChangeDataCaptureConfig} from './extractors/cdc';
import {extractFields} from './fields';
import {hasDirective, hasInterface} from './helpers';
import {extractTable} from './tables';

const models = new Map<GraphQLType, Model>();

export function getModel(type: GraphQLType): Readonly<Model> {
  const model = models.get(type);
  assert(model, `Model for type ${type} not found`);
  return model;
}

export function extractModel(
  config: Config,
  schema: GraphQLSchema,
  type: GraphQLInterfaceType | GraphQLObjectType,
  outputPath: string
): Model {
  const cachedModel = models.get(type);
  if (cachedModel) {
    return cachedModel;
  }
  const fields = extractFields(type);
  const fieldMap: Record<string, Field> = Object.fromEntries(
    fields.map((field) => [field.fieldName, field] as const)
  );

  // we can't attach the table until after the model is in the cache because
  // extractTable needs to read the model from the cache.
  const model: Omit<Model, 'table'> = {
    changeDataCaptureConfig: extractChangeDataCaptureConfig(
      config,
      schema,
      type
    ),
    consistent: hasDirective('consistent', type),
    fields,
    isLedger: hasDirective('ledger', type),
    isPublic: hasInterface('PublicModel', type),
    primaryKey: extractPrimaryKey(type, fieldMap),
    secondaryIndexes: extractSecondaryIndexes(type, fieldMap),
    ttlConfig: extractTTLConfig(type),
    typeName: type.name,
  };

  // @ts-expect-error - we know that the table is not undefined, it gets fixed
  // shortly.
  models.set(type, model);

  // @ts-expect-error - we know that the table is not undefined, it gets fixed
  // on the next line.
  const wholeModel: Model = model;
  // extraction and assignment are on two different lines so the scope of the
  // ts-expect-error is as small as possible.
  const table = extractTable(config, schema, type, outputPath);

  // @ts-expect-error - it's ok that we're assigning to a readonly property
  wholeModel.table = table;

  return model as Model;
}
