import assert from 'assert';

import type {
  ConstDirectiveNode,
  GraphQLField,
  GraphQLObjectType,
  GraphQLSchema,
  GraphQLType,
} from 'graphql';
import {isNonNullType, isScalarType} from 'graphql';
import {camelCase, snakeCase} from 'lodash';

import type {
  Field,
  GSI,
  Model,
  PrimaryKeyConfig,
  ProjectionType,
  SecondaryIndex,
  TTLConfig,
} from '@code-like-a-carpenter/foundation-intermediate-representation';

import type {Config} from './config';
import {extractChangeDataCaptureConfig} from './extractors/cdc';
import {
  getArgStringArrayValue,
  getArgStringValue,
  getDirective,
  getOptionalArg,
  getOptionalArgBooleanValue,
  getOptionalArgStringValue,
  getOptionalDirective,
  hasDirective,
  hasInterface,
  isType,
} from './helpers';
import {extractTableName} from './tables';

const models = new Map<GraphQLType, Model>();

export function getModel(type: GraphQLType): Readonly<Model> {
  const model = models.get(type);
  assert(model, `Model for type ${type} not found`);
  return model;
}

export function extractModel(
  config: Config,
  schema: GraphQLSchema,
  dependenciesModuleId: string,
  typeName: string,
  type: GraphQLObjectType
): Model {
  const cachedModel = models.get(type);
  if (cachedModel) {
    return cachedModel;
  }

  const fields = extractFields(type);
  const fieldMap: Record<string, Field> = Object.fromEntries(
    fields.map((field) => [field.fieldName, field] as const)
  );

  const model: Model = {
    changeDataCaptureConfig: extractChangeDataCaptureConfig(
      config,
      schema,
      type
    ),
    consistent: hasDirective('consistent', type),
    dependenciesModuleId,
    fields,
    isLedger: hasDirective('ledger', type),
    isPublicModel: hasInterface('PublicModel', type),
    libImportPath: '@code-like-a-carpenter/foundation-runtime',
    primaryKey: extractPrimaryKey(type, fieldMap),
    secondaryIndexes: extractSecondaryIndexes(type, fieldMap),
    tableName: extractTableName(type),
    ttlConfig: extractTTLConfig(type),
    typeName: type.name,
    ...extractTableInfo(type),
  };

  models.set(type, model);

  return model;
}

function getFieldFromFieldMap(
  fieldMap: Record<string, Field>,
  fieldName: string
): Field {
  const field = fieldMap[fieldName];
  assert(field, `Expected field ${fieldName} to exist`);
  return field;
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

function extractPrimaryKey(
  type: GraphQLObjectType<unknown, unknown>,
  fieldMap: Record<string, Field>
): PrimaryKeyConfig {
  if (hasDirective('compositeKey', type)) {
    const directive = getDirective('compositeKey', type);

    return {
      isComposite: true,
      partitionKeyFields: getArgStringArrayValue('pkFields', directive).map(
        (fieldName) => getFieldFromFieldMap(fieldMap, fieldName)
      ),
      partitionKeyPrefix: getOptionalArgStringValue('pkPrefix', directive),
      sortKeyFields: getArgStringArrayValue('skFields', directive).map(
        (fieldName) => getFieldFromFieldMap(fieldMap, fieldName)
      ),
      sortKeyPrefix: getOptionalArgStringValue('skPrefix', directive),
      type: 'primary',
    };
  }

  if (hasDirective('partitionKey', type)) {
    const directive = getDirective('partitionKey', type);

    return {
      isComposite: false,
      isSingleField: false,
      partitionKeyFields: getArgStringArrayValue('pkFields', directive).map(
        (fieldName) => getFieldFromFieldMap(fieldMap, fieldName)
      ),
      partitionKeyPrefix: getOptionalArgStringValue('pkPrefix', directive),
      type: 'primary',
    };
  }

  assert.fail(
    `Expected type ${type.name} to have a @partitionKey or @compositeKey directive`
  );
}

function extractSecondaryIndexes(
  type: GraphQLObjectType<unknown, unknown>,
  fieldMap: Record<string, Field>
): SecondaryIndex[] {
  const indexes: SecondaryIndex[] =
    type.astNode?.directives
      ?.filter(
        (directive) =>
          directive.name.value === 'compositeIndex' ||
          directive.name.value === 'secondaryIndex' ||
          directive.name.value === 'simpleIndex'
      )
      .map((directive) => {
        if (directive.name.value === 'compositeIndex') {
          return {
            isComposite: true,
            isSingleField: false,
            name: getArgStringValue('name', directive),
            partitionKeyFields: getArgStringArrayValue(
              'pkFields',
              directive
            ).map((fieldName) => getFieldFromFieldMap(fieldMap, fieldName)),
            partitionKeyPrefix: getOptionalArgStringValue(
              'pkPrefix',
              directive
            ),
            projectionType: getProjectionType(directive),
            sortKeyFields: getArgStringArrayValue('skFields', directive).map(
              (fieldName) => getFieldFromFieldMap(fieldMap, fieldName)
            ),
            sortKeyPrefix: getOptionalArgStringValue('skPrefix', directive),
            type: 'gsi',
          };
        }

        if (directive.name.value === 'simpleIndex') {
          const name = getArgStringValue('field', directive);
          return {
            isComposite: false,
            isSingleField: true,
            name,
            partitionKeyFields: [getFieldFromFieldMap(fieldMap, name)],
            projectionType: getProjectionType(directive),
            type: 'gsi',
          };
        }

        assert.equal(directive.name.value, 'secondaryIndex', ``);

        return {
          isComposite: true,
          isSingleField: false,
          name: getArgStringValue('name', directive),
          projectionType: getProjectionType(directive),
          sortKeyFields: getArgStringArrayValue('fields', directive).map(
            (fieldName) => getFieldFromFieldMap(fieldMap, fieldName)
          ),
          sortKeyPrefix: getOptionalArgStringValue('prefix', directive),
          type: 'lsi',
        };
      }) ?? [];

  if (hasInterface('PublicModel', type)) {
    const publicIdIndex: GSI = {
      isComposite: false,
      isSingleField: true,
      name: 'publicId',
      partitionKeyFields: [getFieldFromFieldMap(fieldMap, 'publicId')],
      projectionType: hasDirective('public', type)
        ? getProjectionType(getDirective('public', type))
        : 'all',
      type: 'gsi',
    };

    indexes.push(publicIdIndex);
  }
  return indexes;
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
    enableStreaming:
      hasDirective('enriches', type) ||
      hasDirective('triggers', type) ||
      (!!tableDirective &&
        (getOptionalArgBooleanValue('enableStreaming', tableDirective) ??
          false)),
  };
}

/**
 * Determines TTL configuration for a particular Model.
 */
function extractTTLConfig(
  type: GraphQLObjectType<unknown, unknown>
): TTLConfig | undefined {
  const fields =
    type.astNode?.fields?.filter((field) =>
      field.directives?.map(({name}) => name.value).includes('ttl')
    ) ?? [];
  if (fields.length === 0) {
    return undefined;
  }
  assert(fields.length === 1, 'Only one field can be marked with @ttl');
  const [field] = fields;
  const fieldName = field.name.value;
  const directive = getDirective('ttl', field);
  const duration = getOptionalArgStringValue('duration', directive);

  if (!duration) {
    assert(
      !isNonNullType(field),
      'TTL field must be nullable if duration is not specified'
    );

    return {fieldName};
  }

  const durationUnit = duration?.slice(-1);
  const durationValue = duration?.slice(0, -1);

  switch (durationUnit) {
    case 's':
      return {duration: Number(durationValue) * 1000, fieldName};
    case 'm':
      return {duration: Number(durationValue) * 1000 * 60, fieldName};
    case 'h':
      return {duration: Number(durationValue) * 1000 * 60 * 60, fieldName};
    case 'd':
      return {
        duration: Number(durationValue) * 1000 * 60 * 60 * 24,
        fieldName,
      };
    default:
      throw new Error(
        `Invalid ttl duration: ${duration}. Unit must be one of s, m, h, d`
      );
  }
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

function getProjectionType(directive: ConstDirectiveNode): ProjectionType {
  const arg = getOptionalArg('projection', directive);
  if (!arg) {
    return 'all';
  }

  assert(
    arg.value.kind === 'EnumValue',
    `Expected projection to be an enum value`
  );
  const type = arg.value.value.toLowerCase();

  assert(
    type === 'all' || type === 'keys_only',
    `Invalid projection type ${type}`
  );
  return type;
}
