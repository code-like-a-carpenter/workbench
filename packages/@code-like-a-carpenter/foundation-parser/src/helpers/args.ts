import type {ConstDirectiveNode, ConstValueNode} from 'graphql';

import {assert, fail} from '@code-like-a-carpenter/assert';
import type {Condition} from '@code-like-a-carpenter/foundation-intermediate-representation';

/** Gets the specified argument from the given directive. */
export function getArg(name: string, directive: ConstDirectiveNode) {
  assert(
    directive.arguments,
    `Expected @${directive} directive to have arguments`
  );
  const arg = directive.arguments?.find((a) => a.name.value === name);
  assert(arg, `${name} argument is required`);
  return arg;
}

/** Gets the specified argument from the given directive. */
export function getOptionalArg(name: string, directive: ConstDirectiveNode) {
  return directive.arguments?.find((arg) => arg.name.value === name);
}

/**
 * Gets the boolean value of the specified argument from the given directive.
 * Returns undefined
 */
export function getOptionalArgBooleanValue(
  fieldName: string,
  directive: ConstDirectiveNode
): boolean | undefined {
  const arg = getOptionalArg(fieldName, directive);
  if (!arg) {
    return undefined;
  }
  assert(
    arg.value.kind === 'BooleanValue',
    `Expected @${directive.name.value} directive argument "${fieldName}" to be a boolean, but got ${arg.value.kind}`
  );

  return Boolean(arg.value.value);
}

/**
 * Given a field name that identifies a list argument, returns the typescript
 * types identified by those strings.
 */
export function getArgStringArrayValue(
  fieldName: string,
  directive: ConstDirectiveNode
): string[] {
  const arg = getArg(fieldName, directive);
  assert(arg.value.kind === 'ListValue', `Expected ${fieldName} to be a list`);
  return arg.value.values.map((v) => {
    assert(
      v.kind === 'StringValue',
      `Expected @${directive.name.value} directive argument "${fieldName}" to be a list of strings`
    );

    return v.value;
  });
}

/**
 * Given a field name that identifies a list argument, returns the typescript
 * types identified by those strings.
 */
export function getOptionalArgStringArrayValue(
  fieldName: string,
  directive: ConstDirectiveNode
): string[] | undefined {
  const arg = getOptionalArg(fieldName, directive);
  if (!arg) {
    return undefined;
  }
  assert(arg.value.kind === 'ListValue', `Expected ${fieldName} to be a list`);
  return arg.value.values.map((v) => {
    assert(
      v.kind === 'StringValue',
      `Expected @${directive.name.value} directive argument "${fieldName}" to be a list of strings`
    );

    return v.value;
  });
}

/**
 * Gets the string value of the specified argument from the given directive.
 */
export function getArgStringValue(
  fieldName: string,
  directive: ConstDirectiveNode
): string {
  const arg = getArg(fieldName, directive);

  assert(
    arg.value.kind === 'StringValue',
    `Expected @${directive.name.value} directive argument "${fieldName}" to be a string, but got ${arg.value.kind}`
  );

  return arg.value.value;
}

/**
 * Gets the enum value of the specified argument from the given directive.
 */
export function getArgEnumValue(
  fieldName: string,
  directive: ConstDirectiveNode
): string {
  const arg = getArg(fieldName, directive);

  assert(
    arg.value.kind === 'EnumValue',
    `Expected @${directive.name.value} directive argument "${fieldName}" to be an Enum, but got ${arg.value.kind}`
  );

  return arg.value.value;
}

/**
 * Gets the string value of the specified argument from the given directive.
 * Returns an empty string if the argument is not present.
 */
export function getOptionalArgStringValue(
  fieldName: string,
  directive: ConstDirectiveNode
): string | undefined {
  const arg = getOptionalArg(fieldName, directive);
  if (!arg) {
    return undefined;
  }
  assert(
    arg.value.kind === 'StringValue',
    `Expected @${directive.name.value} directive argument "${fieldName}" to be a string, but got ${arg.value.kind}`
  );

  return arg.value.value;
}

/**
 * Returns all the scalar arguments nested on the given directive's field.
 */
export function getOptionalArgObjectValue(
  fieldName: string,
  directive: ConstDirectiveNode
) {
  const arg = getOptionalArg(fieldName, directive);
  if (!arg) {
    return undefined;
  }
  assert(
    arg.value.kind === 'ObjectValue',
    `Expected @${directive.name.value} directive argument "${fieldName}" to be an object, but got ${arg.value.kind}`
  );

  return coerceObject(arg.value);
}

function coerceObject(value: ConstValueNode): Record<string, unknown> {
  assert(value.kind === 'ObjectValue', 'Expected an ObjectValue');

  return Object.fromEntries(
    value.fields.map(({name: {value: name}, value: v}) => [
      name,
      coerceValue(v),
    ])
  );
}

function coerceValue(value: ConstValueNode): unknown {
  switch (value.kind) {
    case 'StringValue':
      return value.value;
    case 'BooleanValue':
      return value.value;
    case 'IntValue':
      return parseInt(value.value, 10);
    case 'FloatValue':
      return parseFloat(value.value);
    case 'EnumValue':
      return value.value;
    case 'ListValue':
      return value.values.map(coerceValue);
    case 'ObjectValue':
      break;
    case 'NullValue':
      break;
  }
}

export function getCondition(
  directive: ConstDirectiveNode,
  name: string,
  defaultValue = false
): Condition {
  const arg = getOptionalArg(name, directive);
  if (!arg) {
    return defaultValue;
  }

  assert(arg.value.kind === 'ObjectValue', 'Condition must be an object');

  const always = arg.value.fields.find(
    (field) => field.name.value === 'always'
  );
  const condition = arg.value.fields.find(
    (field) => field.name.value === 'condition'
  );

  if (condition && typeof always === 'boolean') {
    throw new Error(
      `The @${name} directive cannot have both an "always" argument and a "condition" argument.`
    );
  }

  if (always) {
    assert(always.value.kind === 'BooleanValue', 'always must be a boolean');
    return always.value.value;
  }

  if (condition) {
    assert(
      condition.value.kind === 'StringValue',
      'condition must be a string'
    );
    return condition.value.value;
  }

  fail(
    `Condition ${name} on ${directive.name.value} must supply one of "always" or "condition"`
  );
}
