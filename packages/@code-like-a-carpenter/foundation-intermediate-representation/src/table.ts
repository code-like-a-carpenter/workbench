import type {Condition} from './cloudformation';

export interface DispatcherConfig {
  readonly batchSize: number;
  readonly dependenciesModuleId: string;
  readonly directory: string;
  readonly filename: string;
  readonly functionName: string;
  readonly maximumRetryAttempts: number;
  readonly memorySize: number;
  readonly runtimeModuleId: string;
  readonly timeout: number;
}

export interface BaseTable {
  readonly enableEncryption: boolean | Condition;
  readonly enablePointInTimeRecovery: boolean | Condition;
  readonly hasPublicModels: boolean;
  readonly hasTtl: boolean;
  readonly primaryKey: TablePrimaryKeyConfig;
  readonly secondaryIndexes: readonly TableSecondaryIndex[];
  readonly tableName: string;
}

export interface TableWithCdc extends BaseTable {
  readonly hasCdc: true;
  readonly dispatcherConfig: DispatcherConfig;
}

export interface TableWithoutCdc extends BaseTable {
  readonly hasCdc: false;
}

export type Table = TableWithCdc | TableWithoutCdc;

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
