import path from 'node:path';

import type {Types} from '@graphql-codegen/plugin-helpers/typings/types';
import type {GraphQLSchema} from 'graphql';
import {isInterfaceType, isObjectType} from 'graphql';

import {assert} from '@code-like-a-carpenter/assert';
import type {
  IntermediateRepresentation,
  Model,
  Table,
} from '@code-like-a-carpenter/foundation-intermediate-representation';

import type {Config} from './config';
import {ParserConfigSchema} from './config';
import {hasDirective} from './helpers';
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

export function parse(
  schema: GraphQLSchema,
  documents: Types.DocumentFile[],
  config: Config,
  info?: Info
): IntermediateRepresentation {
  const configWithDefaults = ParserConfigSchema.parse(config);

  const typesMap = schema.getTypeMap();

  const models: Model[] = Object.keys(typesMap)
    .map((typeName) => schema.getTypeMap()[typeName])
    .filter((type) => hasDirective('model', type))
    .map((type) => {
      if (isObjectType(type)) {
        return extractModel(config, schema, type);
      }
      if (isInterfaceType(type)) {
        return extractModel(config, schema, type);
      }
      throw new Error(`Type ${type} is not an object or interface`);
    });

  const tables: Table[] = Object.keys(typesMap)
    .map((typeName) => schema.getTypeMap()[typeName])
    .filter((type) => hasDirective('model', type))
    .map((type) => {
      if (isObjectType(type)) {
        return extractTable(configWithDefaults, schema, type);
      }
      if (isInterfaceType(type)) {
        return extractTable(configWithDefaults, schema, type);
      }
      throw new Error(`Type ${type} is not an object or interface`);
    });

  return {
    dependenciesModuleId: resolveDependenciesModuleId(configWithDefaults, info),
    models,
    tables,
  };
}
