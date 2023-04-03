import type {Import} from './field';
import type {Model} from './model';
import type {Table} from './table';

export interface IntermediateRepresentation {
  readonly dependenciesModuleId: string;
  readonly additionalImports: readonly Import[];
  readonly models: readonly Model[];
  readonly tables: readonly Table[];
}
