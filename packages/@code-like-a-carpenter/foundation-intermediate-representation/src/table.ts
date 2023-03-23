import type {Condition} from './cloudformation';

export interface Table {
  readonly enableEncryption: boolean | Condition;
  readonly enablePointInTimeRecovery: boolean | Condition;
  readonly hasPublicModels: boolean;
  readonly primaryKey: TablePrimaryKeyConfig;
  readonly secondaryIndexes: readonly TableSecondaryIndex[];
  readonly tableName: string;
}

export interface TablePrimaryKeyConfig {
  readonly isComposite: boolean;
}

export interface TableGSI {
  readonly isComposite: boolean;
  readonly name: string;
  readonly partitionKeyIsSingleField: boolean;
  readonly projectionType: 'all' | 'keys_only';
  readonly sortKeyIsSingleField: boolean;
  readonly type: 'gsi';
}

export interface TableLSI {
  readonly isSingleField: boolean;
  readonly name: string;
  readonly projectionType: 'all' | 'keys_only';
  readonly type: 'lsi';
}

export type TableSecondaryIndex = TableGSI | TableLSI;
