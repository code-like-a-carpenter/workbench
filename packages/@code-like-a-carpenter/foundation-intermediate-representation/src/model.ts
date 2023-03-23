import type {Field} from './field';
import type {Table} from './table';

export interface Model {
  readonly consistent: boolean;
  readonly fields: readonly Field[];
  readonly isLedger: boolean;
  readonly table: Table;
  readonly typeName: string;
  readonly primaryKey: PrimaryKey;
  readonly secondaryIndexes: readonly SecondaryIndex[];
}

export interface SimpleKey {
  readonly isComposite: false;
  readonly isSingleField: boolean;
  readonly partitionKeyFields: readonly Field[];
  readonly partitionKeyPrefix?: string;
}

export interface SimplePrimaryKey extends SimpleKey {
  readonly type: 'primary';
}

export interface CompositeKey {
  readonly isComposite: true;
  readonly partitionKeyFields: readonly Field[];
  readonly partitionKeyIsSingleField: boolean;
  readonly partitionKeyPrefix?: string;
  readonly sortKeyFields: readonly Field[];
  readonly sortKeyIsSingleField: boolean;
  readonly sortKeyPrefix?: string;
}

export interface CompositePrimaryKey extends CompositeKey {
  readonly type: 'primary';
}

export type PrimaryKey = SimplePrimaryKey | CompositePrimaryKey;

export type GSI = {
  readonly name: string;
  readonly projectionType: 'all' | 'keys_only';
  readonly type: 'gsi';
} & (SimpleKey | CompositeKey);

export interface LSI {
  readonly isComposite: true;
  readonly name: string;
  readonly partitionKeyFields: readonly Field[];
  readonly partitionKeyIsSingleField: boolean;
  readonly partitionKeyPrefix?: string;
  readonly projectionType: 'all' | 'keys_only';
  readonly sortKeyFields: readonly Field[];
  readonly sortKeyIsSingleField: boolean;
  readonly sortKeyPrefix?: string;
  readonly type: 'lsi';
}

export type SecondaryIndex = GSI | LSI;
