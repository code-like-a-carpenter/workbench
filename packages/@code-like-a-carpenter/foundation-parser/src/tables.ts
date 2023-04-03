import type {GraphQLObjectType, GraphQLSchema} from 'graphql';

import {assert} from '@code-like-a-carpenter/assert';
import type {
  BaseTable,
  PrimaryKeyConfig,
  SecondaryIndex,
  Table,
  TablePrimaryKeyConfig,
  TableSecondaryIndex,
} from '@code-like-a-carpenter/foundation-intermediate-representation';

import type {Config} from './config';
import {extractDispatcherConfig} from './extractors/cdc';
import {
  getOptionalArgStringValue,
  getOptionalDirective,
  hasInterface,
} from './helpers';
import {getModel} from './models';
import {resolveDependenciesModuleId} from './paths';
import type {Writable} from './types';

const tables = new Map<string, Table>();

export function extractTable(
  config: Config,
  schema: GraphQLSchema,
  type: GraphQLObjectType,
  outputFile: string
): Table {
  const tableName = extractTableName(type);

  const existingTable = tables.get(tableName);
  if (existingTable) {
    return updateExistingTable(config, type, existingTable, tableName);
  }

  const newTable = defineNewTable(config, type, tableName, outputFile);
  tables.set(newTable.tableName, newTable);

  return newTable;
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

export function assertPrimaryKeysMatch(
  tableName: string,
  tablePrimaryKey: TablePrimaryKeyConfig,
  modelPrimaryKey: PrimaryKeyConfig
) {
  assert(
    tablePrimaryKey.isComposite === modelPrimaryKey.isComposite,
    `All models in table must be composite (or not). Please check the definitions for the models in ${tableName}.`
  );
}

function combineSecondaryIndexes(
  tableName: string,
  tableIndexes: TableSecondaryIndex[],
  modelIndexes: readonly SecondaryIndex[]
): void {
  const tableIndexMap = new Map<string, TableSecondaryIndex>(
    tableIndexes.map((t) => [t.name, t])
  );

  const modelIndexMap = new Map<string, SecondaryIndex>(
    modelIndexes.map((m) => [m.name, m])
  );

  for (const [name, modelIndex] of modelIndexMap.entries()) {
    const index = tableIndexMap.get(name);
    if (index) {
      // if both are LSI, then isComposite doesn't matter
      if (index.type === 'gsi' && modelIndex.type === 'gsi') {
        assert(
          index.isComposite === modelIndex.isComposite,
          `Please check the secondary index ${name} for the table ${tableName}. All indexes of the same name must be of the same type (either partition or composite).`
        );
      }

      assert(
        index.type === modelIndex.type,
        `Please check the secondary index ${name} for the table ${tableName}. All indexes of the same name must be of the same type (either gsi or lsi).`
      );
      assert(
        index.projectionType === modelIndex.projectionType,
        `Please check the secondary index ${name} for the table ${tableName}. All indexes of the same name must be of the same projection type (either "all"" or "keys_only").`
      );
    } else {
      tableIndexes.push(modelIndexToTableIndex(modelIndex));
    }
  }
}

function defineNewTable(
  config: Config,
  type: GraphQLObjectType,
  tableName: string,
  outputFile: string
): Table {
  const model = getModel(type);

  // This needs to move to CDC config
  const dependenciesModuleId = resolveDependenciesModuleId(
    outputFile,
    config.dependenciesModuleId
  );

  const table: BaseTable = {
    dependenciesModuleId,
    enablePointInTimeRecovery: model.enablePointInTimeRecovery,
    enableStreaming: model.changeDataCaptureConfig.length > 0,
    hasPublicModels: hasInterface('PublicModel', type),
    hasTtl: !!model.ttlConfig,
    libImportPath: '@code-like-a-carpenter/foundation-runtime',
    primaryKey: model.primaryKey,
    secondaryIndexes: model.secondaryIndexes.map(modelIndexToTableIndex),
    tableName,
  };

  if (model.changeDataCaptureConfig.length) {
    return {
      ...table,
      dispatcherConfig: extractDispatcherConfig(config, type),
      hasCdc: true,
    };
  }

  return {...table, hasCdc: false};
}

function modelIndexToTableIndex(mi: SecondaryIndex): TableSecondaryIndex {
  if (mi.type === 'lsi') {
    return {
      isComposite: true,
      isSingleField: mi.sortKeyFields.length === 1,
      name: mi.name,
      projectionType: mi.projectionType,
      type: 'lsi',
    };
  }

  return {
    isComposite: true,
    // This is wrong, but I need to update the IR to fix it.
    isSingleField: false,
    name: mi.name,
    projectionType: mi.projectionType,
    type: 'gsi',
  };
}

function updateExistingTable(
  config: Config,
  type: GraphQLObjectType,
  existingTable: Writable<Table>,
  tableName: string
): Table {
  const model = getModel(type);

  existingTable.enablePointInTimeRecovery =
    existingTable.enablePointInTimeRecovery || model.enablePointInTimeRecovery;
  existingTable.enableStreaming =
    existingTable.enableStreaming || model.changeDataCaptureConfig.length > 0;

  existingTable.hasPublicModels =
    existingTable.hasPublicModels || hasInterface('PublicModel', type);

  existingTable.hasTtl = existingTable.hasTtl || !!model.ttlConfig;

  assertPrimaryKeysMatch(tableName, existingTable.primaryKey, model.primaryKey);

  combineSecondaryIndexes(
    tableName,
    existingTable.secondaryIndexes as Writable<TableSecondaryIndex[]>,
    model.secondaryIndexes
  );

  return existingTable;
}
