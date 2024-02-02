import assert from 'assert';

import type {
  GraphQLField,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLType,
} from 'graphql';
import {isNonNullType, isScalarType} from 'graphql';
import camelCase from 'lodash/camelCase.js';
import snakeCase from 'lodash/snakeCase.js';

import type {
  Field,
  Model,
} from '@code-like-a-carpenter/foundation-intermediate-representation';

import type {Config} from './config';
import {extractChangeDataCaptureConfig} from './extractors/cdc';
import {extractSecondaryIndexes} from './extractors/indexes';
import {extractPrimaryKey} from './extractors/primary-key';
import {extractTTLConfig} from './extractors/ttl';
import {
  getArgStringValue,
  getDirective,
  getOptionalArg,
  getOptionalArgBooleanValue,
  getOptionalDirective,
  hasDirective,
  hasInterface,
  isType,
} from './helpers';
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
  type: GraphQLObjectType,
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
      type,
      outputPath
    ),
    consistent: hasDirective('consistent', type),
    fields,
    isLedger: hasDirective('ledger', type),
    isPublic: hasInterface('PublicModel', type),
    primaryKey: extractPrimaryKey(type, fieldMap),
    secondaryIndexes: extractSecondaryIndexes(config, type, fieldMap),
    ttlConfig: extractTTLConfig(type),
    typeName: type.name,
    ...extractTableInfo(type),
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

  return wholeModel;
}

function extractFields(
  type: GraphQLObjectType<unknown, unknown>
): readonly Field[] {
  const fields = type.getFields();
  return Object.keys(fields).map((fieldName) => {
    const field = fields[fieldName];
    const computed = getOptionalDirective('computed', field);
    const importDetails = computed
      ? {
          importName: getArgStringValue('importName', computed),
          importPath: getArgStringValue('importPath', computed),
          isVirtual: !!getOptionalArgBooleanValue('virtual', computed),
        }
      : undefined;
    return {
      columnName: getAliasForField(field, type, fieldName),
      columnNamesForRead: getReadAliasesForField(field, type, fieldName),
      computeFunction: importDetails,
      ean: `:${fieldName}`,
      eav: `#${fieldName}`,
      fieldName,
      isDateType: isType('Date', field),
      isRequired: isNonNullType(field.type),
      isScalarType: isNonNullType(field.type)
        ? isScalarType(field.type.ofType)
        : isScalarType(field.type),
      typeName: isNonNullType(field.type)
        ? String(field.type.ofType)
        : field.type.name,
    };
  });
}

function extractTableInfo(type: GraphQLObjectType<unknown, unknown>) {
  const tableDirective = getOptionalDirective('table', type);

  return {
    enablePointInTimeRecovery: tableDirective
      ? getOptionalArgBooleanValue(
          'enablePointInTimeRecovery',
          tableDirective
        ) !== false
      : true,
  };
}

function getAliasForField(
  field: GraphQLField<unknown, unknown>,
  type: GraphQLObjectType<unknown, unknown>,
  fieldName: string
) {
  if (hasDirective('ttl', field)) {
    return 'ttl';
  }

  if (hasDirective('alias', field)) {
    const {astNode} = field;
    assert(astNode);
    return getArgStringValue('name', getDirective('alias', astNode));
  }

  switch (field.name) {
    case 'version':
      return '_v';
    case 'createdAt':
      return '_ct';
    case 'updatedAt':
      return '_md';
    // do not snakeCase publicId (to support a legacy project). At some future
    // point, this and the general index column issue of camel-not-snake needs
    //
    case 'publicId':
      return 'publicId';
    default:
      return getCaseType(type) === 'CAMEL_CASE'
        ? camelCase(fieldName)
        : snakeCase(fieldName);
  }
}

function getReadAliasesForField(
  field: GraphQLField<unknown, unknown>,
  type: GraphQLObjectType<unknown, unknown>,
  fieldName: string
): readonly string[] {
  if (hasDirective('ttl', field)) {
    return ['ttl'];
  }

  if (hasDirective('alias', field)) {
    const {astNode} = field;
    assert(astNode);
    return [getArgStringValue('name', getDirective('alias', astNode))];
  }

  switch (field.name) {
    case 'version':
      return ['_v'];
    case 'createdAt':
      return ['_ct'];
    case 'updatedAt':
      return ['_md'];
    // do not snakeCase publicId (to support a legacy project). At some future
    // point, this and the general index column issue of camel-not-snake needs
    //
    case 'publicId':
      return ['publicId'];
    default:
      return getCaseType(type) === 'CAMEL_CASE'
        ? [camelCase(fieldName), snakeCase(fieldName)]
        : [snakeCase(fieldName), camelCase(fieldName)];
  }
}

function getCaseType(
  type: GraphQLObjectType<unknown, unknown>
): 'CAMEL_CASE' | 'SNAKE_CASE' {
  const tableDirective = getOptionalDirective('table', type);
  if (tableDirective) {
    const arg = getOptionalArg('columnCase', tableDirective);
    if (arg) {
      assert(arg.value.kind === 'EnumValue');
      if (arg.value.value === 'CAMEL_CASE') {
        return 'CAMEL_CASE';
      }
      assert(arg.value.value === 'SNAKE_CASE');
    }
  }
  return 'SNAKE_CASE';
}
