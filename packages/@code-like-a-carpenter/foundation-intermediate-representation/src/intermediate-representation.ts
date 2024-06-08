import type {Import} from './field.ts';
import type {Model} from './model.ts';
import type {Table} from './table.ts';

export interface IntermediateRepresentation {
  readonly dependenciesModuleId: string;
  readonly additionalImports: readonly Import[];
  readonly models: readonly Model[];
  readonly tables: readonly Table[];
}
