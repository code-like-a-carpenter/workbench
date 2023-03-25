import {snakeCase} from 'lodash';

import {fail} from '@code-like-a-carpenter/assert';
import type {Field} from '@code-like-a-carpenter/foundation-intermediate-representation';

/**
 * Generates the code for checking that the environment variables for this
 * table's name has been set.
 */
export function ensureTableTemplate(objType: string): string {
  return `  const tableName = process.env.${snakeCase(objType).toUpperCase()};
  assert(tableName, '${snakeCase(objType).toUpperCase()} is not set');`;
}

/** Typesafe function for .filter to remove undefined or null values */
export function filterNull<T>(x: T | undefined | null): x is T {
  return Boolean(x);
}

function getTransformString(field: Field): string {
  if (field.columnName === 'ttl') {
    return '(v) => new Date(v * 1000)';
  }

  if (field.isDateType) {
    return '(v) => new Date(v)';
  }

  return '';
}

/** Gets the TypeScript type for that corresponds to the field. */
export function getTypeScriptTypeForField({
  fieldName,
  isRequired,
  isScalarType: isScalar,
  typeName,
}: Field): [string, string] {
  if (isRequired) {
    if (isScalar) {
      return [fieldName, `Scalars["${typeName}"]`];
    }
    return [fieldName, typeName];
  }

  if (isScalar) {
    return [`${fieldName}?`, `Maybe<Scalars["${typeName}"]>`];
  }

  return [`${fieldName}?`, `Maybe<${typeName}>`];
}

/** Generates the template for producing the desired primary key or index column */
export function makeKeyTemplate(
  prefix: string | undefined,
  fields: readonly Field[],
  mode: 'blind' | 'create' | 'read'
): string {
  const accessors = [
    ...(prefix ? [`'${prefix}'`] : []),
    ...fields.map((field) => {
      const {fieldName} = field;
      if (fieldName === 'createdAt') {
        if (mode === 'blind') {
          return "'createdAt' in input && typeof input.createdAt !== 'undefined' ? input.createdAt.getTime() : now.getTime()";
        }
        if (mode === 'create') {
          return 'now.getTime()';
        }
        if (mode === 'read') {
          return 'input.createdAt.getTime()';
        }
        fail('Invalid mode');
      }
      if (fieldName === 'updatedAt') {
        // this template gets passed through so it's available in the output.
        // eslint-disable-next-line no-template-curly-in-string
        return 'now.getTime()';
      }
      // The "create" template sets a local variable "publicId" so we only
      // generate it once for both the Key and ExpressionAttributeValues.
      if (fieldName === 'publicId') {
        if (mode === 'create') {
          // this template gets passed through so it's available in the output.
          // eslint-disable-next-line no-template-curly-in-string
          return 'publicId';
        }
      }
      return marshallField(field);
    }),
  ].filter(filterNull);

  return `[${accessors.join(', ')}].join('#')`;
}

/**
 * Marshalls the specified field value for use with ddb.
 */
export function marshallField({
  columnName,
  fieldName,
  isDateType,
}: Field): string {
  if (columnName === 'ttl') {
    return `Math.floor(input.${fieldName}.getTime()/1000)`;
  }

  if (isDateType) {
    // Reminder: we don't care if it's required or not because we never want to
    // pass undefined. Explicit nulls can be passed as-is.
    return `input.${fieldName} === null ? null : input.${fieldName}.toISOString()`;
  }
  return `input.${fieldName}`;
}

/** Converts a compile-time object to a runtime object */
export function objectToString(obj: object): string {
  return `{${Object.entries(obj).map(([k, value]) => `${k}: ${value}`)}}`;
}

/**
 * Helper function for building a field unmarshaller
 */
export function unmarshallFieldValue(field: Field): string {
  const transformString = getTransformString(field);

  const func = field.isRequired
    ? 'unmarshallRequiredField'
    : 'unmarshallOptionalField';

  const args = [
    'item',
    `'${field.fieldName}'`,
    `[${field.columnNamesForRead.map((c) => `'${c}'`).join(',')}]`,
    transformString,
  ];

  return `${func}(${args.join(', ')})`;
}

/**
 * Helper function for building a field unmarshaller
 */
export function unmarshallField(field: Field) {
  const out = unmarshallFieldValue(field);

  return `${field.fieldName}: ${out}`;
}
