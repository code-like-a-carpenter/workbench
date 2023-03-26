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
import {defineComputedInputFields, inputName} from './computed-fields';

function inputTypeTemplate(model: Model) {
  const {fields, isPublic, ttlConfig, typeName} = model;

  const inputTypeName = `BlindWrite${typeName}Input`;
  const fieldsToOmit = [
    'createdAt',
    'id',
    'updatedAt',
    'version',
    isPublic && 'publicId',
    ttlConfig?.fieldName,
    ...fields
      .filter(({computeFunction}) => !!computeFunction)
      .map(({fieldName}) => fieldName),
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
  const {isPublic} = model;
  const key = makeKey(config, model);

  return `

  delete ExpressionAttributeNames['#pk'];
  delete ExpressionAttributeValues[':version'];

  const ean ={
    ...ExpressionAttributeNames,
    '#createdAt': '_ct',
    ${isPublic ? "'#publicId': 'publicId'," : ''}
    ${model.secondaryIndexes.map(indexToEANPart).flat().join('\n')}
  }
  const eav = {
    ...ExpressionAttributeValues, ':one': 1,
    ':createdAt': now.getTime(),
    ${isPublic ? "':publicId': idGenerator()," : ''}
    ${model.secondaryIndexes
      .map((index) => indexToEAVPart('blind', index))
      .flat()
      .join('\n')}
  };
  const ue = [
    ...UpdateExpression
      .split(', ')
      .filter((e) => !e.startsWith('#version')),
    '#createdAt = if_not_exists(#createdAt, :createdAt)',
    ${isPublic ? "'#publicId = if_not_exists(#publicId, :publicId)'," : ''}
    ${model.secondaryIndexes.map(indexToUpdateExpressionPart).flat().join('\n')}
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
        'blind'
      ),
      sk: doLegacy
        ? `'${primaryKey.sortKeyPrefix}#0'`
        : makeKeyTemplate(
            primaryKey.sortKeyPrefix,
            primaryKey.sortKeyFields,
            'blind'
          ),
    };
  }

  return {
    pk: makeKeyTemplate(
      primaryKey.partitionKeyPrefix,
      primaryKey.partitionKeyFields,
      'blind'
    ),
  };
}

/** template */
export function blindWriteTpl(config: Config, model: Model) {
  const {
    fields,
    table: {tableName},
    typeName,
  } = model;

  const outputTypeName = `BlindWrite${typeName}Output`;

  return `
${inputTypeTemplate(model)}

export type ${outputTypeName} = ResultType<${typeName}>;
/** */
export async function blindWrite${typeName}(${inputName(
    model
  )}: Readonly<BlindWrite${typeName}Input>): Promise<Readonly<${outputTypeName}>> {
${ensureTableTemplate(tableName)}
  const now = new Date();
${defineComputedInputFields(fields, typeName)}
  const {ExpressionAttributeNames, ExpressionAttributeValues, UpdateExpression} = marshall${typeName}(input, now);

  ${commandPayloadTemplate(config, model)}

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
