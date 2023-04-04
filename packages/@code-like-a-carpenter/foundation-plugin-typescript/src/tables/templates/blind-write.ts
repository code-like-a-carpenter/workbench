import type {
  Model,
  PrimaryKeyConfig,
} from '@code-like-a-carpenter/foundation-intermediate-representation';

import type {Config} from '../../config';
import {filterNull} from '../../helpers';
import {defineComputedInputFields, inputName} from '../computed-fields';

import {ensureTableTemplate} from './ensure-table';
import {handleCommonErrors, makeKeyTemplate, objectToString} from './helpers';
import {
  indexHasField,
  indexToEANPart,
  indexToEAVPart,
  indexToUpdateExpressionPart,
} from './indexes';

/**
 * Generates the createItem function for a table
 */
export function blindWriteTemplate(config: Config, model: Model) {
  const {
    fields,
    isPublicModel: hasPublicId,
    primaryKey,
    tableName,
    ttlConfig,
    typeName,
  } = model;
  const key = makeKeyForBlind(config, primaryKey);

  const inputTypeName = `BlindWrite${typeName}Input`;
  const omitInputFields = [
    'createdAt',
    'id',
    'updatedAt',
    'version',
    hasPublicId && 'publicId',
    ttlConfig?.fieldName,
    ...fields
      .filter(({computeFunction}) => !!computeFunction)
      .map(({fieldName}) => fieldName),
  ]
    .filter(filterNull)
    .map((f) => `'${f}'`)
    .sort();
  const outputTypeName = `BlindWrite${typeName}Output`;

  return `
export type ${inputTypeName} = Omit<${typeName}, ${omitInputFields.join(
    '|'
  )}> ${
    ttlConfig ? ` & Partial<Pick<${typeName}, '${ttlConfig.fieldName}'>>` : ''
  } & Partial<Pick<${typeName}, 'createdAt'>>

export type ${outputTypeName} = ResultType<${typeName}>;
/** */
export async function blindWrite${typeName}(${inputName(
    model
  )}: Readonly<${inputTypeName}>): Promise<Readonly<${outputTypeName}>> {
${ensureTableTemplate(tableName)}
  const now = new Date();
  ${defineComputedInputFields(fields, typeName)}
  const {ExpressionAttributeNames, ExpressionAttributeValues, UpdateExpression} = marshall${typeName}(input, now);

  delete ExpressionAttributeNames['#pk'];
  delete ExpressionAttributeValues[':version'];

  const ean ={
    ...ExpressionAttributeNames,
    '#createdAt': '_ct',
    ${hasPublicId ? "'#publicId': 'publicId'," : ''}
    ${model.secondaryIndexes
      .filter((index) => indexHasField('createdAt', model.primaryKey, index))
      .map((index) => indexToEANPart(config, index))
      .flat()
      .join('\n')}
  }
  const eav = {
    ...ExpressionAttributeValues, ':one': 1,
    ':createdAt': now.getTime(),
    ${hasPublicId ? "':publicId': idGenerator()," : ''}
    ${model.secondaryIndexes
      .filter((index) => indexHasField('createdAt', model.primaryKey, index))
      .map((index) => indexToEAVPart('blind', index))
      .flat()
      .join('\n')}
  };
  const ue = [
    ...UpdateExpression
      .split(', ')
      .filter((e) => !e.startsWith('#version')),
    '#createdAt = if_not_exists(#createdAt, :createdAt)',
    ${hasPublicId ? "'#publicId = if_not_exists(#publicId, :publicId)'," : ''}
    ${model.secondaryIndexes
      .filter((index) => indexHasField('createdAt', model.primaryKey, index))
      .map(indexToUpdateExpressionPart)
      .flat()
      .join('\n')}
  ].join(', ') + ' ADD #version :one';

  const commandInput: UpdateCommandInput = {
    ExpressionAttributeNames: ean,
    ExpressionAttributeValues: eav,
    Key: ${objectToString(key)},
    ReturnConsumedCapacity: 'INDEXES',
    ReturnItemCollectionMetrics: 'SIZE',
    ReturnValues: 'ALL_NEW',
    TableName: tableName,
    UpdateExpression: ue,
  }

  try {
    const {ConsumedCapacity: capacity, ItemCollectionMetrics: metrics, Attributes: item} = await ddbDocClient.send(new UpdateCommand(commandInput));

    assert(capacity, 'Expected ConsumedCapacity to be returned. This is a bug in codegen.');

    assert(item, 'Expected DynamoDB ot return an Attributes prop.');
    assert(item._et === '${typeName}', () => new DataIntegrityError(\`Expected to write ${typeName} but wrote \${item?._et} instead\`));

    return {
      capacity,
      item: unmarshall${typeName}(item),
      metrics,
    }
  }
  catch (err) {
    ${handleCommonErrors()}
  }
}
`;
}

export function makeKeyForBlind(
  config: Config,
  key: PrimaryKeyConfig
): Record<string, string> {
  if (key.isComposite) {
    const doLegacy =
      config.legacyEmptySortFieldBehavior && key.sortKeyFields.length === 0;
    return {
      pk: makeKeyTemplate(
        key.partitionKeyPrefix,
        key.partitionKeyFields,
        'blind'
      ),
      sk: doLegacy
        ? `'${key.sortKeyPrefix}#0'`
        : makeKeyTemplate(key.sortKeyPrefix, key.sortKeyFields, 'blind'),
    };
  }

  return {
    pk: makeKeyTemplate(
      key.partitionKeyPrefix,
      key.partitionKeyFields,
      'blind'
    ),
  };
}
