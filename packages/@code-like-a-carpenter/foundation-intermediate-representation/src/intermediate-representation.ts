import type {Import} from './field';
import type {Model} from './model';
import type {Table} from './table';

export interface IntermediateRepresentation {
  readonly additionalImports: readonly Import[];
  readonly dependenciesModuleId: string;
  readonly models: readonly Model[];
  readonly tables: readonly Table[];
}
