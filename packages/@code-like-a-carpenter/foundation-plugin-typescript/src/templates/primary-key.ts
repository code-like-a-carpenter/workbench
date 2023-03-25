import type {Model} from '@code-like-a-carpenter/foundation-intermediate-representation';

import {getTypeScriptTypeForField, objectToString} from '../helpers';

export function primaryKeyTpl(model: Model) {
  return `export interface ${model.typeName}PrimaryKey ${objectToString(
    Object.fromEntries(
      getPrimaryKeyFields(model).map(getTypeScriptTypeForField).sort()
    )
  )}`;
}

export function pluckPrimaryKey(model: Model) {
  return objectToString(
    Object.fromEntries(
      getPrimaryKeyFields(model)
        .map(({fieldName}) => fieldName)
        .sort()
        .map((fieldName) => [fieldName, `input.${fieldName}`])
    )
  );
}

export function getPrimaryKeyFields(model: Model) {
  return model.primaryKey.isComposite
    ? [
        ...model.primaryKey.partitionKeyFields,
        ...model.primaryKey.sortKeyFields,
      ]
    : model.primaryKey.partitionKeyFields;
}
