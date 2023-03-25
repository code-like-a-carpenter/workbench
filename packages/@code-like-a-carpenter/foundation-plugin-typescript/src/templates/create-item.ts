import type {Model} from '@code-like-a-carpenter/foundation-intermediate-representation';

import type {Config} from '../config';
import {
  ensureTableTemplate,
  filterNull,
  makeKeyTemplate,
  objectToString,
} from '../helpers';
import {
  indexToEANPart,
  indexToEAVPart,
  indexToUpdateExpressionPart,
} from '../indexes';

import {handleCommonErrors} from './common';

function inputTypeTemplate(model: Model) {
  const {fields, isPublic, ttlConfig, typeName} = model;
  const inputTypeName = `Create${typeName}Input`;

  const fieldsToOmit = [
    'createdAt',
    'id',
    'updatedAt',
    'version',
    isPublic && 'publicId',
    ...fields.map(({fieldName}) => fieldName),
  ]
    .filter(filterNull)
    .map((f) => `'${f}'`)
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
    // Reminder: we use UpdateCommand rather than PutCommand because PutCommand
    // cannot return the newly written values.
    const commandInput: UpdateCommandInput = {
      ConditionExpression: 'attribute_not_exists(#pk)',
      ExpressionAttributeNames: {
        ...ExpressionAttributeNames,
        '#createdAt': '_ct',
        ${model.secondaryIndexes.map(indexToEANPart).flat().join('\n')}
      },
      ExpressionAttributeValues: {
        ...ExpressionAttributeValues,
        ':createdAt': now.getTime(),
        ${model.secondaryIndexes
          .map((index) => indexToEAVPart('create', index))
          .flat()
          .join('\n')}
      },
      Key: ${objectToString(key)},
      ReturnConsumedCapacity: 'INDEXES',
      ReturnItemCollectionMetrics: 'SIZE',
      ReturnValues: 'ALL_NEW',
      TableName: tableName,
      UpdateExpression: [
        ...UpdateExpression.split(', '),
        '#createdAt = :createdAt',
        ${model.secondaryIndexes
          .map(indexToUpdateExpressionPart)
          .flat()
          .join('\n')}
      ].join(', ')
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
        'create'
      ),
      sk: doLegacy
        ? `'${primaryKey.sortKeyPrefix}#0'`
        : makeKeyTemplate(
            primaryKey.sortKeyPrefix,
            primaryKey.sortKeyFields,
            'create'
          ),
    };
  }

  return {
    pk: makeKeyTemplate(
      primaryKey.partitionKeyPrefix,
      primaryKey.partitionKeyFields,
      'create'
    ),
  };
}

export function createItemTpl(config: Config, model: Model) {
  const {isPublic, typeName} = model;
  const key = makeKey(config, model);

  const outputTypeName = `Create${model.typeName}Output`;

  return `
${inputTypeTemplate(model)}

export type ${outputTypeName} = ResultType<${model.typeName}>

export async function create${typeName}(input: Readonly<Create${typeName}Input>): Promise<Readonly<${outputTypeName}>> {
${ensureTableTemplate(model.table.tableName)}

  const now = new Date();

  const {ExpressionAttributeNames, ExpressionAttributeValues, UpdateExpression} = marshall${typeName}(input, now);

  ${isPublic ? `const publicId = idGenerator();` : ''}
  try {
    ${commandPayloadTemplate(config, model)}

    const {ConsumedCapacity: capacity, ItemCollectionMetrics: metrics, Attributes: item} = await ddbDocClient.send(new UpdateCommand(commandInput));

    assert(capacity, 'Expected ConsumedCapacity to be returned. This is a bug in codegen.');

    assert(item, 'Expected DynamoDB to return an Attributes prop.');
    assert(item._et === '${typeName}', () => new DataIntegrityError(\`Expected to write ${typeName} but wrote \${item?._et} instead\`));

    return {
      capacity,
      item: unmarshall${typeName}(item),
      metrics,
    }
  }
  catch (err) {
    if (err instanceof ConditionalCheckFailedException) {
      throw new AlreadyExistsError('${typeName}', ${objectToString(key)});
    }
    ${handleCommonErrors()}
  }
}`;
}
