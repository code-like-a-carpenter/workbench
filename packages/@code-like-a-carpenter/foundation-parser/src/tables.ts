import type {
  GraphQLInterfaceType,
  GraphQLObjectType,
  GraphQLSchema,
} from 'graphql';

import {assert} from '@code-like-a-carpenter/assert';
import type {
  SecondaryIndex,
  Table,
  TableSecondaryIndex,
} from '@code-like-a-carpenter/foundation-intermediate-representation';

import {assertPrimaryKeysMatch} from './assertions';
import {
  getOptionalArgBooleanValue,
  getOptionalArgStringValue,
  getOptionalDirective,
  hasInterface,
} from './helpers';
import {getModel} from './models';

type Writeable<T> = {-readonly [P in keyof T]: T[P]};

const tables = new Map<GraphQLSchema, Map<string, Table>>();

export function extractTable(
  schema: GraphQLSchema,
  type: GraphQLInterfaceType | GraphQLObjectType
): Table {
  let mapForSchema = tables.get(schema);
  if (!mapForSchema) {
    mapForSchema = new Map();
    tables.set(schema, mapForSchema);
  }

  const tableName = extractTableName(type);

  const existingTable = mapForSchema.get(tableName);
  if (existingTable) {
    return updateExistingTable(type, existingTable, tableName);
  }

  const newTable = defineNewTable(type, tableName);
  mapForSchema.set(newTable.tableName, newTable);

  return newTable;
}

function defineNewTable(
  type: GraphQLInterfaceType | GraphQLObjectType,
  tableName: string
): Table {
  const model = getModel(type);

  const table: Table = {
    enableEncryption: shouldEnableEncryption(type),
    enablePointInTimeRecovery: shouldEnablePointIntTimeRecovery(type),
    hasPublicModels: hasInterface('PublicModel', type),
    primaryKey: model.primaryKey,
    secondaryIndexes: model.secondaryIndexes.map(modelIndexToTableIndex),
    tableName,
  };

  return table;
}

function extractTableName(
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

function updateExistingTable(
  type: GraphQLInterfaceType | GraphQLObjectType,
  existingTable: Writeable<Table>,
  tableName: string
): Table {
  const model = getModel(type);

  existingTable.enablePointInTimeRecovery =
    existingTable.enablePointInTimeRecovery ||
    shouldEnablePointIntTimeRecovery(type);

  existingTable.hasPublicModels =
    existingTable.hasPublicModels || hasInterface('PublicModel', type);

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
  type: GraphQLInterfaceType | GraphQLObjectType
): boolean {
  // FIXME this should be dynamic and should return a Condition type
  return true;
}

function shouldEnablePointIntTimeRecovery(
  type: GraphQLInterfaceType | GraphQLObjectType
  // FIXME this should return a Condition type
): boolean {
  const tableDirective = getOptionalDirective('table', type);

  return tableDirective
    ? getOptionalArgBooleanValue(
        'enablePointInTimeRecovery',
        tableDirective
      ) !== false
    : true;
}
