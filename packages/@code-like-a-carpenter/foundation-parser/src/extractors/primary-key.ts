import assert from 'assert';

import type {GraphQLObjectType} from 'graphql';

import type {
  Field,
  PrimaryKeyConfig,
} from '@code-like-a-carpenter/foundation-intermediate-representation';

import {
  getArgStringArrayValue,
  getDirective,
  getOptionalArgStringValue,
  hasDirective,
} from '../helpers.ts';

export function getFieldFromFieldMap(
  fieldMap: Record<string, Field>,
  fieldName: string
): Field {
  const field = fieldMap[fieldName];
  assert(field, `Expected field ${fieldName} to exist`);
  return field;
}

export function extractPrimaryKey(
  type: GraphQLObjectType<unknown, unknown>,
  fieldMap: Record<string, Field>
): PrimaryKeyConfig {
  if (hasDirective('compositeKey', type)) {
    const directive = getDirective('compositeKey', type);
    const partitionKeyFields = getArgStringArrayValue(
      'pkFields',
      directive
    ).map((fieldName) => getFieldFromFieldMap(fieldMap, fieldName));
    const sortKeyFields = getArgStringArrayValue('skFields', directive).map(
      (fieldName) => getFieldFromFieldMap(fieldMap, fieldName)
    );
    return {
      isComposite: true,
      partitionKeyFields,
      partitionKeyIsSingleField: partitionKeyFields.length === 1,
      partitionKeyName: 'pk',
      partitionKeyPrefix: getOptionalArgStringValue('pkPrefix', directive),
      sortKeyFields,
      sortKeyIsSingleField: sortKeyFields.length === 1,
      sortKeyName: 'sk',
      sortKeyPrefix: getOptionalArgStringValue('skPrefix', directive),
      type: 'primary',
    };
  }

  if (hasDirective('partitionKey', type)) {
    const directive = getDirective('partitionKey', type);
    const partitionKeyFields = getArgStringArrayValue(
      'pkFields',
      directive
    ).map((fieldName) => getFieldFromFieldMap(fieldMap, fieldName));

    return {
      isComposite: false,
      isSingleField: partitionKeyFields.length === 1,
      partitionKeyFields,
      partitionKeyName: 'pk',
      partitionKeyPrefix: getOptionalArgStringValue('pkPrefix', directive),
      type: 'primary',
    };
  }

  assert.fail(
    `Expected type ${type.name} to have a @partitionKey or @compositeKey directive`
  );
}
