import crypto from 'crypto';
import path from 'path';

import {camelCase, snakeCase, upperFirst} from 'lodash';

import type {
  ChangeDataCaptureEnricherConfig,
  Model,
} from '@code-like-a-carpenter/foundation-intermediate-representation';
import {resolveActionsModule} from '@code-like-a-carpenter/foundation-parser';

import type {Config} from '../config';
import {combineFragments} from '../fragments/combine-fragments';
import type {ServerlessApplicationModel} from '../types';

import {makeHandler} from './lambdas';

/** Generates CDC Projector config for a model */
export function defineModelEnricher(
  model: Model,
  {
    filename,
    handlerConfig,
    handlerModuleId,
    event,
    sourceModelName,
    targetModelName,
    writableTables,
  }: ChangeDataCaptureEnricherConfig,
  config: Config,
  {outputFile}: {outputFile: string}
): ServerlessApplicationModel {
  const {dependenciesModuleId, libImportPath, tableName} = model;

  const handlerFunctionName = `Fn${upperFirst(
    camelCase(
      `handler--${snakeCase(sourceModelName)
        .split('_')
        .map((c) => c[0])
        .join('-')}--${event}--${snakeCase(targetModelName)
        .split('_')
        .map((c) => c[0])
        .join('-')}}`
    )
  )}${crypto
    .createHash('sha1')
    .update(sourceModelName + event + targetModelName)
    .digest('hex')
    .slice(0, 8)}`;
  const handlerOutputPath = path.join(path.dirname(outputFile), filename);

  const actionsModuleId = resolveActionsModule(
    handlerOutputPath,
    config.actionsModuleId
  );

  const template = `// This file is generated. Do not edit by hand.

import {makeEnricher} from '${libImportPath}';

import {create, load, update} from '${handlerModuleId}';
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
  {create, load, update},
  {
    createTargetModel: create${targetModelName},
    unmarshallSourceModel: unmarshall${sourceModelName},
    updateTargetModel: update${targetModelName}
  }
);
`;

  return combineFragments(
    makeHandler({
      buildProperties: {
        EntryPoints: ['./index'],
        External: config.buildProperties.external,
        Minify: config.buildProperties.minify,
        Sourcemap: config.buildProperties.sourcemap,
        Target: config.buildProperties.target,
      },
      codeUri: filename,
      dependenciesModuleId,
      event,
      functionName: handlerFunctionName,
      handlerConfig,
      libImportPath,
      outputPath: handlerOutputPath,
      readableTables: [],
      sourceModelName,
      tableName,
      template,
      writableTables,
    })
  );
}
