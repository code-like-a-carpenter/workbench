import type {
  ChangeDataCaptureReactorConfig,
  Model,
} from '@code-like-a-carpenter/foundation-intermediate-representation';

import type {Config} from '../config.ts';
import {combineFragments} from '../fragments/combine-fragments.ts';
import type {ServerlessApplicationModel} from '../types.ts';

import {makeHandler} from './handler.ts';

/** Generates CDC config for a model */
export function defineReactor(
  config: Config,
  model: Model,
  cdc: ChangeDataCaptureReactorConfig
): {
  fragment: ServerlessApplicationModel;
  stack: ServerlessApplicationModel;
} {
  const {
    actionsModuleId,
    handlerImportName,
    handlerModuleId,
    runtimeModuleId,
    sourceModelName,
  } = cdc;

  const {dependenciesModuleId} = model.table;

  const code = `// This file is generated. Do not edit by hand.
import {makeReactor} from '${runtimeModuleId}';
import {${handlerImportName}} from '${handlerModuleId}';
import type {${sourceModelName}, unmarshall${sourceModelName}} from '${actionsModuleId}';
import * as dependencies from '${dependenciesModuleId}';

export const handler = makeReactor<${sourceModelName}>(${handlerImportName}, {unmarshallSourceModel: unmarshall${sourceModelName}}, dependencies);
`;

  const {fragment, stack} = makeHandler(config, model, cdc, code);

  return {fragment: combineFragments(fragment), stack};
}
