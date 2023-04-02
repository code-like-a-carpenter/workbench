import assert from 'assert';
import crypto from 'crypto';
import path from 'path';

import {camelCase, kebabCase, snakeCase, upperFirst} from 'lodash';

import type {
  ChangeDataCaptureTriggerConfig,
  Model,
} from '@code-like-a-carpenter/foundation-intermediate-representation';
import {
  increasePathDepth,
  resolveActionsModule,
} from '@code-like-a-carpenter/foundation-parser';

import type {CloudformationPluginConfig} from '../config';
import {combineFragments} from '../fragments/combine-fragments';
import {buildPropertiesWithDefaults} from '../fragments/lambda';
import type {ServerlessApplicationModel} from '../types';

import {makeHandler} from './lambdas';

/** Generates CDC config for a model */
export function defineTriggerCdc(
  model: Model,
  {
    handlerConfig,
    handlerModuleId,
    event,
    sourceModelName,
    readableTables,
    writableTables,
  }: ChangeDataCaptureTriggerConfig,
  config: CloudformationPluginConfig,
  {outputFile}: {outputFile: string}
): ServerlessApplicationModel {
  const {dependenciesModuleId, libImportPath, tableName} = model;

  const handlerFileName = `trigger--${kebabCase(
    sourceModelName
  )}--${event.toLowerCase()}`;
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
  const handlerOutputPath = path.join(
    path.dirname(outputFile),
    handlerFileName
  );

  const actionsModuleId = resolveActionsModule(
    handlerOutputPath,
    config.actionsModuleId
  );

  const resolvedHandlerModuleId = increasePathDepth(handlerModuleId);

  const template = `// This file is generated. Do not edit by hand.

import {assert, makeTriggerHandler} from '${libImportPath}';

import {handler as cdcHandler} from '${resolvedHandlerModuleId}';
import {unmarshall${sourceModelName}} from '${actionsModuleId}';

export const handler = makeTriggerHandler((record) => {
  assert(record.dynamodb.NewImage, 'Expected DynamoDB Record to have a NewImage');
  return cdcHandler(unmarshall${sourceModelName}(record.dynamodb.NewImage));
});
`;

  return combineFragments(
    makeHandler({
      buildProperties: buildPropertiesWithDefaults(config.buildProperties),
      codeUri: handlerFileName,
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
