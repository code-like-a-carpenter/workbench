import type {Model} from '@code-like-a-carpenter/foundation-intermediate-representation';

import {defineComputedOutputFields} from '../computed-fields.ts';

import {unmarshallField} from './helpers.ts';

export const DIVIDER = '#:#';

/** Generates the unmarshall function for a table */
export function unmarshallTpl({fields, primaryKey, typeName}: Model): string {
  const requiredFields = fields
    .filter((f) => f.isRequired)
    .filter(({computeFunction}) => !computeFunction?.isVirtual);
  const optionalFields = fields
    .filter((f) => !f.isRequired)
    .filter(({computeFunction}) => !computeFunction?.isVirtual);

  return `
/** Unmarshalls a DynamoDB record into a ${typeName} object */
export function unmarshall${typeName}(item: Record<string, any>): ${typeName} {

  let result: ${typeName} = {
${requiredFields.map((field) => {
  // This isn't ideal, but it'll work for now. I need a better way to deal
  // with simple primary keys and Nodes
  if (field.fieldName === 'id') {
    if (primaryKey.isComposite) {
      return `id: Base64.encode(\`${typeName}:\${item.pk}${DIVIDER}\${item.sk}\`)`;
    }
    return `id: Base64.encode(\`${typeName}:\${item.pk}\`)`;
  }
  return unmarshallField(field);
})}
  };

${optionalFields
  .map((field) => {
    if (field.isDateType) {
      return `  if (${field.columnNamesForRead
        .map((c) => `('${c}' in item) && item.${c} !== null`)
        .join('||')}) {
    result = {
      ...result,
      ${unmarshallField(field)}
    }
  }`;
    }

    return `  if (${field.columnNamesForRead
      .map((c) => `('${c}' in item)`)
      .join('||')}) {
    result = {
      ...result,
      ${unmarshallField(field)}
    }
  }`;
  })
  .join('\n')}

  ${defineComputedOutputFields(fields)}

  return result;
}
`;
}
