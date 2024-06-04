import {assert} from '@code-like-a-carpenter/assert';
import type {
  Field,
  Model,
  TTLConfig,
} from '@code-like-a-carpenter/foundation-intermediate-representation';

import type {Config} from '../../config.ts';
import {filterNull} from '../../helpers.ts';

import {marshallField} from './helpers.ts';
import {
  indexHasField,
  indexToEANPart,
  indexToEAVPart,
  indexToUpdateExpressionPart,
} from './indexes.ts';

function wrapFieldNameWithQuotes({fieldName}: Field): string {
  return `'${fieldName}'`;
}

function makeTypeDefinition(
  typeName: string,
  requiredFields: readonly Field[],
  optionalFields: readonly Field[]
) {
  const rf = requiredFields.map(wrapFieldNameWithQuotes).sort().join('|');
  const of = optionalFields.map(wrapFieldNameWithQuotes).sort().join('|');

  let marshallType = `Required<Pick<${typeName}, ${rf}>>`;
  if (of.length) {
    marshallType += ` & Partial<Pick<${typeName}, ${of}>>`;
  }
  return marshallType;
}

/** Generates the marshall function for a table */
export function marshallTpl(
  config: Config,
  {fields, primaryKey, secondaryIndexes, ttlConfig, typeName}: Model
): string {
  const requiredFields = fields
    .filter((f) => f.isRequired && f.fieldName !== 'publicId')
    .filter(({fieldName}) => fieldName !== 'id');
  const optionalFields = fields.filter(
    (f) => !f.isRequired && f.fieldName !== 'publicId'
  );

  // These are fields that are required on the object but have overridable
  // default behaviors
  const requiredFieldsWithDefaultBehaviorsNames = [
    'version',
    ttlConfig?.fieldName,
  ].filter(filterNull);
  const requiredFieldsWithDefaultBehaviors = requiredFields.filter(
    ({fieldName}) => requiredFieldsWithDefaultBehaviorsNames.includes(fieldName)
  );

  // These are fields that are required on the object but have explicit,
  // non-overridable behaviors
  const builtinDateFieldNames = ['createdAt', 'updatedAt'];

  const normalRequiredFields = requiredFields.filter(
    ({fieldName}) =>
      !requiredFieldsWithDefaultBehaviorsNames.includes(fieldName) &&
      !builtinDateFieldNames.includes(fieldName)
  );

  const marshallType = makeTypeDefinition(typeName, normalRequiredFields, [
    ...optionalFields,
    ...requiredFieldsWithDefaultBehaviors,
  ]);

  const inputTypeName = `Marshall${typeName}Input`;

  return `
export interface Marshall${typeName}Output {
  ExpressionAttributeNames: Record<string, string>;
  ExpressionAttributeValues: Record<string, NativeAttributeValue>;
  UpdateExpression: string;
}

export type ${inputTypeName} = ${marshallType};


/** Marshalls a DynamoDB record into a ${typeName} object */
export function marshall${typeName}(input: ${inputTypeName}, now = new Date()): Marshall${typeName}Output {
  const updateExpression: string[] = [
  "#entity = :entity",
  ${requiredFields
    .filter(
      ({fieldName}) =>
        fieldName !== ttlConfig?.fieldName && fieldName !== 'createdAt'
    )
    .map(({fieldName}) => `'#${fieldName} = :${fieldName}',`)
    .join('\n')}
  ${secondaryIndexes
    .filter(({name}) => name !== 'publicId')
    .filter((index) => !indexHasField('createdAt', primaryKey, index))
    .map(indexToUpdateExpressionPart)
    .flat()
    .join('\n')}
  ];

  const ean: Record<string, string> = {
    "#entity": "_et",
    "#pk": "pk",
${requiredFields
  .filter(
    ({fieldName}) =>
      fieldName !== ttlConfig?.fieldName && fieldName !== 'createdAt'
  )
  .map(({columnName, fieldName}) => `'#${fieldName}': '${columnName}',`)
  .join('\n')}
${secondaryIndexes
  .filter(({name}) => name !== 'publicId')
  .filter((index) => !indexHasField('createdAt', primaryKey, index))
  .map((index) => indexToEANPart(config, index))
  .flat()
  .join('\n')}
  };

  const eav: Record<string, unknown> = {
    ":entity": "${typeName}",
    ${normalRequiredFields
      .map((field) => `':${field.fieldName}': ${marshallField(field)},`)
      .join('\n')}
    ':updatedAt': now.getTime(),
    ${requiredFieldsWithDefaultBehaviors
      .map(({fieldName}) => {
        if (fieldName === 'version') {
          return `':version': ('version' in input ? (input.version ?? 0) : 0) + 1,`;
        }
        if (fieldName === ttlConfig?.fieldName) {
          // do nothing because we're handling ttl later, but still keep the
          // conditional to avoid throwing down below.
          return '';
        }

        throw new Error(`No default behavior for field \`${fieldName}\``);
      })
      .filter(filterNull)
      .join('\n')}
${secondaryIndexes
  .filter(({name}) => name !== 'publicId')
  .filter((index) => !indexHasField('createdAt', primaryKey, index))
  .map((index) => indexToEAVPart('read', index))
  .flat()
  .join('\n')}
  };

  ${optionalFields
    // the TTL field will always be handled by renderTTL
    .filter(({fieldName}) => fieldName !== ttlConfig?.fieldName)
    .filter(({computeFunction}) => !computeFunction?.isVirtual)
    .map(
      (field) => `
  if ('${field.fieldName}' in input && typeof input.${
    field.fieldName
  } !== 'undefined') {
    ean['#${field.fieldName}'] = '${field.columnName}';
    eav[':${field.fieldName}'] = ${marshallField(field)};
    updateExpression.push('#${field.fieldName} = :${field.fieldName}');
  }
  `
    )
    .join('\n')};

  ${renderTTL(ttlConfig, fields)}

  updateExpression.sort();

  return {
    ExpressionAttributeNames: ean,
    ExpressionAttributeValues: eav,
    UpdateExpression: "SET " + updateExpression.join(", ")
  };
}

  `;
}

/** template helper */
function renderTTL(
  ttlConfig: TTLConfig | undefined,
  fields: readonly Field[]
): string {
  if (!ttlConfig) {
    return '';
  }

  const {argumentAllowed, argumentRequired, fieldName} = ttlConfig;

  const field = fields.find(({fieldName: f}) => f === fieldName);
  assert(field, `Field ${fieldName} not found`);

  if (argumentRequired) {
    return `
      assert(!Number.isNaN(input.${fieldName}.getTime()),'${fieldName} was passed but is not a valid date')
      ean['#${fieldName}'] = 'ttl';
      eav[':${fieldName}'] = ${marshallField(field)};
      updateExpression.push('#${fieldName} = :${fieldName}');
    `;
  }

  const defaultValue =
    'duration' in ttlConfig
      ? `now.getTime() + ${ttlConfig.duration}`
      : 'now.getTime()';

  if (!argumentAllowed) {
    return `
      ean['#${fieldName}'] = 'ttl';
      eav[':${fieldName}'] = Math.floor((${defaultValue})/1000);
      updateExpression.push('#${fieldName} = :${fieldName}');
    `;
  }

  return `
    ean['#${fieldName}'] = 'ttl';
    if ('${fieldName}' in input && typeof input.${fieldName} !== 'undefined' && input.${fieldName} !== null) {
      assert(!Number.isNaN(input.${fieldName}.getTime()),'${fieldName} was passed but is not a valid date')
      eav[':${fieldName}'] = ${marshallField(field)};
    }
    else {
      eav[':${fieldName}'] = Math.floor((${defaultValue})/1000);
    }
    updateExpression.push('#${fieldName} = :${fieldName}');
  `;
}
