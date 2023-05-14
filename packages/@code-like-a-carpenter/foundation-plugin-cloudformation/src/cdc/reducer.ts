import type {
  ChangeDataCaptureReducerConfig,
  Model,
} from '@code-like-a-carpenter/foundation-intermediate-representation';

import type {Config} from '../config';
import {combineFragments} from '../fragments/combine-fragments';
import type {ServerlessApplicationModel} from '../types';

import {makeHandler} from './handler';

/** Generates CDC config for a model */
export function defineReducer(
  config: Config,
  model: Model,
  cdc: ChangeDataCaptureReducerConfig
): {
  fragment: ServerlessApplicationModel;
  stack: ServerlessApplicationModel;
} {
  const {
    actionsModuleId,
    handlerImportName,
    handlerModuleId,
    multiReduce,
    runtimeModuleId,
    sourceModelName,
  } = cdc;

  const code = multiReduce
    ? `// This file is generated. Do not edit by hand.
import {makeMultiReducer} from '${runtimeModuleId}';
import {${handlerImportName}} from '${handlerModuleId}';
import type {${sourceModelName}, unmarshall${sourceModelName}} from '${actionsModuleId}';

export const handler = makeMultiReducer<${sourceModelName}>(${handlerImportName}, {unmarshallSourceModel: unmarshall${sourceModelName}});
`
    : `// This file is generated. Do not edit by hand.
import {makeReducer} from '${runtimeModuleId}';
import {${handlerImportName}} from '${handlerModuleId}';
import type {${sourceModelName}, unmarshall${sourceModelName}} from '${actionsModuleId}';

export const handler = makeReducer<${sourceModelName}>(${handlerImportName}, {unmarshallSourceModel: unmarshall${sourceModelName}});
`;

  const {fragment, stack} = makeHandler(config, model, cdc, code);

  return {fragment: combineFragments(fragment), stack};
}
