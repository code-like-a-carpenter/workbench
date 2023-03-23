import type {ConstDirectiveNode, GraphQLObjectType} from 'graphql';
import type {GraphQLInterfaceType} from 'graphql/index';

import {assert} from '@code-like-a-carpenter/assert';
import type {
  Field,
  GSI,
  LSI,
  SecondaryIndex,
} from '@code-like-a-carpenter/foundation-intermediate-representation';

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

import {extractPrimaryKey} from './primary-key';

function extractLSIs(
  type: GraphQLInterfaceType | GraphQLObjectType,
  fieldMap: Record<string, Field>
): LSI[] {
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

      return {
        isComposite: true,
        name: getArgStringValue('name', directive),
        partitionKeyFields: primaryKey.partitionKeyFields,
        partitionKeyIsSingleField: primaryKey.isComposite
          ? primaryKey.partitionKeyIsSingleField
          : primaryKey.isSingleField,
        partitionKeyPrefix: primaryKey.partitionKeyPrefix,
        projectionType: getProjectionType(directive),
        sortKeyFields,
        sortKeyIsSingleField: sortKeyFields.length === 1,
        sortKeyPrefix: getOptionalArgStringValue('prefix', directive),
        type: 'lsi',
      };
    });
}

function extractGSIs(
  type: GraphQLInterfaceType | GraphQLObjectType,
  fieldMap: Record<string, Field>
): GSI[] {
  if (!type.astNode?.directives) {
    return [];
  }
  return type.astNode.directives
    .filter((directive) => directive.name.value === 'gsi')
    .map((directive): GSI => {
      const partitionKeyFields = getArgStringArrayValue(
        'pkFields',
        directive
      ).map((fieldName) => getFieldFromFieldMap(fieldMap, fieldName));
      assert(
        partitionKeyFields.length > 0,
        'GSI must have at least one partition key field'
      );
      const sortKeyFields =
        getOptionalArgStringArrayValue('skFields', directive)?.map(
          (fieldName) => getFieldFromFieldMap(fieldMap, fieldName)
        ) ?? [];

      return {
        isComposite: true,
        name: getArgStringValue('name', directive),
        partitionKeyFields,
        partitionKeyIsSingleField: partitionKeyFields.length === 1,
        partitionKeyPrefix: getOptionalArgStringValue('pkPrefix', directive),
        projectionType: getProjectionType(directive),
        sortKeyFields,
        sortKeyIsSingleField: sortKeyFields.length === 1,
        sortKeyPrefix: getOptionalArgStringValue('skPrefix', directive),
        type: 'gsi',
      };
    });
}

function extractSimpleIndexes(
  type: GraphQLInterfaceType | GraphQLObjectType,
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
        projectionType: getProjectionType(directive),
        type: 'gsi',
      };
    });
}

export function extractSecondaryIndexes(
  type: GraphQLInterfaceType | GraphQLObjectType,
  fieldMap: Record<string, Field>
): readonly SecondaryIndex[] {
  const gsis = extractGSIs(type, fieldMap);
  const lsis = extractLSIs(type, fieldMap);
  const simpleIndexes = extractSimpleIndexes(type, fieldMap);

  const indexes = [...gsis, ...lsis, ...simpleIndexes];

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

function getFieldFromFieldMap(
  fieldMap: Record<string, Field>,
  fieldName: string
): Field {
  const field = fieldMap[fieldName];
  assert(field, `Expected field ${fieldName} to exist`);
  return field;
}

function getProjectionType(directive: ConstDirectiveNode): 'all' | 'keys_only' {
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
