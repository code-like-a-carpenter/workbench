import type {Model} from '@code-like-a-carpenter/foundation-intermediate-representation';

import {getTypeScriptTypeForField, objectToString} from '../helpers';

export function primaryKeyTpl(model: Model) {
  return `export interface ${model.typeName}PrimaryKey ${objectToString(
    Object.fromEntries(
      (model.primaryKey.isComposite
        ? [
            ...model.primaryKey.partitionKeyFields,
            ...model.primaryKey.sortKeyFields,
          ]
        : model.primaryKey.partitionKeyFields
      )
        .map(getTypeScriptTypeForField)
        .sort()
    )
  )}`;
}
