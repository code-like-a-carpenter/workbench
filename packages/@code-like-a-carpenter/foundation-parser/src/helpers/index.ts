import type {
  ConstDirectiveNode,
  FieldDefinitionNode,
  GraphQLField,
  GraphQLInterfaceType,
  GraphQLObjectType,
  InterfaceTypeDefinitionNode,
  ObjectTypeDefinitionNode,
} from 'graphql';
import {
  isInterfaceType,
  isNonNullType,
  isObjectType,
  isScalarType,
} from 'graphql';
import type {GraphQLType} from 'graphql/type/definition';

import {assert} from '@code-like-a-carpenter/assert';

export * from './args';

/** Gets the specified directive from the given field. */
export function getDirective(
  name: string,
  nodeOrType:
    | FieldDefinitionNode
    | InterfaceTypeDefinitionNode
    | ObjectTypeDefinitionNode
    | GraphQLInterfaceType
    | GraphQLObjectType
): ConstDirectiveNode {
  if ('getFields' in nodeOrType) {
    assert(nodeOrType.astNode, 'Expected type to have an AST node');
    nodeOrType = nodeOrType.astNode;
  }
  const directive = nodeOrType.directives?.find((d) => d.name.value === name);
  assert(
    directive,
    `Expected ${nodeOrType.kind} ${nodeOrType.name.value} to have an @${name} directive`
  );
  return directive;
}

/** Gets the specified directive from the given field. */
export function getOptionalDirective(
  name: string,
  nodeOrType:
    | FieldDefinitionNode
    | GraphQLField<unknown, unknown>
    | GraphQLInterfaceType
    | GraphQLObjectType
    | InterfaceTypeDefinitionNode
    | ObjectTypeDefinitionNode
): ConstDirectiveNode | undefined {
  if ('getFields' in nodeOrType) {
    assert(nodeOrType.astNode, 'Expected type to have an AST node');
    nodeOrType = nodeOrType.astNode;
  }

  if ('astNode' in nodeOrType) {
    assert(nodeOrType.astNode, 'Expected type to have an AST node');
    return nodeOrType.astNode.directives?.find((d) => d.name.value === name);
  }
  return nodeOrType.directives?.find((d) => d.name.value === name);
}

/** Indicates if objType contains the specified directive */
export function hasDirective(
  directiveName: string,
  type: GraphQLType | GraphQLField<unknown, unknown>
) {
  if (!('astNode' in type)) {
    return false;
  }

  return !!type.astNode?.directives
    ?.map(({name}) => name.value)
    .includes(directiveName);
}

/** Indicates if objType implements the specified interface */
export function hasInterface(interfaceName: string, objType: GraphQLType) {
  if (!isObjectType(objType) && !isInterfaceType(objType)) {
    return false;
  }

  return !!objType.astNode?.interfaces
    ?.map(({name}) => name.value)
    .includes(interfaceName);
}

/**
 * Indicates if field is the specified type. Does not care if field is NonNull
 */
export function isType(
  typeName: string,
  fieldType: GraphQLField<unknown, unknown>
): boolean {
  let {type} = fieldType;
  if (isNonNullType(type)) {
    type = type.ofType;
  }

  return isScalarType(type) && type.name === typeName;
}

/** Typesafe function for .filter to remove undefined or null values */
export function filterNull<T>(x: T | undefined | null): x is T {
  return Boolean(x);
}
