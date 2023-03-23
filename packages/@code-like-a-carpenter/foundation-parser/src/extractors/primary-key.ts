import type {GraphQLObjectType} from 'graphql';
import type {GraphQLInterfaceType} from 'graphql/index';

import {assert} from '@code-like-a-carpenter/assert';
import type {
  Field,
  PrimaryKey,
} from '@code-like-a-carpenter/foundation-intermediate-representation';

import {
  getArgStringArrayValue,
  getDirective,
  getOptionalArgStringArrayValue,
  getOptionalArgStringValue,
} from '../helpers';

export function extractPrimaryKey(
  type: GraphQLInterfaceType | GraphQLObjectType,
  fieldMap: Record<string, Field>
): PrimaryKey {
  const directive = getDirective('primaryKey', type);
  const pkPrefix = getOptionalArgStringValue('pkPrefix', directive);
  const pkFieldNames = getArgStringArrayValue('pkFields', directive);
  const skPrefix = getOptionalArgStringValue('skPrefix', directive);
  const skFieldNames = getOptionalArgStringArrayValue('skFields', directive);

  const pkFields = pkFieldNames.map((fieldName) =>
    getFieldFromFieldMap(fieldMap, fieldName)
  );
  const skFields = skFieldNames?.map((fieldName) =>
    getFieldFromFieldMap(fieldMap, fieldName)
  );

  if (skFields) {
    return {
      isComposite: true,
      partitionKeyFields: pkFields,
      partitionKeyIsSingleField: pkFields.length === 1,
      partitionKeyPrefix: pkPrefix,
      sortKeyFields: skFields,
      sortKeyIsSingleField: skFields.length === 1,
      sortKeyPrefix: skPrefix,
      type: 'primary',
    };
  }

  return {
    isComposite: false,
    isSingleField: pkFields.length === 1,
    partitionKeyFields: pkFields,
    partitionKeyPrefix: pkPrefix,
    type: 'primary',
  };
}

function getFieldFromFieldMap(
  fieldMap: Record<string, Field>,
  fieldName: string
): Field {
  const field = fieldMap[fieldName];
  assert(field, `Expected field ${fieldName} to exist`);
  return field;
}
