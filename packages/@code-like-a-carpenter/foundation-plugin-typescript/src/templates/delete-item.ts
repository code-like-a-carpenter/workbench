import type {
  Model,
  PrimaryKey,
} from '@code-like-a-carpenter/foundation-intermediate-representation';

import type {Config} from '../config';
import {ensureTableTemplate, makeKeyTemplate, objectToString} from '../helpers';

import {handleCommonErrors} from './common';

function makeKey(config: Config, key: PrimaryKey): Record<string, string> {
  if (key.isComposite) {
    const doLegacy =
      config.legacyEmptySortFieldBehavior && key.sortKeyFields.length === 0;
    return {
      pk: makeKeyTemplate(
        key.partitionKeyPrefix,
        key.partitionKeyFields,
        'read'
      ),
      sk: doLegacy
        ? `'${key.sortKeyPrefix}#0'`
        : makeKeyTemplate(key.sortKeyPrefix, key.sortKeyFields, 'read'),
    };
  }

  return {
    pk: makeKeyTemplate(key.partitionKeyPrefix, key.partitionKeyFields, 'read'),
  };
}

/** template */
export function deleteItemTpl(config: Config, model: Model) {
  const {
    primaryKey,
    table: {tableName},
    typeName,
  } = model;
  const outputTypeName = `Delete${typeName}Output`;
  const primaryKeyType = `${typeName}PrimaryKey`;

  const key = makeKey(config, primaryKey);

  return `
export type ${outputTypeName} = ResultType<void>;

/**  */
export async function delete${typeName}(input: ${primaryKeyType}): Promise<${outputTypeName}> {
${ensureTableTemplate(tableName)}

  try {
    const commandInput: DeleteCommandInput = {
      ConditionExpression: 'attribute_exists(#pk)',
      ExpressionAttributeNames: {
        "#pk": "pk",
      },
      Key: ${objectToString(key)},
      ReturnConsumedCapacity: 'INDEXES',
      ReturnItemCollectionMetrics: 'SIZE',
      ReturnValues: 'NONE',
      TableName: tableName,
    };

    const {ConsumedCapacity: capacity, ItemCollectionMetrics: metrics} = await ddbDocClient.send(new DeleteCommand(commandInput));

    assert(capacity, 'Expected ConsumedCapacity to be returned. This is a bug in codegen.');

    return {
      capacity,
      item: undefined,
      metrics,
    }
  }
  catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      throw new NotFoundError('${typeName}', input);
    }
    ${handleCommonErrors()}
  }
}
`;
}
