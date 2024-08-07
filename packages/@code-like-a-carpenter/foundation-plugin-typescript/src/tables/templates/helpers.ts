import assert from 'assert';

import type {
  Field,
  PrimaryKeyConfig,
} from '@code-like-a-carpenter/foundation-intermediate-representation';

import type {Config} from '../../config.ts';
import {filterNull} from '../../helpers.ts';

/** Gets the TypeScript type for that corresponds to the field. */
export function getTypeScriptTypeForField({
  fieldName,
  isRequired,
  isScalarType: isScalar,
  typeName,
}: Field): [string, string] {
  if (isRequired) {
    if (isScalar) {
      return [fieldName, `Scalars["${typeName}"]['input']`];
    }
    return [fieldName, typeName];
  }

  if (isScalar) {
    return [`${fieldName}?`, `Maybe<Scalars["${typeName}"]['input']>`];
  }

  return [`${fieldName}?`, `Maybe<${typeName}>`];
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
        assert.fail('Invalid mode');
      }
      if (fieldName === 'updatedAt') {
        // this template gets passed through so it's available in the output.
        // eslint-disable-next-line no-template-curly-in-string
        return 'now.getTime()';
      }
      // The create template sets a local variable "publicId" so we only
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

/** Converts a compile time object to a runtime object */
export function objectToString(obj: Record<string, string>): string {
  return `{${Object.entries(obj).map(([k, value]) => `${k}: ${value}`)}}`;
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

export function handleCommonErrors(): string {
  return `
    if (err instanceof AssertionError || err instanceof BaseDataLibraryError) {
      throw err;
    }
    if (err instanceof ServiceException) {
      throw new UnexpectedAwsError(err);
    }
    throw new UnexpectedError(err);
  `;
}

export function makeKeyForRead(
  config: Config,
  key: PrimaryKeyConfig
): Record<string, string> {
  if (key.isComposite) {
    const doLegacy =
      config.legacyEmptySortFieldBehavior && key.sortKeyFields.length === 0;
    return {
      pk: makeKeyTemplate(
        key.partitionKeyPrefix,
        key.partitionKeyFields,
        'read'
      ),
      sk: doLegacy
        ? `'${key.sortKeyPrefix}#0'`
        : makeKeyTemplate(key.sortKeyPrefix, key.sortKeyFields, 'read'),
    };
  }

  return {
    pk: makeKeyTemplate(key.partitionKeyPrefix, key.partitionKeyFields, 'read'),
  };
}
