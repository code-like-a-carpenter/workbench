import type {Field} from './field';
import type {LambdaConfig, ProjectionType} from './types';

export type ChangeDataCaptureEvent = 'INSERT' | 'MODIFY' | 'REMOVE' | 'UPSERT';
export type ChangeDataCaptureConfig =
  | ChangeDataCaptureEnricherConfig
  | ChangeDataCaptureTriggerConfig;

export interface BaseChangeDataCaptureConfig extends LambdaConfig {
  readonly actionsModuleId: string;
  readonly event: ChangeDataCaptureEvent;
  readonly filename: string;
  readonly handlerModuleId: string;
  readonly sourceModelName: string;
}

export interface ChangeDataCaptureEnricherConfig
  extends BaseChangeDataCaptureConfig {
  readonly targetModelName: string;
  readonly type: 'ENRICHER';
  readonly writableTables: readonly string[];
}

export interface ChangeDataCaptureTriggerConfig
  extends BaseChangeDataCaptureConfig {
  readonly readableTables: readonly string[];
  readonly type: 'TRIGGER';
  readonly writableTables: readonly string[];
}

export interface Model {
  readonly changeDataCaptureConfig: readonly ChangeDataCaptureConfig[];
  readonly consistent: boolean;
  readonly dependenciesModuleId: string;
  readonly enablePointInTimeRecovery: boolean;
  readonly fields: readonly Field[];
  readonly isLedger: boolean;
  readonly isPublicModel: boolean;
  readonly libImportPath: string;
  readonly tableName: string;
  readonly typeName: string;
  readonly primaryKey: PrimaryKeyConfig;
  readonly secondaryIndexes: readonly SecondaryIndex[];
  readonly ttlConfig?: TTLConfig;
}

export interface SimpleKey {
  readonly isComposite: false;
  readonly isSingleField: boolean;
  readonly partitionKeyFields: readonly Field[];
  readonly partitionKeyPrefix?: string;
  readonly partitionKeyName: string;
}

export interface CompositeKey {
  readonly isComposite: true;
  readonly partitionKeyFields: readonly Field[];
  readonly partitionKeyIsSingleField: boolean;
  readonly partitionKeyPrefix?: string;
  readonly partitionKeyName: string;
  readonly sortKeyFields: readonly Field[];
  readonly sortKeyIsSingleField: boolean;
  readonly sortKeyPrefix?: string;
  readonly sortKeyName: string;
}

export type GSI = {
  readonly name: string;
  readonly projectionType: ProjectionType;
  readonly type: 'gsi';
} & (SimpleKey | CompositeKey);

export interface LSI extends CompositeKey {
  readonly name: string;
  readonly projectionType: ProjectionType;
  readonly type: 'lsi';
}

export type SecondaryIndex = GSI | LSI;

export type PrimaryKeyConfig = {type: 'primary'} & (SimpleKey | CompositeKey);

export interface TTLConfig {
  readonly fieldName: string;
  readonly duration?: number;
}
