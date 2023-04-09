import assert from 'assert';

import type {
  Field,
  Model,
} from '@code-like-a-carpenter/foundation-intermediate-representation';

/** Indicates if this model has any computed fields */
export function hasComputedFields(model: Model) {
  return model.fields.some((field) => !!field.computeFunction);
}

/**
 * Returns the input name for this model. If the model has computed fields,
 * it'll need to be renamed so that other templates can manipulate "input".
 */
export function inputName(model: Model) {
  return hasComputedFields(model) ? '_input' : 'input';
}

/**
 * Uses Object.defineProperty to add computed fields to `input` so that
 * order-of-access doesn't matter.
 */
export function defineComputedInputFields(
  fields: readonly Field[],
  typeName: string
) {
  const computedFields = fields
    .filter(({computeFunction}) => !!computeFunction)
    .map((field) => {
      const {fieldName, computeFunction} = field;
      assert(computeFunction);
      const {importName} = computeFunction;
      return `const ${fieldName}Provider = new ${importName}();

        Object.defineProperty(input, '${fieldName}', {
          enumerable: true,
          /** getter */
          get() {
            return ${fieldName}Provider.compute(this);
          }
        })`;
    })
    .join('\n');

  if (computedFields) {
    return `
      // This has to be cast because we're adding computed fields on the next
      // lines.
      const input: Marshall${typeName}Input = {..._input} as Marshall${typeName}Input
      ${computedFields}
    `;
  }
  return '';
}

/**
 * Uses Object.defineProperty to add computes fields to the database result  so
 * that order-of-access doesn't matter.
 */
export function defineComputedOutputFields(fields: readonly Field[]) {
  return fields
    .filter(({computeFunction}) => !!computeFunction)
    .map((field) => {
      const {fieldName, computeFunction} = field;
      assert(computeFunction);
      const {importName} = computeFunction;
      return `
        const ${fieldName}Provider = new ${importName}();

        Object.defineProperty(result, '${fieldName}', {
          enumerable: true,
          /** getter */
          get() {
            return ${fieldName}Provider.compute(this);
          }
        })
      `;
    })
    .join('\n');
}
