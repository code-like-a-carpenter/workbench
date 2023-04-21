import {filterNull} from '../helpers';
import type {ServerlessApplicationModel} from '../types';

/** Combines multiple fragments into a single fragment. */
export function combineFragments(
  ...fragments: readonly ServerlessApplicationModel[]
): ServerlessApplicationModel {
  if (fragments.length === 0) {
    return {
      Resources: {},
    };
  }

  return fragments.reduce((acc, next) => ({
    AWSTemplateFormatVersion:
      acc.AWSTemplateFormatVersion ?? next.AWSTemplateFormatVersion,
    Conditions: {...acc.Conditions, ...next.Conditions},
    Globals: {
      ...acc.Globals,
      ...next.Globals,
      Function: {
        ...acc.Globals?.Function,
        ...next.Globals?.Function,
        Environment: {
          // @ts-expect-error - typedef treats `Environment` as `unknown`
          ...acc.Globals?.Function?.Environment,
          // @ts-expect-error - typedef treats `Environment` as `unknown`
          ...next.Globals?.Function?.Environment,
          Variables: {
            // @ts-expect-error - typedef treats `Environment` as `unknown`
            ...acc.Globals?.Function?.Environment?.Variables,
            // @ts-expect-error - typedef treats `Environment` as `unknown`
            ...next.Globals?.Function?.Environment?.Variables,
          },
        },
      },
    },
    Outputs: {...acc.Outputs, ...next.Outputs},
    Parameters: {...acc.Parameters, ...next.Parameters},
    Resources: {...acc.Resources, ...next.Resources},
    Transform: combineTransforms(acc.Transform, next.Transform),
  }));
}

function combineTransforms(
  left: string | readonly string[] | undefined,
  right: string | readonly string[] | undefined
): string | string[] | undefined {
  left = Array.isArray(left) ? left : [left];
  right = Array.isArray(right) ? right : [right];

  const items = Array.from(new Set([...left, ...right])).filter(filterNull);

  if (items.length === 0) {
    return undefined;
  }

  if (items.length === 1) {
    return items[0];
  }

  return items;
}
