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
  }));
}
