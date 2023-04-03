import assert from 'assert';

import type {ConstArgumentNode, ConstDirectiveNode} from 'graphql';

import type {
  HandlerConfig,
  LambdaConfig,
} from '@code-like-a-carpenter/foundation-intermediate-representation';

import type {Config} from '../config';
import {getOptionalArg} from '../helpers';

/** Extracts common lambda config from a directive argument */
export function extractLambdaConfig(
  config: Config,
  arg: ConstArgumentNode
): LambdaConfig {
  assert(arg.value.kind === 'ObjectValue');
  const field = arg.value.fields.find((f) => f.name.value === 'lambdaConfig');
  if (!field) {
    return config.lambdaDefaults;
  }

  assert(field.value.kind === 'ObjectValue');
  const values = field.value.fields
    .filter((f) => f.value.kind !== 'ObjectValue')
    .map((f) => {
      assert(f.value.kind !== 'ObjectValue');
      assert(f.value.kind === 'IntValue');
      return f.value.value;
    });

  return {
    ...config.lambdaDefaults,
    ...values,
  };
}

export function extractHandlerConfig(
  config: Config,
  directive: ConstDirectiveNode
): HandlerConfig {
  const arg = getOptionalArg('handlerConfig', directive);
  if (!arg) {
    return config.handlerDefaults;
  }

  assert(arg.value.kind === 'ObjectValue');
  return {
    ...config.handlerDefaults,
    ...extractLambdaConfig(config, arg),
  };
}
