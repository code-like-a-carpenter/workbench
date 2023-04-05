import type {
  ChangeDataCaptureTriggerConfig,
  Model,
} from '@code-like-a-carpenter/foundation-intermediate-representation';

import type {Config} from '../config';
import {combineFragments} from '../fragments/combine-fragments';

import {makeHandler} from './lambdas';

/** Generates CDC config for a model */
export function defineTriggerCdc(
  config: Config,
  model: Model,
  cdc: ChangeDataCaptureTriggerConfig
) {
  const {actionsModuleId, handlerModuleId, runtimeModuleId, sourceModelName} =
    cdc;

  const code = `// This file is generated. Do not edit by hand.

import {assert, makeTriggerHandler} from '${runtimeModuleId}';

import {handler as cdcHandler} from '${handlerModuleId}';
import {unmarshall${sourceModelName}} from '${actionsModuleId}';

export const handler = makeTriggerHandler((record) => {
  assert(record.dynamodb.NewImage, 'Expected DynamoDB Record to have a NewImage');
  return cdcHandler(unmarshall${sourceModelName}(record.dynamodb.NewImage));
});
`;

  return combineFragments(makeHandler(config, model, cdc, code));
}
