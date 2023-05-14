import type {Field} from './field';
import type {Table} from './table';
import type {LambdaConfig, ProjectionType} from './types';

export type ChangeDataCaptureEvent = 'INSERT' | 'MODIFY' | 'REMOVE' | 'UPSERT';
export type ChangeDataCaptureConfig =
  | ChangeDataCaptureEnricherConfig
  | ChangeDataCaptureReactorConfig
  | ChangeDataCaptureReducerConfig;

export interface BaseChangeDataCaptureConfig extends LambdaConfig {
  readonly actionsModuleId: string;
  readonly event: ChangeDataCaptureEvent;
  readonly directory: string;
  readonly filename: string;
  readonly functionName: string;
  readonly handlerImportName: string;
  readonly handlerModuleId: string;
  /**
   * Relative path from the main template to the dispatcher's nested stack
   * template.
   */
  readonly nestedStackLocation: string;
  readonly readableTables: readonly string[];
  readonly runtimeModuleId: string;
  readonly sourceModelName: string;
  readonly writableTables: readonly string[];
}

export interface ChangeDataCaptureEnricherConfig
  extends BaseChangeDataCaptureConfig {
  readonly targetModelName: string;
  readonly type: 'ENRICHER';
}

export interface ChangeDataCaptureReactorConfig
  extends BaseChangeDataCaptureConfig {
  readonly type: 'REACTOR';
}

export interface ChangeDataCaptureReducerConfig
  extends BaseChangeDataCaptureConfig {
  readonly type: 'REDUCER';
}

export interface Model {
  readonly changeDataCaptureConfig: readonly ChangeDataCaptureConfig[];
  readonly consistent: boolean;
  readonly fields: readonly Field[];
  readonly isLedger: boolean;
  readonly isPublic: boolean;
  readonly table: Table;
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

export type TTLConfig =
  | {
      readonly argumentAllowed: true;
      readonly argumentRequired: boolean;
      readonly fieldName: string;
    }
  | {
      readonly argumentAllowed: boolean;
      readonly argumentRequired: boolean;
      readonly duration: number;
      readonly fieldName: string;
    };
