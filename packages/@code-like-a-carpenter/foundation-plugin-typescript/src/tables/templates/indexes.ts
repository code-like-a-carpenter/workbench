import type {
  PrimaryKeyConfig,
  SecondaryIndex,
} from '@code-like-a-carpenter/foundation-intermediate-representation';

import type {Config} from '../../config.ts';

import {makeKeyTemplate} from './helpers.ts';

/** Indicates if an index contains a particular field name */
export function indexHasField(
  name: string,
  primaryKey: PrimaryKeyConfig,
  index: SecondaryIndex
) {
  if (index.type === 'lsi') {
    return (
      primaryKey.partitionKeyFields.some((field) => field.fieldName === name) ||
      index.sortKeyFields.some((field) => field.fieldName === name)
    );
  }

  if (index.isComposite) {
    return (
      index.partitionKeyFields.some((field) => field.fieldName === name) ||
      index.sortKeyFields.some((field) => field.fieldName === name)
    );
  }

  return index.partitionKeyFields.some((field) => field.fieldName === name);
}

export function indexToUpdateExpressionPart(index: SecondaryIndex) {
  const fields = [];
  const {type} = index;
  if (type === 'gsi') {
    const {isComposite} = index;
    if (index.name !== index.partitionKeyName) {
      fields.push(index.partitionKeyName);
    }
    if (isComposite) {
      if (index.name !== index.sortKeyName) {
        fields.push(index.sortKeyName);
      }
    }
  }
  if (type === 'lsi') {
    if (index.name !== index.sortKeyName) {
      fields.push(index.sortKeyName);
    }
  }
  return fields.map((field) => `'#${field} = :${field}',`);
}

export function indexToEAVPart(
  mode: 'blind' | 'create' | 'read',
  index: SecondaryIndex
) {
  const fields = [];
  const {type} = index;
  if (type === 'gsi') {
    const {isComposite} = index;
    if (index.name !== index.partitionKeyName) {
      fields.push(
        `':${index.partitionKeyName}': ${makeKeyTemplate(
          index.partitionKeyPrefix,
          index.partitionKeyFields,
          mode
        )},`
      );
    }
    if (isComposite) {
      if (index.name !== index.sortKeyName) {
        fields.push(
          `':${index.sortKeyName}': ${makeKeyTemplate(
            index.sortKeyPrefix,
            index.sortKeyFields,
            mode
          )},`
        );
      }
    }
  }

  if (type === 'lsi') {
    fields.push(
      `':${index.sortKeyName}': ${makeKeyTemplate(
        index.sortKeyPrefix,
        index.sortKeyFields,
        mode
      )},`
    );
  }
  return fields;
}

export function indexToEANPart(config: Config, index: SecondaryIndex) {
  const fields = [];
  const {type} = index;
  if (type === 'gsi') {
    const {isComposite} = index;
    if (index.name !== index.partitionKeyName) {
      fields.push(index.partitionKeyName);
    }
    if (isComposite) {
      if (index.name !== index.sortKeyName) {
        fields.push(index.sortKeyName);
      }
    }
  }
  if (type === 'lsi') {
    if (index.name !== index.sortKeyName) {
      fields.push(index.sortKeyName);
    }
  }
  return fields.map((field) => `'#${field}': '${field}',`);
}
