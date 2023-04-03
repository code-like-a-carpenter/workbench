import assert from 'assert';

import type {Types} from '@graphql-codegen/plugin-helpers/typings/types';
import type {GraphQLSchema} from 'graphql';
import {assertObjectType, isObjectType} from 'graphql';

import type {
  IntermediateRepresentation,
  Model,
  Table,
} from '@code-like-a-carpenter/foundation-intermediate-representation';

import type {Config} from './config';
import {filterNull, hasInterface} from './helpers';
import {extractModel} from './models';
import {resolveDependenciesModuleId} from './paths';
import {extractTable} from './tables';

export interface Info {
  [key: string]: unknown;
  outputFile?: string;
  allPlugins?: Types.ConfiguredPlugin[];
  pluginContext?: {
    [key: string]: unknown;
  };
}

/**
 * Reads a set of GraphQL Schema files and produces an Intermediate
 * Representation.
 */
export function parse(
  schema: GraphQLSchema,
  documents: Types.DocumentFile[],
  config: Config,
  info?: Info
): IntermediateRepresentation {
  const outputFile = info?.outputFile;
  assert(outputFile, 'outputFile is required');

  const dependenciesModuleId = resolveDependenciesModuleId(
    outputFile,
    config.dependenciesModuleId
  );

  const typesMap = schema.getTypeMap();

  const models: Model[] = Object.keys(typesMap)
    .map((typeName) => schema.getTypeMap()[typeName])
    .filter((type) => isObjectType(type))
    .map((type) => assertObjectType(type))
    .filter((type) => hasInterface('Model', type))
    .map((type) =>
      extractModel(config, schema, dependenciesModuleId, type.name, type)
    );

  const tables: Table[] = Object.keys(typesMap)
    .map((typeName) => schema.getTypeMap()[typeName])
    .filter((type) => isObjectType(type))
    .map((type) => assertObjectType(type))
    .filter((type) => hasInterface('Model', type))
    .map((type) => extractTable(config, schema, type, outputFile));

  return {
    additionalImports: models
      .flatMap((model) => model.fields.map((field) => field.computeFunction))
      .filter(filterNull),
    dependenciesModuleId,
    models,
    tables,
  };
}
