import type {
  GraphQLField,
  GraphQLObjectType,
  GraphQLInterfaceType,
} from 'graphql';
import {isNonNullType, isScalarType} from 'graphql';
import {camelCase, snakeCase} from 'lodash';

import {assert} from '@code-like-a-carpenter/assert';
import type {Field} from '@code-like-a-carpenter/foundation-intermediate-representation';

import {
  getArgStringValue,
  getDirective,
  getOptionalArg,
  getOptionalArgBooleanValue,
  getOptionalDirective,
  hasDirective,
  isType,
} from './helpers';

export function extractFields(
  type: GraphQLInterfaceType | GraphQLObjectType
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

/** helper */
export function getAliasForField(
  field: GraphQLField<unknown, unknown>,
  type: GraphQLInterfaceType | GraphQLObjectType,
  fieldName: string
) {
  if (hasDirective('ttl', field)) {
    return 'ttl';
  }

  if (hasDirective('alias', field)) {
    const {astNode} = field;
    assert(astNode, 'Expected to find astNode on field');
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

function getCaseType(
  type: GraphQLInterfaceType | GraphQLObjectType
): 'CAMEL_CASE' | 'SNAKE_CASE' {
  const tableDirective = getOptionalDirective('table', type);
  if (tableDirective) {
    const arg = getOptionalArg('columnCase', tableDirective);
    if (arg) {
      assert(arg.value.kind === 'EnumValue', 'Expected EnumValue');
      if (arg.value.value === 'CAMEL_CASE') {
        return 'CAMEL_CASE';
      }
      assert(arg.value.value === 'SNAKE_CASE', 'Expected SNAKE_CASE');
    }
  }
  return 'SNAKE_CASE';
}

function getReadAliasesForField(
  field: GraphQLField<unknown, unknown>,
  type: GraphQLInterfaceType | GraphQLObjectType,
  fieldName: string
): readonly string[] {
  if (hasDirective('ttl', field)) {
    return ['ttl'];
  }

  if (hasDirective('alias', field)) {
    const {astNode} = field;
    assert(astNode, 'Expected to find astNode on field');
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
