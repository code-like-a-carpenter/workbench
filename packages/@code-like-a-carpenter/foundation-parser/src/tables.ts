import type {
  GraphQLInterfaceType,
  GraphQLObjectType,
  GraphQLSchema,
} from 'graphql';

import {assert} from '@code-like-a-carpenter/assert';
import type {
  BaseTable,
  Condition,
  SecondaryIndex,
  Table,
  TableSecondaryIndex,
} from '@code-like-a-carpenter/foundation-intermediate-representation';

import {assertPrimaryKeysMatch} from './assertions';
import type {Config} from './config';
import {extractDispatcherConfig} from './extractors/cdc';
import {
  getCondition,
  getOptionalArgStringValue,
  getOptionalDirective,
  hasInterface,
} from './helpers';
import {getModel} from './models';

type Writeable<T> = {-readonly [P in keyof T]: T[P]};

const tables = new Map<GraphQLSchema, Map<string, Table>>();

export function extractTable(
  config: Config,
  schema: GraphQLSchema,
  type: GraphQLInterfaceType | GraphQLObjectType,
  outputFile: string
): Table {
  let mapForSchema = tables.get(schema);
  if (!mapForSchema) {
    mapForSchema = new Map();
    tables.set(schema, mapForSchema);
  }

  const tableName = extractTableName(type);

  const existingTable = mapForSchema.get(tableName);
  if (existingTable) {
    return updateExistingTable(config, type, existingTable, tableName);
  }

  const newTable = defineNewTable(config, type, tableName, outputFile);
  mapForSchema.set(newTable.tableName, newTable);

  return newTable;
}

function defineNewTable(
  config: Config,
  type: GraphQLInterfaceType | GraphQLObjectType,
  tableName: string,
  outputFile: string
): Table {
  const model = getModel(type);

  const table: BaseTable = {
    enableEncryption: shouldEnableEncryption(config, type),
    enablePointInTimeRecovery: shouldEnablePointIntTimeRecovery(config, type),
    hasPublicModels: hasInterface('PublicModel', type),
    hasTtl: !!model.ttlConfig,
    primaryKey: model.primaryKey,
    secondaryIndexes: model.secondaryIndexes.map(modelIndexToTableIndex),
    tableName,
  };

  if (model.changeDataCaptureConfig.length) {
    return {
      ...table,
      dispatcherConfig: extractDispatcherConfig(
        config,
        type,
        tableName,
        model,
        outputFile
      ),
      hasCdc: true,
    };
  }

  return {...table, hasCdc: false};
}

export function extractTableName(
  type: GraphQLInterfaceType | GraphQLObjectType
): string {
  const directive = getOptionalDirective('table', type);
  if (directive) {
    const value = getOptionalArgStringValue('name', directive);
    if (value) {
      return value;
    }
  }
  return `Table${type.name}`;
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

// eslint-disable-next-line complexity
function combineConditions(current: Condition, next: Condition): Condition {
  if (typeof current === 'string' && typeof next === 'string') {
    assert(
      current === next,
      `Cannot combine conditions ${current} and ${next}`
    );
    return current;
  }

  if (typeof current === 'boolean' && typeof next === 'boolean') {
    return current || next;
  }

  if (current === next) {
    return current;
  }

  if (current === true || next === true) {
    return true;
  }

  return current || next || false;
}

function updateExistingTable(
  config: Config,
  type: GraphQLInterfaceType | GraphQLObjectType,
  existingTable: Writeable<Table>,
  tableName: string
): Table {
  const model = getModel(type);

  existingTable.enablePointInTimeRecovery = combineConditions(
    existingTable.enablePointInTimeRecovery,
    shouldEnablePointIntTimeRecovery(config, type)
  );
  existingTable.enableEncryption = combineConditions(
    existingTable.enableEncryption,
    shouldEnableEncryption(config, type)
  );

  existingTable.hasPublicModels =
    existingTable.hasPublicModels || hasInterface('PublicModel', type);

  existingTable.hasTtl = existingTable.hasTtl || !!model.ttlConfig;

  assertPrimaryKeysMatch(tableName, existingTable.primaryKey, model.primaryKey);

  combineSecondaryIndexes(
    tableName,
    existingTable.secondaryIndexes as Writeable<TableSecondaryIndex[]>,
    model.secondaryIndexes
  );

  return existingTable;
}

function modelIndexToTableIndex(mi: SecondaryIndex): TableSecondaryIndex {
  if (mi.type === 'lsi') {
    return {
      isSingleField: mi.sortKeyIsSingleField,
      name: mi.name,
      projectionType: mi.projectionType,
      type: 'lsi',
    };
  }

  return {
    isComposite: mi.isComposite,
    name: mi.name,
    partitionKeyIsSingleField: mi.partitionKeyFields.length === 1,
    projectionType: mi.projectionType,
    sortKeyIsSingleField: mi.isComposite && mi.sortKeyFields.length === 1,
    type: 'gsi',
  };
}

function shouldEnableEncryption(
  config: Config,
  type: GraphQLInterfaceType | GraphQLObjectType
): Condition {
  const tableDirective = getOptionalDirective('table', type);
  if (!tableDirective) {
    return config.tableDefaults.enableEncryption;
  }
  const condition = getCondition(tableDirective, 'enableEncryption');
  if (!condition) {
    return config.tableDefaults.enableEncryption;
  }
  return condition;
}

function shouldEnablePointIntTimeRecovery(
  config: Config,
  type: GraphQLInterfaceType | GraphQLObjectType
): Condition {
  const tableDirective = getOptionalDirective('table', type);
  if (!tableDirective) {
    return config.tableDefaults.enablePointInTimeRecovery;
  }
  const condition = getCondition(tableDirective, 'enablePointInTimeRecovery');
  if (!condition) {
    return config.tableDefaults.enablePointInTimeRecovery;
  }
  return condition;
}
