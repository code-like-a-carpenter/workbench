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

export function readItemTpl(config: Config, model: Model) {
  const {
    consistent,
    primaryKey,
    table: {tableName},
    typeName,
  } = model;
  const key = makeKey(config, primaryKey);
  const outputTypeName = `Read${typeName}Output`;
  const primaryKeyType = `${typeName}PrimaryKey`;

  return `
export type ${outputTypeName} = ResultType<${typeName}>;

/**  */
export async function read${typeName}(input: ${primaryKeyType}): Promise<Readonly<${outputTypeName}>> {
${ensureTableTemplate(tableName)}

  const commandInput: GetCommandInput = {
    ConsistentRead: ${consistent},
    Key: ${objectToString(key)},
    ReturnConsumedCapacity: 'INDEXES',
    TableName: tableName,
  };

  try {
    const {ConsumedCapacity: capacity, Item: item} = await ddbDocClient.send(new GetCommand(commandInput));

    assert(capacity, 'Expected ConsumedCapacity to be returned. This is a bug in codegen.');

    assert(item, () => new NotFoundError('${typeName}', input));
    assert(item._et === '${typeName}', () => new DataIntegrityError(\`Expected \${JSON.stringify(input)} to load a ${typeName} but loaded \${item._et} instead\`));

    return {
      capacity,
      item: unmarshall${typeName}(item),
      metrics: undefined,
    }
  }
  catch (err) {
    ${handleCommonErrors()}
  }
}`;
}
