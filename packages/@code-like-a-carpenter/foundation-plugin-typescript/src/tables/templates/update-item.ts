import type {Model} from '@code-like-a-carpenter/foundation-intermediate-representation';

import type {Config} from '../../config.ts';
import {filterNull} from '../../helpers.ts';
import {defineComputedInputFields, inputName} from '../computed-fields.ts';

import {ensureTableTemplate} from './ensure-table.ts';
import {handleCommonErrors, makeKeyForRead, objectToString} from './helpers.ts';

/**
 * Generates the updateItem function for a table
 */
export function updateItemTemplate(config: Config, model: Model) {
  const {
    fields,
    isPublic: hasPublicId,
    primaryKey,
    table: {tableName},
    ttlConfig,
    typeName,
  } = model;
  const key = makeKeyForRead(config, primaryKey);
  const marshallPrimaryKey = objectToString(
    Object.fromEntries(
      (primaryKey.isComposite
        ? [...primaryKey.partitionKeyFields, ...primaryKey.sortKeyFields]
        : primaryKey.partitionKeyFields
      )
        .map(({fieldName}) => fieldName)
        .sort()
        .map((fieldName) => [fieldName, `input.${fieldName}`])
    )
  );
  const primaryKeyFields = (
    primaryKey.isComposite
      ? [...primaryKey.partitionKeyFields, ...primaryKey.sortKeyFields]
      : primaryKey.partitionKeyFields
  ).map(({fieldName}) => fieldName);

  const inputTypeName = `Update${typeName}Input`;
  const omitInputFields = [
    'id',
    'createdAt',
    'updatedAt',
    hasPublicId && 'publicId',
    ttlConfig?.fieldName,
    ...fields
      .filter(({computeFunction}) => !!computeFunction)
      .map(({fieldName}) => fieldName),
  ]
    .filter(filterNull)
    .filter((fieldName) => !primaryKeyFields.includes(fieldName as string))
    .map((f) => `'${f}'`)
    .sort();
  const outputTypeName = `Update${typeName}Output`;

  return `
export type ${inputTypeName} = Omit<${typeName}, ${omitInputFields.join(
    '|'
  )}> ${
    ttlConfig ? ` & Partial<Pick<${typeName}, '${ttlConfig.fieldName}'>>` : ''
  };
export type ${outputTypeName} = ResultType<${typeName}>

/**  */
export async function update${typeName}(${inputName(
    model
  )}: Readonly<${inputTypeName}>): Promise<Readonly<${outputTypeName}>> {
${ensureTableTemplate(tableName)}
  ${defineComputedInputFields(fields, typeName)}
  const {ExpressionAttributeNames, ExpressionAttributeValues, UpdateExpression} = marshall${typeName}(input);
  try {
    let previousVersionCE = '';
    let previousVersionEAV = {};
    if ('version' in input && typeof input.version !== 'undefined') {
      previousVersionCE = '#version = :previousVersion AND ';
      previousVersionEAV = {':previousVersion': input.version,}
    }
    const commandInput: UpdateCommandInput = {
      ConditionExpression: \`\${previousVersionCE}#entity = :entity AND attribute_exists(#pk)\`,
      ExpressionAttributeNames,
      ExpressionAttributeValues: {
        ...ExpressionAttributeValues,
        ...previousVersionEAV
      },
      Key: ${objectToString(key)},
      ReturnConsumedCapacity: 'INDEXES',
      ReturnItemCollectionMetrics: 'SIZE',
      ReturnValues: 'ALL_NEW',
      TableName: tableName,
      UpdateExpression,
    };

    const {Attributes: item, ConsumedCapacity: capacity, ItemCollectionMetrics: metrics} = await ddbDocClient.send(new UpdateCommand(commandInput));

    assert(capacity, 'Expected ConsumedCapacity to be returned. This is a bug in codegen.');

    assert(item, 'Expected DynamoDB to return an Attributes prop.');
    assert(item._et === '${typeName}', () => new DataIntegrityError(\`Expected \${JSON.stringify(${marshallPrimaryKey})} to update a ${typeName} but updated \${item._et} instead\`));

    return {
      capacity,
      item: unmarshall${typeName}(item),
      metrics,
    }
  }
  catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      try {
        await read${typeName}(input);
      }
      catch {
        throw new NotFoundError('${typeName}', ${marshallPrimaryKey});
      }
      throw new OptimisticLockingError('${typeName}', ${marshallPrimaryKey});
    }
    ${handleCommonErrors()}
  }
}`;
}
