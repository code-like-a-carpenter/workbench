import type {ConstDirectiveNode} from 'graphql';

import {assert} from '@code-like-a-carpenter/assert';

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
