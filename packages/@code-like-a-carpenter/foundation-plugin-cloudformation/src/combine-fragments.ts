import type {Model as ServerlessApplicationModel} from './__generated__/serverless-application-model';

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
    Globals: {...acc.Globals, ...next.Globals},
    Outputs: {...acc.Outputs, ...next.Outputs},
    Parameters: {...acc.Parameters, ...next.Parameters},
    Resources: {...acc.Resources, ...next.Resources},
  }));
}
