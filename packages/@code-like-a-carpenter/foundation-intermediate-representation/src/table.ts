import type {LambdaConfig, ProjectionType} from './types';

export interface BaseTable {
  readonly dependenciesModuleId: string;
  readonly enablePointInTimeRecovery: boolean;
  readonly enableStreaming: boolean;
  readonly hasPublicModels: boolean;
  readonly hasTtl: boolean;
  readonly primaryKey: TablePrimaryKeyConfig;
  readonly secondaryIndexes: readonly TableSecondaryIndex[];
  readonly tableName: string;
}

export interface DispatcherConfig extends LambdaConfig {
  readonly batchSize: number;
  readonly dependenciesModuleId: string;
  readonly directory: string;
  readonly filename: string;
  readonly functionName: string;
  readonly maximumRetryAttempts: number;
  /**
   * Relative path from the main template to the dispatcher's nested stack
   * template.
   */
  readonly nestedStackLocation: string;
  readonly runtimeModuleId: string;
}

export interface TableWithCdc extends BaseTable {
  readonly dispatcherConfig: DispatcherConfig;
  readonly hasCdc: true;
}

export interface TableWithoutCdc extends BaseTable {
  readonly hasCdc: false;
}

export type Table = TableWithCdc | TableWithoutCdc;

export interface TablePrimaryKeyConfig {
  readonly isComposite: boolean;
}

export interface TableCompositeKey {
  readonly isComposite: true;
  readonly partitionKeyIsSingleField: boolean;
  readonly partitionKeyName: string;
  readonly sortKeyIsSingleField: boolean;
  readonly sortKeyName: string;
}

export interface TableSimpleKey {
  readonly isComposite: false;
  readonly partitionKeyIsSingleField: boolean;
  readonly partitionKeyPrefix?: string;
  readonly partitionKeyName: string;
}

export type TableGSI = {
  readonly name: string;
  readonly projectionType: ProjectionType;
  readonly type: 'gsi';
} & (TableCompositeKey | TableSimpleKey);

export interface TableLSI extends TableCompositeKey {
  readonly name: string;
  readonly projectionType: ProjectionType;
  readonly type: 'lsi';
}

export type TableSecondaryIndex = TableGSI | TableLSI;
