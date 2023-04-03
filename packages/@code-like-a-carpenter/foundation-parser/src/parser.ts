import assert from 'assert';

import type {Types} from '@graphql-codegen/plugin-helpers/typings/types';
import type {GraphQLObjectType, GraphQLSchema} from 'graphql';
import {assertObjectType, isObjectType} from 'graphql';

import type {
  BaseTable,
  DispatcherConfig,
  IntermediateRepresentation,
  Model,
  SecondaryIndex,
  Table,
  TableSecondaryIndex,
} from '@code-like-a-carpenter/foundation-intermediate-representation';

import type {Config} from './config';
import {
  filterNull,
  getOptionalArgStringValue,
  getOptionalDirective,
  hasInterface,
} from './helpers';
import {extractModel} from './models';
import {resolveDependenciesModuleId} from './paths';

export interface Info {
  [key: string]: unknown;
  outputFile?: string;
  allPlugins?: Types.ConfiguredPlugin[];
  pluginContext?: {
    [key: string]: unknown;
  };
}

/* eslint-disable complexity */

function combineDispatcherConfig(table: Table, model: Model): DispatcherConfig {
  const [cfg] = [
    'dispatcherConfig' in table && table.dispatcherConfig,
    ...(model.changeDataCaptureConfig?.map((cdc) => cdc.dispatcherConfig) ??
      []),
  ]
    .filter(filterNull)
    .map((config, index, configs) => {
      Object.keys(config).forEach((key) => {
        assert.strictEqual(
          config[key as keyof typeof config],
          configs[0][key as keyof typeof config],
          `Please check the ChangeDataCaptureConfig definitions for ${model.typeName}. All ChangeDataCaptureConfig in the same table must have the same ${key} value.`
        );
      });
      return config;
    });

  assert(cfg);

  return cfg;
}

/* eslint-enable complexity */

function combineTableWithModel(
  acc: Table,
  model: Model,
  dependenciesModuleId: string,
  tableName: string
): Table {
  assert.equal(
    acc.primaryKey.isComposite,
    model.primaryKey.isComposite,
    `Please check the Model definitions for ${tableName}. All Models in the same table must have the same type of primary key (either partition or composite).`
  );
  const secondaryIndexes = compareIndexes(
    tableName,
    acc.secondaryIndexes,
    model.secondaryIndexes
  );

  const baseConfig: BaseTable = {
    dependenciesModuleId,
    enablePointInTimeRecovery:
      acc.enablePointInTimeRecovery || model.enablePointInTimeRecovery,
    enableStreaming: acc.enableStreaming || model.enableStreaming,
    hasPublicModels: acc.hasPublicModels || model.isPublicModel,
    hasTtl: acc.hasTtl || !!model.ttlConfig,
    libImportPath: model.libImportPath,
    primaryKey: {
      isComposite: acc.primaryKey.isComposite,
    },
    secondaryIndexes,
    tableName,
  };

  const hasCdc = acc.hasCdc || model.changeDataCaptureConfig.length > 0;
  if (hasCdc) {
    const dispatcherConfig = combineDispatcherConfig(acc, model);
    assert(dispatcherConfig);
    return {
      ...baseConfig,
      dispatcherConfig,
      hasCdc: true,
    };
  }

  return {
    ...baseConfig,
    hasCdc: false,
  };
}

function extractTableFromModel(
  dependenciesModuleId: string,
  tableName: string,
  model: Model
): Table {
  const table: BaseTable = {
    dependenciesModuleId,
    enablePointInTimeRecovery: model.enablePointInTimeRecovery,
    enableStreaming: model.enableStreaming,

    hasPublicModels: model.isPublicModel,
    hasTtl: !!model.ttlConfig,
    libImportPath: model.libImportPath,
    primaryKey: {
      isComposite: model.primaryKey.isComposite,
    },
    secondaryIndexes: model.secondaryIndexes.map(
      ({isComposite, name, type, projectionType, ...rest}) => ({
        isComposite,
        isSingleField: 'isSingleField' in rest ? rest.isSingleField : false,
        name,
        projectionType,
        type,
      })
    ),
    tableName,
  };

  const hasCdc = model.changeDataCaptureConfig.length > 0;
  if (hasCdc) {
    const dispatcherConfig = combineDispatcherConfig(
      {...table, hasCdc: false},
      model
    );
    assert(dispatcherConfig);
    return {
      ...table,
      dispatcherConfig,
      hasCdc: true,
    };
  }

  return {
    ...table,
    hasCdc: false,
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
    .filter((typeName) => {
      const type = schema.getTypeMap()[typeName];
      return isObjectType(type) && hasInterface('Model', type);
    })
    .map((typeName) =>
      extractModel(
        config,
        schema,
        dependenciesModuleId,
        typeName,
        assertObjectType(typesMap[typeName])
      )
    );

  const tables: Table[] = Array.from(
    models
      .reduce((acc, model) => {
        const set = acc.get(model.tableName) ?? new Set();
        set.add(model);
        acc.set(model.tableName, set);
        return acc;
      }, new Map<string, Set<Model>>())
      .entries()
  )
    .map(
      ([tableName, tableModels]) =>
        [tableName, Array.from(tableModels)] as const
    )
    .map(([tableName, [firstModel, ...tableModels]]) => {
      return tableModels.reduce(
        (acc, model) =>
          combineTableWithModel(acc, model, dependenciesModuleId, tableName),
        extractTableFromModel(dependenciesModuleId, tableName, firstModel)
      );
    });

  return {
    additionalImports: models
      .flatMap((model) => model.fields.map((field) => field.computeFunction))
      .filter(filterNull),
    dependenciesModuleId,
    models,
    tables,
  };
}

function compareIndexes(
  tableName: string,
  tableIndexes: readonly TableSecondaryIndex[],
  modelIndexes: readonly SecondaryIndex[]
): TableSecondaryIndex[] {
  const tableIndexMap = new Map<string, TableSecondaryIndex>(
    tableIndexes.map((t) => [t.name, t])
  );

  const modelIndexMap = new Map<string, SecondaryIndex>(
    modelIndexes.map((m) => [m.name, m])
  );

  const long =
    tableIndexMap.size > modelIndexMap.size ? tableIndexMap : modelIndexMap;
  const short =
    tableIndexMap.size > modelIndexMap.size ? modelIndexMap : tableIndexMap;

  for (const [name, index] of short.entries()) {
    const longIndex = long.get(name);
    if (longIndex) {
      assert.equal(
        index.isComposite,
        longIndex.isComposite,
        `Please check the secondary index ${name} for the table ${tableName}. All indexes of the same name must be of the same type (either partition or composite).`
      );

      assert.equal(
        index.type,
        longIndex.type,
        `Please check the secondary index ${name} for the table ${tableName}. All indexes of the same name must be of the same type (either gsi or lsi).`
      );
      assert.equal(
        index.projectionType,
        longIndex.projectionType,
        `Please check the secondary index ${name} for the table ${tableName}. All indexes of the same name must be of the same projection type (either "all"" or "keys_only").`
      );
    } else {
      long.set(name, index);
    }
  }

  return Array.from(long.values());
}

/**
 * Determines table in which a particular Model should be stored.
 */
export function extractTableName(type: GraphQLObjectType): string {
  const directive = getOptionalDirective('table', type);
  if (directive) {
    const value = getOptionalArgStringValue('name', directive);
    if (value) {
      return value;
    }
  }
  return `Table${type.name}`;
}
