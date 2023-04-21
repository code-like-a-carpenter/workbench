import {snakeCase} from 'lodash';

import {assert} from '@code-like-a-carpenter/assert';
import type {Transform} from '@code-like-a-carpenter/foundation-plugin-cloudformation';
import {
  isDispatcherStack,
  isHandlerStack,
} from '@code-like-a-carpenter/foundation-plugin-cloudformation';

export const transform: Transform = (ir, template, nestedTemplates) => {
  const nestedVars: Record<string, {Ref: string}> = {};
  const nestedParams: Record<string, {Type: 'String'}> = {};
  const params: Record<string, unknown> = {};

  const {tables} = ir;

  tables.forEach(({tableName}) => {
    params[tableName] = {Ref: tableName};
    nestedParams[tableName] = {
      Type: 'String',
    };

    nestedVars[snakeCase(tableName).toUpperCase()] = {
      Ref: tableName,
    };
  });

  for (const tpl of nestedTemplates.values()) {
    tpl.Globals = {
      ...tpl.Globals,
      Function: {
        ...tpl.Globals?.Function,
        Environment: {
          ...(tpl.Globals?.Function?.Environment ?? {}),
          Variables: {
            // @ts-expect-error - typedef does not include Variables
            ...tpl.Globals?.Function?.Environment?.Variables,
            ...nestedVars,
          },
        },
      },
    };
    tpl.Parameters = {
      ...tpl.Parameters,
      ...nestedParams,
    };
  }

  Object.entries(template.Resources)
    .filter(([, resource]) => resource.Type === 'AWS::Serverless::Application')
    .filter(
      ([resourceName]) =>
        isDispatcherStack(resourceName) || isHandlerStack(resourceName)
    )
    .forEach(([, resource]) => {
      assert(
        resource.Type === 'AWS::Serverless::Application',
        'Expected resource to be a Serverless Application'
      );
      assert(resource.Properties, 'Expected resource to have properties');

      const existing = resource.Properties.Parameters ?? {};

      resource.Properties.Parameters = {
        ...existing,
        ...params,
      };
    });
};
