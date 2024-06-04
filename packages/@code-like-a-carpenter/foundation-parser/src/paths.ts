import fs from 'node:fs';
import path from 'node:path';

import type {GraphQLObjectType} from 'graphql';

import {assert} from '@code-like-a-carpenter/assert';

import type {Config} from './config.ts';

/** Resolves the path from the handler to the actions module. */
export function resolveActionsModuleId(config: Config, directory: string) {
  if (config.actionsModuleId.startsWith('.')) {
    const importPath = path.relative(directory, config.actionsModuleId);

    if (config.requireExtensions) {
      assert(
        path.extname(importPath),
        `Expected ${importPath} to actionsModuleId to have an extension in file`
      );
    }

    return importPath;
  }
  return config.actionsModuleId;
}

/**
 * Resolves the path from the graphql-codegen output file to the dependencies
 * module.
 */
export function resolveDependenciesModuleId(config: Config, directory: string) {
  if (config.dependenciesModuleId.startsWith('.')) {
    const importPath = path.relative(directory, config.dependenciesModuleId);

    if (config.requireExtensions) {
      assert(
        path.extname(importPath),
        `Expected ${importPath} to dependenciesModuleId to have an extension`
      );
    }

    return importPath;
  }
  return config.dependenciesModuleId;
}

export function resolveHandlerModuleId(
  config: Config,
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
  const importPath = path.relative(
    absolutePathToDirectory,
    absolutePathToHandler
  );

  if (config.requireExtensions) {
    assert(
      path.extname(importPath),
      `Expected ${importPath} to have an extension in file ${schemaFile}`
    );
  }

  return importPath;
}
