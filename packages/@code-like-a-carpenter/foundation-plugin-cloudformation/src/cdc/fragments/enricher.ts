import type {
  ChangeDataCaptureEnricherConfig,
  Model,
} from '@code-like-a-carpenter/foundation-intermediate-representation';

import type {Model as ServerlessApplicationModel} from '../../__generated__/serverless-application-model';
import type {Config} from '../../config';

import {defineHandler} from './handler';

export function defineEnricher(
  config: Config,
  model: Model,
  cdc: ChangeDataCaptureEnricherConfig
): ServerlessApplicationModel {
  const {
    actionsModuleId,
    handlerImportName,
    handlerModuleId,
    runtimeModuleId,
    sourceModelName,
    targetModelName,
  } = cdc;

  const code = `// This file is generated. Do not edit by hand.

import {makeEnricher} from '${runtimeModuleId}';

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

  return defineHandler(config, model, cdc, code);
}
