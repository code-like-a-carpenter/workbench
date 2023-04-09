import fs from 'node:fs';
import path from 'node:path';

import type {GraphQLObjectType} from 'graphql';

import {assert} from '@code-like-a-carpenter/assert';

import type {Config} from './config';

/** Resolves the path from the handler to the actions module. */
export function resolveActionsModuleId(config: Config, directory: string) {
  if (config.actionsModuleId.startsWith('.')) {
    const resolved = path.relative(directory, config.actionsModuleId);
    return resolved.replace(new RegExp(`${path.extname(resolved)}$`), '');
  }
  return config.actionsModuleId;
}

/**
 * Resolves the path from the graphql-codegen output file to the dependencies
 * module.
 */
export function resolveDependenciesModuleId(config: Config, directory: string) {
  if (config.dependenciesModuleId.startsWith('.')) {
    return path.relative(directory, config.dependenciesModuleId);
  }
  return config.dependenciesModuleId;
}

export function resolveHandlerModuleId(
  type: GraphQLObjectType,
  directory: string,
  handler: string
) {
  if (!handler.startsWith('.')) {
    return handler;
  }

  assert(type.astNode, `Expected ${type.name} to have an AST node`);
  assert(
    type.astNode.description,
    `Expected ${type.name} to have a description`
  );
  assert(
    type.astNode.description.loc,
    `Expected ${type.name} to have a location`
  );
  assert(
    type.astNode.description.loc.source,
    `Expected ${type.name} to have a source`
  );
  assert(
    type.astNode.description.loc.source.name,
    `Expected ${type.name} to have a name`
  );
  const schemaFile = type.astNode.description.loc.source.name;
  // When jest loads from inside a test file, there won't be a file to load.
  if (process.env.NODE_ENV !== 'test') {
    assert(fs.statSync(schemaFile), `Expected ${schemaFile} to exist`);
  }

  const absolutePathToHandler = path.join(path.dirname(schemaFile), handler);
  const absolutePathToDirectory = path.resolve(directory);
  return path.relative(absolutePathToDirectory, absolutePathToHandler);
}
