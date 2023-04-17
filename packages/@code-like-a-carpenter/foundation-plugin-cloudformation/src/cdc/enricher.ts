import type {
  ChangeDataCaptureEnricherConfig,
  Model,
} from '@code-like-a-carpenter/foundation-intermediate-representation';

import type {Config} from '../config';
import {combineFragments} from '../fragments/combine-fragments';

import {makeHandler} from './lambdas';

/** Generates CDC Projector config for a model */
export function defineEnricher(
  config: Config,
  model: Model,
  cdc: ChangeDataCaptureEnricherConfig
) {
  const {
    actionsModuleId,
    handlerImportName,
    handlerModuleId,
    runtimeModuleId,
    sourceModelName,
    targetModelName,
  } = cdc;

  const template = `// This file is generated. Do not edit by hand.
import {expandTableNames,makeEnricher} from '${runtimeModuleId}';
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

expandTableNames();

export const handler = makeEnricher<
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
  }
);
`;

  return combineFragments(makeHandler(config, model, cdc, template));
}
