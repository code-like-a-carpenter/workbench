import type {LambdaConfig, ProjectionType} from './types';

export interface BaseTable {
  readonly dependenciesModuleId: string;
  readonly enablePointInTimeRecovery: boolean;
  readonly enableStreaming: boolean;
  readonly hasPublicModels: boolean;
  readonly hasTtl: boolean;
  readonly libImportPath: string;
  readonly primaryKey: TablePrimaryKeyConfig;
  readonly secondaryIndexes: readonly TableSecondaryIndex[];
  readonly tableName: string;
}

export type DispatcherConfig = LambdaConfig;

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

export interface TableSecondaryIndex {
  readonly isComposite: boolean;
  readonly isSingleField: boolean;
  readonly name: string;
  readonly projectionType: ProjectionType;
  readonly type: 'gsi' | 'lsi';
}
