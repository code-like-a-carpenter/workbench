import type {Model} from '@code-like-a-carpenter/foundation-intermediate-representation';

import type {Config} from '../../config';

import {ensureTableTemplate} from './ensure-table';
import {handleCommonErrors, makeKeyForRead, objectToString} from './helpers';

/**
 * Generates the deleteItem function for a table
 */
export function deleteItemTemplate(config: Config, model: Model) {
  const {tableName, typeName} = model;
  const key = makeKeyForRead(config, model.primaryKey);

  const outputTypeName = `Delete${typeName}Output`;
  const primaryKeyType = `${typeName}PrimaryKey`;

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
