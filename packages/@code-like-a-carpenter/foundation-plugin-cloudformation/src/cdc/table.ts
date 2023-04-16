import type {Table} from '@code-like-a-carpenter/foundation-intermediate-representation';

import type {Config} from '../config';
import {combineFragments} from '../fragments/combine-fragments';
import {makeTableDispatcher} from '../fragments/table-dispatcher';
import type {ServerlessApplicationModel} from '../types';

/** Generates CDC config for a table */
export function defineTableCdc(
  table: Table,
  config: Config
): ServerlessApplicationModel {
  if (!table.hasCdc) {
    return {
      Resources: {},
    };
  }

  const {dispatcherConfig, dependenciesModuleId, tableName} = table;

  const {
    batchSize,
    filename,
    functionName,
    directory,
    maximumRetryAttempts,
    memorySize,
    nestStack,
    nestedStackLocation,
    nestedStackTemplatePath,
    runtimeModuleId,
    timeout,
  } = dispatcherConfig;

  return combineFragments(
    makeTableDispatcher(config, {
      batchSize,
      buildProperties: {
        EntryPoints: ['./index'],
        External: config.buildProperties.external,
        Minify: config.buildProperties.minify,
        Sourcemap: config.buildProperties.sourcemap,
        Target: config.buildProperties.target,
      },
      codeUri: filename,
      dependenciesModuleId,
      functionName,
      libImportPath: runtimeModuleId,
      maximumRetryAttempts,
      memorySize,
      nested: nestStack,
      nestedStackLocation,
      nestedStackTemplatePath,
      outputPath: directory,
      tableName,
      timeout,
    })
  );
}
