import type {GraphQLObjectType} from 'graphql';
import {isNonNullType} from 'graphql';

import {assert, fail} from '@code-like-a-carpenter/assert';
import type {TTLConfig} from '@code-like-a-carpenter/foundation-intermediate-representation';

import {
  getDirective,
  getOptionalArgBooleanValue,
  getOptionalArgStringValue,
} from '../helpers';

/**
 * Accepts a duration string and returns a number representing the duration in
 * milliseconds.
 */
export function convertDuration(duration: string): number {
  const durationUnit = duration.slice(-1);
  const durationValue = duration.slice(0, -1);

  assert(
    !Number.isNaN(durationValue),
    `Invalid ttl duration value: ${durationValue}`
  );

  switch (durationUnit) {
    case 's':
      return Number(durationValue) * 1000;
    case 'm':
      return Number(durationValue) * 1000 * 60;
    case 'h':
      return Number(durationValue) * 1000 * 60 * 60;
    case 'd':
      return Number(durationValue) * 1000 * 60 * 60 * 24;
    default:
      fail(`Invalid ttl duration: ${duration}. Unit must be one of s, m, h, d`);
  }
}

/**
 * Determines TTL configuration for a particular Model.
 */
export function extractTTLConfig(
  type: GraphQLObjectType
): TTLConfig | undefined {
  const fields =
    type.astNode?.fields?.filter((field) =>
      field.directives?.map(({name}) => name.value).includes('ttl')
    ) ?? [];
  if (fields.length === 0) {
    return undefined;
  }
  assert(fields.length === 1, 'Only one field can be marked with @ttl');
  const [astField] = fields;
  const fieldName = astField.name.value;

  const directive = getDirective('ttl', astField);

  const duration = getOptionalArgStringValue('duration', directive);

  if (!duration) {
    const field = type.getFields()[fieldName];

    return {
      argumentAllowed: true,
      argumentRequired: isNonNullType(field.type),
      fieldName,
    };
  }

  const seconds = convertDuration(duration);

  return {
    argumentAllowed: !!getOptionalArgBooleanValue('overridable', directive),
    argumentRequired: false,
    duration: seconds,
    fieldName,
  };
}
