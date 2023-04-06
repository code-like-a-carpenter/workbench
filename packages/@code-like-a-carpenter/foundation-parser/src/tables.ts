import type {GraphQLObjectType, GraphQLSchema} from 'graphql';

import {assert} from '@code-like-a-carpenter/assert';
import type {
  BaseTable,
  Model,
  PrimaryKeyConfig,
  SecondaryIndex,
  Table,
  TablePrimaryKeyConfig,
  TableSecondaryIndex,
} from '@code-like-a-carpenter/foundation-intermediate-representation';

import type {Config} from './config';
import {extractDispatcherConfig} from './extractors/cdc';
import {
  getOptionalArgBooleanValue,
  getOptionalArgStringValue,
  getOptionalDirective,
  hasInterface,
} from './helpers';
import {getModel} from './models';
import {resolveDependenciesModuleId} from './paths';
import type {Writable} from './types';

// Reminder: this is has an extra layer of nesting specifically for tests. It's
// unlikely that there will ever be more than one schema during normal
// operation, however a number of tests use in-line schemas the declare the same
// models.
const schemaTables = new WeakMap<GraphQLSchema, Map<string, Table>>();

export function extractTable(
  config: Config,
  schema: GraphQLSchema,
  type: GraphQLObjectType,
  outputFile: string
): Table {
  let tables = schemaTables.get(schema);
  if (!tables) {
    tables = new Map<string, Table>();
    schemaTables.set(schema, tables);
  }

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
  const dependenciesModuleId = resolveDependenciesModuleId(config, outputFile);

  const table: BaseTable = {
    dependenciesModuleId,
    enablePointInTimeRecovery: shouldEnablePointInTimeRecovery(config, type),
    enableStreaming: shouldEnableStreaming(type, model),
    hasPublicModels: hasInterface('PublicModel', type),
    hasTtl: !!model.ttlConfig,
    primaryKey: model.primaryKey,
    secondaryIndexes: model.secondaryIndexes.map(modelIndexToTableIndex),
    tableName,
  };

  if (model.changeDataCaptureConfig.length) {
    return {
      ...table,
      dispatcherConfig: extractDispatcherConfig(config, outputFile, type),
      hasCdc: true,
    };
  }

  return {...table, hasCdc: false};
}

function modelIndexToTableIndex(mi: SecondaryIndex): TableSecondaryIndex {
  if (mi.type === 'lsi') {
    return {
      isComposite: mi.isComposite,
      name: mi.name,
      partitionKeyIsSingleField: mi.partitionKeyIsSingleField,
      partitionKeyName: mi.partitionKeyName,
      projectionType: mi.projectionType,
      sortKeyIsSingleField: mi.sortKeyIsSingleField,
      sortKeyName: mi.sortKeyName,
      type: 'lsi',
    };
  }

  if (mi.isComposite) {
    return {
      isComposite: mi.isComposite,
      name: mi.name,
      partitionKeyIsSingleField: mi.partitionKeyFields.length === 1,
      partitionKeyName: mi.partitionKeyName,
      projectionType: mi.projectionType,
      sortKeyIsSingleField: mi.isComposite && mi.sortKeyFields.length === 1,
      sortKeyName: mi.sortKeyName,
      type: 'gsi',
    };
  }

  return {
    isComposite: mi.isComposite,
    name: mi.name,
    partitionKeyIsSingleField: mi.partitionKeyFields.length === 1,
    partitionKeyName: mi.partitionKeyName,
    partitionKeyPrefix: mi.partitionKeyPrefix,
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
    existingTable.enablePointInTimeRecovery ||
    shouldEnablePointInTimeRecovery(config, type);
  existingTable.enableStreaming =
    existingTable.enableStreaming || shouldEnableStreaming(type, model);

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

function shouldEnablePointInTimeRecovery(
  config: Config,
  type: GraphQLObjectType
) {
  const tableDirective = getOptionalDirective('table', type);
  if (!tableDirective) {
    return config.tableDefaults.enablePointInTimeRecovery;
  }
  return (
    getOptionalArgBooleanValue('enablePointInTimeRecovery', tableDirective) !==
    false
  );
}

function shouldEnableStreaming(
  type: GraphQLObjectType,
  model: Readonly<Model>
) {
  if (model.changeDataCaptureConfig.length > 0) {
    return true;
  }

  const tableDirective = getOptionalDirective('table', type);

  return tableDirective
    ? getOptionalArgBooleanValue('enableStreaming', tableDirective) !== false
    : false;
}
