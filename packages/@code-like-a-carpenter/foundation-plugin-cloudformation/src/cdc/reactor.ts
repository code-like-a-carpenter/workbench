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
  const {
    actionsModuleId,
    handlerImportName,
    handlerModuleId,
    runtimeModuleId,
    sourceModelName,
  } = cdc;

  const code = `// This file is generated. Do not edit by hand.
import {expandEnvironmentVariables, makeReactor} from '${runtimeModuleId}';
import {${handlerImportName}} from '${handlerModuleId}';
import type {${sourceModelName}, unmarshall${sourceModelName}} from '${actionsModuleId}';

expandEnvironmentVariables();

export const handler = makeReactor<${sourceModelName}>(${handlerImportName}, {unmarshallSourceModel: unmarshall${sourceModelName}});
`;

  return combineFragments(makeHandler(config, model, cdc, code));
}
