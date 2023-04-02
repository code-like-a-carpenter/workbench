import path from 'path';

import {kebabCase} from 'lodash';

import type {Table} from '@code-like-a-carpenter/foundation-intermediate-representation';

import type {CloudformationPluginConfig} from '../config';
import {combineFragments} from '../fragments/combine-fragments';
import {buildPropertiesWithDefaults} from '../fragments/lambda';
import {makeTableDispatcher} from '../fragments/table-dispatcher';
import type {ServerlessApplicationModel} from '../types';

/** Generates CDC config for a table */
export function defineTableCdc(
  table: Table,
  config: CloudformationPluginConfig,
  {outputFile}: {outputFile: string}
): ServerlessApplicationModel {
  if (!table.hasCdc) {
    return {
      Resources: {},
    };
  }

  const {dispatcherConfig, dependenciesModuleId, libImportPath, tableName} =
    table;

  const dispatcherFileName = `dispatcher-${kebabCase(tableName)}`;
  const dispatcherFunctionName = `${tableName}CDCDispatcher`;
  const dispatcherOutputPath = path.join(
    path.dirname(outputFile),
    dispatcherFileName
  );

  return combineFragments(
    makeTableDispatcher({
      buildProperties: buildPropertiesWithDefaults(config.buildProperties),
      codeUri: dispatcherFileName,
      dependenciesModuleId,
      dispatcherConfig,
      functionName: dispatcherFunctionName,
      libImportPath,
      outputPath: dispatcherOutputPath,
      tableName,
    })
  );
}
