import {assert} from '@code-like-a-carpenter/assert';
import type {
  PrimaryKey,
  TablePrimaryKeyConfig,
} from '@code-like-a-carpenter/foundation-intermediate-representation';

export function assertPrimaryKeysMatch(
  tableName: string,
  tablePrimaryKey: TablePrimaryKeyConfig,
  modelPrimaryKey: PrimaryKey
) {
  assert(
    tablePrimaryKey.isComposite === modelPrimaryKey.isComposite,
    `All models in table must be composite (or not). Please check the definitions for the models in ${tableName}.`
  );
}
