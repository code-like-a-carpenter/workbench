import type {Types} from '@graphql-codegen/plugin-helpers/typings/types';
import type {GraphQLSchema} from 'graphql';
import {isInterfaceType, isObjectType} from 'graphql';

import type {
  IntermediateRepresentation,
  Model,
  Table,
} from '@code-like-a-carpenter/foundation-intermediate-representation';

import type {Config} from './config';
import {applyDefaults} from './config';
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

export function parse(
  schema: GraphQLSchema,
  documents: Types.DocumentFile[],
  config: Config,
  info?: Info
): IntermediateRepresentation {
  const configWithDefaults = applyDefaults(config);

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
    models,
    tables,
  };
}
