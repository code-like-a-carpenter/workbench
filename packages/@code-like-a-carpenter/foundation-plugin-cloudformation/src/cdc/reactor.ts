import type {
  ChangeDataCaptureReactorConfig,
  Model,
} from '@code-like-a-carpenter/foundation-intermediate-representation';

import type {Config} from '../config';
import {combineFragments} from '../fragments/combine-fragments';

import {makeHandler} from './lambdas';

/** Generates CDC config for a model */
export function defineReactor(
  config: Config,
  model: Model,
  cdc: ChangeDataCaptureReactorConfig
) {
  const {actionsModuleId, handlerModuleId, runtimeModuleId, sourceModelName} =
    cdc;

  const code = `// This file is generated. Do not edit by hand.

import {assert, makeReactor} from '${runtimeModuleId}';

import {handler as cdcHandler} from '${handlerModuleId}';
import {unmarshall${sourceModelName}} from '${actionsModuleId}';

export const handler = makeReactor((record) => {
  assert(record.dynamodb.NewImage, 'Expected DynamoDB Record to have a NewImage');
  return cdcHandler(unmarshall${sourceModelName}(record.dynamodb.NewImage));
});
`;

  return combineFragments(makeHandler(config, model, cdc, code));
}
