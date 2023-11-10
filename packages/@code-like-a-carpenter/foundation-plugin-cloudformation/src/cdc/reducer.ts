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
    targetModelName,
  } = cdc;
  const {dependenciesModuleId} = model.table;

  const factoryName = multiReduce ? 'makeMultiReducer' : 'makeReducer';

  const code = `// This file is generated. Do not edit by hand.
import {${factoryName}} from '${runtimeModuleId}';
import {${handlerImportName}} from '${handlerModuleId}';
import {
  ${sourceModelName},
  ${targetModelName},
  create${targetModelName},
  unmarshall${sourceModelName},
  update${targetModelName},
  Create${targetModelName}Input,
  Update${targetModelName}Input
} from '${actionsModuleId}';
import * as dependencies from '${dependenciesModuleId}';

export const handler = ${factoryName}<
${sourceModelName},
${targetModelName},
Create${targetModelName}Input,
Update${targetModelName}Input
>(
  ${handlerImportName},
  {
    createTargetModel: create${targetModelName},
    unmarshallSourceModel: unmarshall${sourceModelName},
    updateTargetModel: update${targetModelName}
  },
  dependencies
);
`;

  const {fragment, stack} = makeHandler(config, model, cdc, code);

  return {fragment: combineFragments(fragment), stack};
}
