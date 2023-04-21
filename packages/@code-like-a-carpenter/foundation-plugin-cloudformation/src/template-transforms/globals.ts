import {assert} from '@code-like-a-carpenter/assert';

import {isDispatcherStack, isHandlerStack} from '../stacks';
import type {ServerlessApplicationModel} from '../types';

type NestedStackType = 'cdc' | 'dispatcher';
type NestedStackTemplates = Record<NestedStackType, ServerlessApplicationModel>;
type Transform = (
  template: ServerlessApplicationModel,
  nestedTemplates: NestedStackTemplates
) => void | Promise<void>;

export const globalsTransform: Transform = (template, nestedTemplates) => {
  Object.entries(template.Resources)
    .filter(
      ([resourceName, resource]) =>
        resource.Type === 'AWS::Serverless::Application' &&
        (isDispatcherStack(resourceName) || isHandlerStack(resourceName))
    )
    .forEach(([, resource]) => {
      assert(
        resource.Type === 'AWS::Serverless::Application',
        'Resource must be a Serverless Application'
      );
      // Find any Refs in Globals...
      const refs = findRefs(template.Globals ?? {});

      // ...and add them to the Parameters of the nested stack
      Object.values(nestedTemplates).forEach((tpl) => {
        tpl.Parameters = tpl.Parameters ?? {};
        for (const ref of refs) {
          tpl.Parameters[ref] = {
            Type: 'String',
          };
        }

        // Copy the Globals into the nested stack
        tpl.Globals = template.Globals;
      });

      // Add the parameters to the resource
      assert(resource.Properties, 'Resource must have Properties');
      resource.Properties.Parameters = resource.Properties.Parameters ?? {};
      const Parameters = resource.Properties.Parameters as Record<
        string,
        string
      >;

      for (const ref of refs) {
        Parameters[ref] = `\${${ref}}`;
      }
    });
};

function findRefs(obj: object): readonly string[] {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      return acc.concat(findRefs(value));
    }
    if (key === 'Ref') {
      assert(typeof value === 'string', 'Ref value must be a string');
      return acc.concat([value]);
    }
    return acc;
  }, [] as string[]);
}
