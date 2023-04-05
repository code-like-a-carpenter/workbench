import assert from 'assert';

import type {ConstDirectiveNode, GraphQLObjectType} from 'graphql';

import type {
  Field,
  GSI,
  LSI,
  ProjectionType,
  SecondaryIndex,
} from '@code-like-a-carpenter/foundation-intermediate-representation';

import type {Config} from '../config';
import {
  getArgStringArrayValue,
  getArgStringValue,
  getDirective,
  getOptionalArg,
  getOptionalArgStringArrayValue,
  getOptionalArgStringValue,
  hasDirective,
  hasInterface,
} from '../helpers';

import {extractPrimaryKey, getFieldFromFieldMap} from './primary-key';

export function extractSecondaryIndexes(
  config: Config,
  type: GraphQLObjectType<unknown, unknown>,
  fieldMap: Record<string, Field>
): SecondaryIndex[] {
  const gsis = extractGSIs(config, type, fieldMap);
  const lsis = extractLSIs(config, type, fieldMap);
  const simpleIndexes = extractSimpleIndexes(type, fieldMap);

  const indexes = [...gsis, ...lsis, ...simpleIndexes];

  if (hasInterface('PublicModel', type)) {
    const publicIdIndex: GSI = {
      isComposite: false,
      isSingleField: true,
      name: 'publicId',
      partitionKeyFields: [getFieldFromFieldMap(fieldMap, 'publicId')],
      partitionKeyName: 'publicId',
      projectionType: hasDirective('public', type)
        ? getProjectionType(getDirective('public', type))
        : 'all',
      type: 'gsi',
    };

    indexes.push(publicIdIndex);
  }
  return indexes;
}

function extractGSIs(
  config: Config,
  type: GraphQLObjectType,
  fieldMap: Record<string, Field>
): readonly GSI[] {
  if (!type.astNode?.directives) {
    return [];
  }
  return type.astNode.directives
    .filter((directive) => directive.name.value === 'gsi')
    .map((directive): GSI => {
      const sortKeyFields = getOptionalArgStringArrayValue(
        'skFields',
        directive
      )?.map((fieldName) => getFieldFromFieldMap(fieldMap, fieldName));

      const sortKeyPrefix = getOptionalArgStringValue('skPrefix', directive);

      const name = getArgStringValue('name', directive);

      const pk = pkInfo(config, type, fieldMap, directive);

      if (sortKeyFields || sortKeyPrefix) {
        const sk = skInfo(config, type, fieldMap, directive);
        return {
          isComposite: true,
          name,
          partitionKeyFields: pk.fields,
          partitionKeyIsSingleField: pk.isSingleField,
          partitionKeyName: pk.name,
          partitionKeyPrefix: pk.prefix,
          projectionType: getProjectionType(directive),
          sortKeyFields: sk.fields,
          sortKeyIsSingleField: sk.isSingleField,
          sortKeyName: sk.name,
          sortKeyPrefix: sk.prefix,
          type: 'gsi',
        };
      }

      return {
        isComposite: false,
        isSingleField: pk.isSingleField,
        name,
        partitionKeyFields: pk.fields,
        partitionKeyName: pk.name,
        partitionKeyPrefix: pk.prefix,
        projectionType: getProjectionType(directive),
        type: 'gsi',
      };
    });
}

function extractLSIs(
  config: Config,
  type: GraphQLObjectType,
  fieldMap: Record<string, Field>
): readonly LSI[] {
  if (!type.astNode?.directives) {
    return [];
  }
  return type.astNode.directives
    .filter((directive) => directive.name.value === 'lsi')
    .map((directive): LSI => {
      const sortKeyFields = getArgStringArrayValue('skFields', directive).map(
        (fieldName) => getFieldFromFieldMap(fieldMap, fieldName)
      );
      assert(
        sortKeyFields.length > 0,
        'LSI must have at least one sort key field'
      );

      const primaryKey = extractPrimaryKey(type, fieldMap);
      const name = getArgStringValue('name', directive);

      const sk = skInfo(config, type, fieldMap, directive);

      return {
        isComposite: true,
        name,
        partitionKeyFields: primaryKey.partitionKeyFields,
        partitionKeyIsSingleField: primaryKey.isComposite
          ? primaryKey.partitionKeyIsSingleField
          : primaryKey.isSingleField,
        partitionKeyName: primaryKey.partitionKeyName,
        partitionKeyPrefix: primaryKey.partitionKeyPrefix,
        projectionType: getProjectionType(directive),
        sortKeyFields: sk.fields,
        sortKeyIsSingleField: sk.isSingleField,
        sortKeyName: sk.name,
        sortKeyPrefix: sk.prefix,
        type: 'lsi',
      };
    });
}

function extractSimpleIndexes(
  type: GraphQLObjectType,
  fieldMap: Record<string, Field>
): GSI[] {
  if (!type.astNode?.fields) {
    return [];
  }

  return type.astNode.fields
    .filter((field) =>
      field.directives?.map(({name}) => name.value).includes('simpleIndex')
    )
    .map((fieldNode): GSI => {
      const field = fieldMap[fieldNode.name.value];
      const directive = getDirective('simpleIndex', fieldNode);

      return {
        isComposite: false,
        isSingleField: true,
        name: field.fieldName,
        partitionKeyFields: [field],
        partitionKeyName: field.fieldName,
        projectionType: getProjectionType(directive),
        type: 'gsi',
      };
    });
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

function pkInfo(
  config: Config,
  type: GraphQLObjectType,
  fieldMap: Record<string, Field>,
  directive: ConstDirectiveNode
): {
  fields: Field[];
  isSingleField: boolean;
  name: string;
  prefix: string;
} {
  const indexName = getArgStringValue('name', directive);
  const prefix = getOptionalArgStringValue('pkPrefix', directive);

  const fields = getArgStringArrayValue('pkFields', directive).map(
    (fieldName) => getFieldFromFieldMap(fieldMap, fieldName)
  );
  assert(fields.length > 0, 'GSI must have at least one partition key field');

  const isSingleField = fields.length === 1;

  const canUseEfficientIndex =
    config.useEfficientIndexes && isSingleField && !prefix;
  const name = canUseEfficientIndex ? fields[0].fieldName : `${indexName}pk`;

  return {
    fields,
    isSingleField,
    name,
    prefix,
  };
}

function skInfo(
  config: Config,
  type: GraphQLObjectType,
  fieldMap: Record<string, Field>,
  directive: ConstDirectiveNode
): {
  fields: Field[];
  isSingleField: boolean;
  name: string;
  prefix: string;
} {
  const indexName = getArgStringValue('name', directive);
  const prefix = getOptionalArgStringValue('skPrefix', directive);

  const fields = getOptionalArgStringArrayValue('skFields', directive)?.map(
    (fieldName) => getFieldFromFieldMap(fieldMap, fieldName)
  );

  if (!fields?.length) {
    assert(
      prefix,
      'Composite GSI must have at least one sort key field or prefix'
    );
    return {
      fields: [],
      isSingleField: false,
      name: `${indexName}sk`,
      prefix,
    };
  }

  const isSingleField = fields.length === 1;

  const canUseEfficientIndex =
    config.useEfficientIndexes && isSingleField && !prefix;
  const name = canUseEfficientIndex ? fields[0].fieldName : `${indexName}sk`;

  return {
    fields,
    isSingleField,
    name,
    prefix,
  };
}
