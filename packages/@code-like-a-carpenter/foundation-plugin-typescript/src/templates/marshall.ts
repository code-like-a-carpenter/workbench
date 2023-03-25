import type {
  Field,
  Model,
  TTLConfig,
} from '@code-like-a-carpenter/foundation-intermediate-representation';

import {filterNull, marshallField} from '../helpers';
import {
  indexToEANPart,
  indexToEAVPart,
  indexToUpdateExpressionPart,
} from '../indexes';

/** helper */
function wrapFieldNameWithQuotes({fieldName}: Field): string {
  return `'${fieldName}'`;
}

/** helper */
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

function eanExpressionTemplate(model: Model): string {
  const {secondaryIndexes, ttlConfig} = model;
  const {requiredFields} = fieldInfo(model);

  return `
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
  .map(indexToEANPart)
  .flat()
  .sort()
  .join('\n')}
  };
`;
}

function eavExpressionTemplate(model: Model): string {
  const {secondaryIndexes, ttlConfig, typeName} = model;
  const {
    normalRequiredFields,
    optionalFields,
    requiredFieldsWithDefaultBehaviors,
  } = fieldInfo(model);

  return `
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
    .sort()
    .join('\n')}

${secondaryIndexes
  .filter(({name}) => name !== 'publicId')
  .map((index) => indexToEAVPart('read', index))
  .flat()
  .sort()
  .join('\n')}
  };

  ${optionalFields
    // the TTL field will always be handled by renderTTL
    .filter(({fieldName}) => fieldName !== ttlConfig?.fieldName)
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
  `;
}

function updateExpressionTemplate(model: Model): string {
  const {secondaryIndexes, ttlConfig} = model;
  const {requiredFields} = fieldInfo(model);

  return `
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
    .map(indexToUpdateExpressionPart)
    .flat()
    .join('\n')}
  ];
  `;
}

function fieldInfo(model: Model) {
  const {fields, ttlConfig} = model;

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

  return {
    normalRequiredFields,
    optionalFields,
    requiredFields,
    requiredFieldsWithDefaultBehaviors,
  };
}

/** Generates the marshall function for a table */
export function marshallTpl(model: Model): string {
  const {ttlConfig, typeName} = model;

  const {
    normalRequiredFields,
    optionalFields,
    requiredFieldsWithDefaultBehaviors,
  } = fieldInfo(model);

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
  ${updateExpressionTemplate(model)}
  ${eanExpressionTemplate(model)}
  ${eavExpressionTemplate(model)}

  ${renderTTL(ttlConfig)}

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
function renderTTL(ttlConfig: TTLConfig | undefined): string {
  if (!ttlConfig) {
    return '';
  }

  const {argumentAllowed, argumentRequired, fieldName} = ttlConfig;

  if (argumentRequired) {
    return `
      assert(!Number.isNaN(input.${fieldName}.getTime()),'${fieldName} was passed but is not a valid date')
      ean['#${fieldName}'] = 'ttl';
      eav[':${fieldName}'] = input.${fieldName}.getTime();
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
      eav[':${fieldName}'] = ${defaultValue};
      updateExpression.push('#${fieldName} = :${fieldName}');
    `;
  }

  return `
    ean['#${fieldName}'] = 'ttl';
    if ('${fieldName}' in input && typeof input.${fieldName} !== 'undefined') {
      assert(!Number.isNaN(input.${fieldName}.getTime()),'${fieldName} was passed but is not a valid date')
      eav[':${fieldName}'] = input.${fieldName}.getTime();
    }
    else {
      eav[':${fieldName}'] = ${defaultValue};
    }
    updateExpression.push('#${fieldName} = :${fieldName}');
  `;
}
