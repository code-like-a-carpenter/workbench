import {fail} from '@code-like-a-carpenter/assert';
import type {
  Field,
  Model,
  PrimaryKey,
  SecondaryIndex,
} from '@code-like-a-carpenter/foundation-intermediate-representation';

import {
  ensureTableTemplate,
  getTypeScriptTypeForField,
  makeKeyTemplate,
  objectToString,
} from '../helpers';

import {handleCommonErrors} from './common';

function queryTemplate(model: Model) {
  const {
    consistent,
    secondaryIndexes,
    typeName,
    table: {tableName},
  } = model;
  const hasIndexes = secondaryIndexes.length > 0;
  const outputTypeName = `Query${typeName}Output`;

  return `
export async function query${typeName}(input: Readonly<Query${typeName}Input>, {limit = undefined, nextToken, operator = 'begins_with', reverse = false}: QueryOptions = {}): Promise<Readonly<${outputTypeName}>> {
  ${ensureTableTemplate(tableName)}

  const ExpressionAttributeNames = makeEanForQuery${typeName}(input);
  const ExpressionAttributeValues = makeEavForQuery${typeName}(input);
  const KeyConditionExpression = makeKceForQuery${typeName}(input, {operator});

  const commandInput: QueryCommandInput = {
    ConsistentRead: ${consistent ? `!('index' in input)` : 'false'},
    ExpressionAttributeNames,
    ExpressionAttributeValues,
    ExclusiveStartKey: nextToken,
    IndexName: ${
      hasIndexes ? `'index' in input ? input.index : undefined` : 'undefined'
    },
    KeyConditionExpression,
    Limit: limit,
    ReturnConsumedCapacity: 'INDEXES',
    ScanIndexForward: !reverse,
    TableName: tableName,
  };

  try {
    const {ConsumedCapacity: capacity, Items: items = [], LastEvaluatedKey: lastEvaluatedKey} = await ddbDocClient.send(new QueryCommand(commandInput));

    assert(capacity, 'Expected ConsumedCapacity to be returned. This is a bug in codegen.');

    return {
      capacity,
      hasNextPage: !!lastEvaluatedKey,
      items: items.map((item) => {
        assert(item._et === '${typeName}', () => new DataIntegrityError(\`Query result included at item with type \${item._et}. Only ${typeName} was expected.\`));
        return unmarshall${typeName}(item);
      }),
      nextToken: lastEvaluatedKey
    };
  }
  catch (err) {
    ${handleCommonErrors()}
  }
}`;
}

function byNodeIdTemplate(model: Model) {
  const {primaryKey, typeName} = model;
  const sortKeyFields = primaryKey.isComposite ? primaryKey.sortKeyFields : [];

  return `
/** queries the ${typeName} table by primary key using a node id */
export async function query${typeName}ByNodeId(id: Scalars['ID']): Promise<Readonly<Omit<ResultType<${typeName}>, 'metrics'>>> {
  const primaryKeyValues = Base64.decode(id).split(':').slice(1).join(':').split('#');

  const primaryKey: Query${typeName}Input = {
    ${primaryKey.partitionKeyFields
      .map(
        (field, index) =>
          `${field.fieldName}: ${fieldStringToFieldType(
            field,
            `primaryKeyValues[${index + 1}]`
          )},`
      )
      .join('\n')}
  ${sortKeyFields
    .map(
      (field, index) =>
        `${field.fieldName}: ${fieldStringToFieldType(
          field,
          `primaryKeyValues[${
            index + 1 + primaryKey.partitionKeyFields.length
          }]`
        )},`
    )
    .join('\n')}
  };

  const {capacity, items} = await query${typeName}(primaryKey);

  assert(items.length > 0, () => new NotFoundError('${typeName}', primaryKey));
  assert(items.length < 2, () => new DataIntegrityError(\`Found multiple ${typeName} with id \${id}\`));

  return {capacity, item: items[0]};
}
`;
}

function byPublicIdTemplate(model: Model) {
  const {isPublic, typeName} = model;
  if (!isPublic) {
    return '';
  }

  return `
/** queries the ${typeName} table by primary key using a node id */
export async function query${typeName}ByPublicId(publicId: Scalars['String']): Promise<Readonly<Omit<ResultType<${typeName}>, 'metrics'>>> {
  const {capacity, items} = await query${typeName}({index: 'publicId', publicId});

  assert(items.length > 0, () => new NotFoundError('${typeName}', {publicId}));
  assert(items.length < 2, () => new DataIntegrityError(\`Found multiple ${typeName} with publicId \${publicId}\`));

  return {capacity, item: items[0]};
}`;
}

export function queryTpl(model: Model): string {
  const {primaryKey, secondaryIndexes, typeName} = model;

  const inputTypeName = `Query${typeName}Input`;
  const outputTypeName = `Query${typeName}Output`;

  return `
export type ${inputTypeName} = ${makeTypeSignature(
    primaryKey,
    secondaryIndexes
  )};
export type ${outputTypeName} = MultiResultType<${typeName}>;

/** helper */
function makeEanForQuery${typeName}(input: ${inputTypeName}): Record<string, string> {
${eanForQuery(primaryKey, secondaryIndexes)}
}

/** helper */
function makeEavForQuery${typeName}(input: ${inputTypeName}): Record<string, any> {
${eavForQuery(primaryKey, secondaryIndexes)}
}

/** helper */
function makeKceForQuery${typeName}(input: ${inputTypeName}, {operator}: Pick<QueryOptions, 'operator'>): string {
${kceForQuery(primaryKey, secondaryIndexes)}
}

${queryTemplate(model)}

${byNodeIdTemplate(model)}

${byPublicIdTemplate(model)}

`;
}

/** helper */
function makeTypeSignature(
  primaryKey: PrimaryKey,
  secondaryIndexes: readonly SecondaryIndex[]
): string {
  return [primaryKey, ...secondaryIndexes]
    .map((index) => {
      // The double array allows spreading into the fromEntries call which
      // avoids undesirable "undefined" values.
      const name = 'name' in index ? [['index', `'${index.name}'`]] : [];

      if (index.type === 'primary' || index.type === 'gsi') {
        if (index.isComposite) {
          return [undefined, ...index.sortKeyFields]
            .map((_, i) =>
              Object.fromEntries([
                ...name,
                ...[
                  ...index.partitionKeyFields.map(getTypeScriptTypeForField),
                  ...index.sortKeyFields
                    .slice(0, i)
                    .map(getTypeScriptTypeForField),
                ].sort(),
              ])
            )
            .filter((o) => Object.keys(o).length > 0);
        }

        return Object.fromEntries([
          ...name,
          ...index.partitionKeyFields.map(getTypeScriptTypeForField).sort(),
        ]);
      }

      return [undefined, ...index.sortKeyFields].map((_, i) =>
        Object.fromEntries([
          ...name,
          ...[
            ...primaryKey.partitionKeyFields.map(getTypeScriptTypeForField),
            ...index.sortKeyFields.slice(0, i).map(getTypeScriptTypeForField),
          ].sort(),
        ])
      );
    })
    .flat()
    .map(objectToString)
    .join(' | ');
}

/** helper */
function fieldStringToFieldType(
  {isDateType, typeName}: Field,
  fragment: string
): string {
  if (isDateType) {
    return `new Date(${fragment})`;
  }

  if (typeName === 'Float' || typeName === 'Int') {
    return `Number(${fragment})`;
  }

  if (typeName === 'Boolean') {
    return `Boolean(${fragment})`;
  }

  if (typeName === 'String') {
    return fragment;
  }

  return `${fragment} as ${typeName}`;
}

/** helper */
function eanForQuery(
  primaryKey: PrimaryKey,
  secondaryIndexes: readonly SecondaryIndex[]
) {
  return `
  if ('index' in input) {
${secondaryIndexes
  .map(
    (index) => `if (input.index === '${index.name}') {
    return ${keyNames(index)}
  }`
  )
  .join('else\n')}
  throw new Error('Invalid index. If TypeScript did not catch this, then this is a bug in codegen.');
}
  else {
    return ${keyNames(primaryKey)}
  }

`;
}

/** helper */
function keyNames(key: PrimaryKey | SecondaryIndex): string {
  const {isComposite, type} = key;
  if (type === 'primary') {
    return isComposite ? `{'#pk': 'pk', '#sk': 'sk'}` : `{'#pk': 'pk'}`;
  }

  const {name} = key;
  if (type === 'gsi') {
    if (isComposite) {
      const {partitionKeyIsSingleField, sortKeyIsSingleField} = key;
      const pkName = partitionKeyIsSingleField ? name : `${name}pk`;
      const skName = sortKeyIsSingleField ? name : `${name}sk`;

      return `{'#pk': '${pkName}', '#sk': '${skName}'}`;
    }
    const {isSingleField} = key;
    const pkName = isSingleField ? name : `${name}pk`;
    return `{'#pk': '${pkName}'}`;
  }

  if (type === 'lsi') {
    const {sortKeyIsSingleField} = key;
    const skName = sortKeyIsSingleField ? name : `${name}sk`;
    return `{'#pk': 'pk', '#sk': '${skName}'}`;
  }

  fail(`Unexpected index type: ${type}`);
}

/** helper */
function eavForQuery(
  primaryKey: PrimaryKey,
  secondaryIndexes: readonly SecondaryIndex[]
) {
  return `
  if ('index' in input) {
${secondaryIndexes
  .map(
    (index) => `if (input.index === '${index.name}') {
    return ${keyValues(primaryKey, index)}
  }`
  )
  .join('else\n')}
  throw new Error('Invalid index. If TypeScript did not catch this, then this is a bug in codegen.');
  }
  else {
    return ${keyValues(primaryKey, primaryKey)}
  }

`;
}

/** helper */
function compositeKeyValues({
  pkPrefix,
  pkFields,
  skPrefix,
  skFields,
}: {
  pkPrefix: string | undefined;
  pkFields: readonly Field[];
  skPrefix: string | undefined;
  skFields: readonly Field[];
}) {
  const pkFragment = makeKeyTemplate(pkPrefix, pkFields, 'read');

  return `{
    ':pk': ${pkFragment},
    ':sk': makeSortKeyForQuery('${skPrefix}', [${skFields.map(
    ({fieldName}) => `'${fieldName}'`
  )}], input)
  }`;
}

/** helper */
function simpleKeyValues(
  keyPrefix: string | undefined,
  keyFields: readonly Field[]
) {
  return `{':pk': ${makeKeyTemplate(keyPrefix, keyFields, 'read')}}`;
}

/** helper */
function keyValues(primaryKey: PrimaryKey, key: PrimaryKey | SecondaryIndex) {
  if (key.type === 'lsi') {
    return compositeKeyValues({
      pkFields: primaryKey.partitionKeyFields,
      pkPrefix: primaryKey.partitionKeyPrefix,
      skFields: key.sortKeyFields,
      skPrefix: key.sortKeyPrefix,
    });
  }

  if (key.isComposite) {
    return compositeKeyValues({
      pkFields: key.partitionKeyFields,
      pkPrefix: key.partitionKeyPrefix,
      skFields: key.sortKeyFields,
      skPrefix: key.sortKeyPrefix,
    });
  }

  return simpleKeyValues(key.partitionKeyPrefix, key.partitionKeyFields);
}

/** helper */
function kceForQuery(
  primaryKey: PrimaryKey,
  secondaryIndexes: readonly SecondaryIndex[]
) {
  return `
  if ('index' in input) {
${secondaryIndexes
  .map(
    (index) => `if (input.index === '${index.name}') {
    return ${kce(index)}
  }`
  )
  .join('else\n')}
  throw new Error('Invalid index. If TypeScript did not catch this, then this is a bug in codegen.');
  }
  else {
    return ${kce(primaryKey)}
  }
`;
}

/** helper */
function kce(key: PrimaryKey | SecondaryIndex) {
  if (key.isComposite) {
    // eslint-disable-next-line no-template-curly-in-string
    return "`#pk = :pk AND ${operator === 'begins_with' ? 'begins_with(#sk, :sk)' : `#sk ${operator} :sk`}`";
  }

  return "'#pk = :pk'";
}
