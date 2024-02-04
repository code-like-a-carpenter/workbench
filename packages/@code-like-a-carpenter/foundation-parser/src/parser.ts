import assert from 'assert';
import path from 'path';

import type {Types} from '@graphql-codegen/plugin-helpers';
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

  const dependenciesModuleId = resolveDependenciesModuleId(config, {
    outputFile,
  });

  const typesMap = schema.getTypeMap();

  const models: Model[] = Array.from(
    new Set(
      Object.keys(typesMap)
        .map((typeName) => schema.getTypeMap()[typeName])
        .filter((type) => isObjectType(type))
        .map((type) => assertObjectType(type))
        .filter((type) => hasInterface('Model', type))
        .map((type) => extractModel(config, schema, type, outputFile))
        .sort()
    )
  );

  const tables: Table[] = Array.from(
    new Set(
      Object.keys(typesMap)
        .map((typeName) => schema.getTypeMap()[typeName])
        .filter((type) => isObjectType(type))
        .map((type) => assertObjectType(type))
        .filter((type) => hasInterface('Model', type))
        .map((type) => extractTable(config, schema, type, outputFile))
        .sort()
    )
  );

  return {
    additionalImports: models
      .flatMap((model) => model.fields.map((field) => field.computeFunction))
      .filter(filterNull),
    dependenciesModuleId,
    models,
    tables,
  };
}

function resolveDependenciesModuleId(config: Config, info: Info | undefined) {
  assert(
    info?.outputFile,
    'You appear to be using this plugin in a context that does not require an output file. This is not supported.'
  );
  const {dependenciesModuleId} = config;
  const {outputFile} = info;

  return dependenciesModuleId.startsWith('.')
    ? path.relative(
        path.resolve(process.cwd(), path.dirname(outputFile)),
        path.resolve(process.cwd(), dependenciesModuleId)
      )
    : dependenciesModuleId;
}
