import assert from 'assert';
import crypto from 'crypto';
import path from 'path';

import {camelCase, snakeCase, upperFirst} from 'lodash';

import type {
  ChangeDataCaptureTriggerConfig,
  Model,
} from '@code-like-a-carpenter/foundation-intermediate-representation';
import {resolveActionsModule} from '@code-like-a-carpenter/foundation-parser';

import type {Config} from '../config';
import {combineFragments} from '../fragments/combine-fragments';
import type {ServerlessApplicationModel} from '../types';

import {makeHandler} from './lambdas';

/** Generates CDC config for a model */
export function defineTriggerCdc(
  model: Model,
  {
    filename,
    handlerConfig,
    handlerModuleId,
    event,
    sourceModelName,
    readableTables,
    writableTables,
  }: ChangeDataCaptureTriggerConfig,
  config: Config,
  {outputFile}: {outputFile: string}
): ServerlessApplicationModel {
  const {dependenciesModuleId, libImportPath, tableName} = model;

  const handlerFunctionName = `Fn${upperFirst(
    camelCase(
      `trigger--${snakeCase(sourceModelName)
        .split('_')
        .map((c) => c[0])
        .join('-')}--${event}`
    )
  )}${crypto
    .createHash('sha1')
    .update(sourceModelName + event)
    .digest('hex')
    .slice(0, 8)}`;
  assert(
    handlerFunctionName.length <= 64,
    `Handler function name must be less than 64 characters: ${handlerFunctionName}`
  );
  const handlerOutputPath = path.join(path.dirname(outputFile), filename);

  const actionsModuleId = resolveActionsModule(
    handlerOutputPath,
    config.actionsModuleId
  );

  const template = `// This file is generated. Do not edit by hand.

import {assert, makeTriggerHandler} from '${libImportPath}';

import {handler as cdcHandler} from '${handlerModuleId}';
import {unmarshall${sourceModelName}} from '${actionsModuleId}';

export const handler = makeTriggerHandler((record) => {
  assert(record.dynamodb.NewImage, 'Expected DynamoDB Record to have a NewImage');
  return cdcHandler(unmarshall${sourceModelName}(record.dynamodb.NewImage));
});
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
      readableTables,
      sourceModelName,
      tableName,
      template,
      writableTables,
    })
  );
}
