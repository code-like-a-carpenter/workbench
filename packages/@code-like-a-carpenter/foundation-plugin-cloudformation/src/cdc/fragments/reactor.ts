import type {
  ChangeDataCaptureReactorConfig,
  Model,
} from '@code-like-a-carpenter/foundation-intermediate-representation';

import type {Model as ServerlessApplicationModel} from '../../__generated__/serverless-application-model';
import type {Config} from '../../config';

import {defineHandler} from './handler';

export function defineReactor(
  config: Config,
  model: Model,
  cdc: ChangeDataCaptureReactorConfig
): ServerlessApplicationModel {
  const {
    actionsModuleId,
    handlerImportName,
    handlerModuleId,
    runtimeModuleId,
    sourceModelName,
  } = cdc;
  const code = `// This file is generated. Do not edit by hand.

import {makeReactorHandler} from '${runtimeModuleId}';

import {${handlerImportName}} from '${handlerModuleId}';
import type {${sourceModelName}, unmarshall${sourceModelName}} from '${actionsModuleId}';

export const handler = makeReactorHandler<${sourceModelName}>(${handlerImportName}, {unmarshallSourceModel: unmarshall${sourceModelName}});
`;

  return defineHandler(config, model, cdc, code);
}
