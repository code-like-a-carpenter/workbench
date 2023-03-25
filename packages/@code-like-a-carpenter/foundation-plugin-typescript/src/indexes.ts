import {fail} from '@code-like-a-carpenter/assert';
import type {SecondaryIndex} from '@code-like-a-carpenter/foundation-intermediate-representation';

import {makeKeyTemplate} from './helpers';

export function indexToEANPart(index: SecondaryIndex) {
  const {name, type} = index;

  if (type === 'gsi') {
    const {isComposite} = index;
    if (isComposite) {
      const {partitionKeyIsSingleField, sortKeyIsSingleField} = index;
      const pkName = partitionKeyIsSingleField ? name : `${name}pk`;
      const skName = sortKeyIsSingleField ? name : `${name}sk`;

      return [`'#${pkName}': '${pkName}',`, `'#${skName}': '${skName}',`];
    }
    const {isSingleField} = index;
    const pkName = isSingleField ? name : `${name}pk`;
    return [`'#${pkName}': '${pkName}',`];
  }

  if (type === 'lsi') {
    const {sortKeyIsSingleField} = index;
    const skName = sortKeyIsSingleField ? name : `${name}sk`;
    return [`'#${skName}': '${skName}',`];
  }

  fail(`Unexpected index type: ${type}`);
}

export function indexToEAVPart(
  mode: 'blind' | 'create' | 'read',
  index: SecondaryIndex
) {
  const {name, type} = index;
  if (type === 'gsi') {
    const {isComposite} = index;
    if (isComposite) {
      const {partitionKeyIsSingleField, sortKeyIsSingleField} = index;
      const pkName = partitionKeyIsSingleField ? name : `${name}pk`;
      const skName = sortKeyIsSingleField ? name : `${name}sk`;
      return [
        `':${pkName}': ${makeKeyTemplate(
          index.partitionKeyPrefix,
          index.partitionKeyFields,
          mode
        )},`,
        `':${skName}': ${makeKeyTemplate(
          index.sortKeyPrefix,
          index.sortKeyFields,
          mode
        )},`,
      ];
    }

    const {isSingleField} = index;

    const pkName = isSingleField ? name : `${name}pk`;
    return [
      `':${pkName}': ${makeKeyTemplate(
        index.partitionKeyPrefix,
        index.partitionKeyFields,
        mode
      )},`,
    ];
  }

  if (type === 'lsi') {
    const {sortKeyIsSingleField} = index;
    const skName = sortKeyIsSingleField ? name : `${name}sk`;
    return [
      `':${skName}': ${makeKeyTemplate(
        index.sortKeyPrefix,
        index.sortKeyFields,
        mode
      )},`,
    ];
  }
  fail(`Unexpected index type: ${type}`);
}

export function indexToUpdateExpressionPart(index: SecondaryIndex) {
  const {name, type} = index;
  if (type === 'gsi') {
    const expressions = [];
    const {isComposite} = index;
    if (isComposite) {
      const {partitionKeyIsSingleField, sortKeyIsSingleField} = index;
      if (!partitionKeyIsSingleField) {
        expressions.push(`#${name}pk = :${name}pk`);
      }
      if (!sortKeyIsSingleField) {
        expressions.push(`#${name}sk = :${name}sk`);
      }
    } else {
      const {isSingleField} = index;
      if (!isSingleField) {
        expressions.push(`#${name}pk = :${name}pk`);
      }
    }
    return [];
  }
  if (type === 'lsi') {
    const {sortKeyIsSingleField} = index;
    if (sortKeyIsSingleField) {
      return [];
    }
    return [`'#${name}sk = :${name}sk',`];
  }
  fail(`Unexpected index type: ${type}`);
}
