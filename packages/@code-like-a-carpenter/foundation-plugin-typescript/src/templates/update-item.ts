import type {Model} from '@code-like-a-carpenter/foundation-intermediate-representation';

import type {Config} from '../config';
import {
  ensureTableTemplate,
  filterNull,
  makeKeyTemplate,
  objectToString,
} from '../helpers';

import {handleCommonErrors} from './common';
import {getPrimaryKeyFields, pluckPrimaryKey} from './primary-key';

function inputTypeTemplate(model: Model) {
  const {isPublic, ttlConfig, typeName} = model;
  const inputTypeName = `Update${typeName}Input`;

  const fieldsToOmit = Array.from(
    new Set(
      ['createdAt', 'id', 'updatedAt', isPublic && 'publicId']
        .filter(filterNull)
        .filter(
          (fieldName) =>
            !getPrimaryKeyFields(model)
              .map((field) => field.fieldName)
              .includes(fieldName as string)
        )
        .map((f) => `'${f}'`)
    )
  )
    .sort()
    .join('|');

  if (ttlConfig) {
    return `export type ${inputTypeName} = Omit<${typeName}, ${fieldsToOmit}> & Partial<Pick<${typeName}, '${ttlConfig.fieldName}'>>`;
  }

  return `export type ${inputTypeName} = Omit<${typeName}, ${fieldsToOmit}>`;
}

function commandPayloadTemplate(config: Config, model: Model) {
  const key = makeKey(config, model);

  return `
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
`;
}

function makeKey(config: Config, model: Model) {
  const {primaryKey} = model;
  if (primaryKey.isComposite) {
    const doLegacy =
      config.legacyEmptySortFieldBehavior &&
      primaryKey.sortKeyFields.length === 0;
    return {
      pk: makeKeyTemplate(
        primaryKey.partitionKeyPrefix,
        primaryKey.partitionKeyFields,
        'read'
      ),
      sk: doLegacy
        ? `'${primaryKey.sortKeyPrefix}#0'`
        : makeKeyTemplate(
            primaryKey.sortKeyPrefix,
            primaryKey.sortKeyFields,
            'read'
          ),
    };
  }

  return {
    pk: makeKeyTemplate(
      primaryKey.partitionKeyPrefix,
      primaryKey.partitionKeyFields,
      'read'
    ),
  };
}

export function updateItemTpl(config: Config, model: Model) {
  const {typeName} = model;

  const inputTypeName = `Update${typeName}Input`;

  const outputTypeName = `Update${typeName}Output`;

  return `
${inputTypeTemplate(model)}
export type ${outputTypeName} = ResultType<${typeName}>

/**  */
export async function update${typeName}(input: Readonly<${inputTypeName}>): Promise<Readonly<${outputTypeName}>> {
${ensureTableTemplate(model.table.tableName)}

  const {ExpressionAttributeNames, ExpressionAttributeValues, UpdateExpression} = marshall${typeName}(input);
  try {
    let previousVersionCE = '';
    let previousVersionEAV = {};
    if ('version' in input && typeof input.version !== 'undefined') {
      previousVersionCE = '#version = :previousVersion AND ';
      previousVersionEAV = {':previousVersion': input.version,}
    }
   ${commandPayloadTemplate(config, model)}
    const {Attributes: item, ConsumedCapacity: capacity, ItemCollectionMetrics: metrics} = await ddbDocClient.send(new UpdateCommand(commandInput));

    assert(capacity, 'Expected ConsumedCapacity to be returned. This is a bug in codegen.');

    assert(item, 'Expected DynamoDB to return an Attributes prop.');
    assert(item._et === '${typeName}', () => new DataIntegrityError(\`Expected \${JSON.stringify(${pluckPrimaryKey(
    model
  )})} to update a ${typeName} but updated \${item._et} instead\`));

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
        throw new NotFoundError('${typeName}', ${pluckPrimaryKey(model)});
      }
      throw new OptimisticLockingError('${typeName}', ${pluckPrimaryKey(
    model
  )});
    }
    ${handleCommonErrors()}
  }
}`;
}
