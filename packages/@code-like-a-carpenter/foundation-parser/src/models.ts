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

import {extractPrimaryKey, extractSecondaryIndexes} from './extractors';
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
  schema: GraphQLSchema,
  type: GraphQLInterfaceType | GraphQLObjectType
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
    consistent: hasDirective('consistent', type),
    fields,
    isLedger: hasDirective('ledger', type),
    isPublic: hasInterface('PublicModel', type),
    primaryKey: extractPrimaryKey(type, fieldMap),
    secondaryIndexes: extractSecondaryIndexes(type, fieldMap),
    typeName: type.name,
  };

  // @ts-expect-error - we know that the table is not undefined, it gets fixed
  // shortly.
  models.set(type, model);

  // @ts-expect-error - we know that the table is not undefined, it gets fixed
  // on the next line.
  const wholeModel: Model = model;
  // @ts-expect-error - it's ok that we're assigning to a readonly property
  wholeModel.table = extractTable(schema, type);

  return model as Model;
}
