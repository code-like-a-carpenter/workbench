import type {Model} from './model';
import type {Table} from './table';

export interface IntermediateRepresentation {
  readonly dependenciesModuleId: string;
  readonly models: readonly Model[];
  readonly tables: readonly Table[];
}