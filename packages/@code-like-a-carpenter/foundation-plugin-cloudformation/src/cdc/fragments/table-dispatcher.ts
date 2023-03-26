import path from 'node:path';

import type {Table} from '@code-like-a-carpenter/foundation-intermediate-representation';

import type {Model as ServerlessApplicationModel} from '../../__generated__/serverless-application-model';
import {combineFragments} from '../../combine-fragments';
import type {Config} from '../../config';

import {writeLambda} from './lambda';
import {makeLogGroup} from './log-group';

/** cloudformation generator */
export function defineTableDispatcher(
  config: Config,
  table: Table
): ServerlessApplicationModel {
  if (!table.hasCdc) {
    return {Resources: {}};
  }

  const {
    dispatcherConfig: {
      batchSize,
      dependenciesModuleId,
      directory,
      filename,
      functionName,
      maximumRetryAttempts,
      memorySize,
      runtimeModuleId,
      timeout,
    },
    tableName,
  } = table;

  writeLambda(
    directory,
    `// This file is generated. Do not edit by hand.

import {makeDynamoDBStreamDispatcher} from '${runtimeModuleId}';
import * as dependencies from '${dependenciesModuleId}';

export const handler = makeDynamoDBStreamDispatcher({
  ...dependencies,
  tableName: '${tableName}',
});
`
  );

  return combineFragments(makeLogGroup({functionName}), {
    Resources: {
      [functionName]: {
        Metadata: {
          BuildMethod: 'esbuild',
          BuildProperties: {
            EntryPoints: ['./index'],
            External: config.buildProperties.external,
            Minify: config.buildProperties.minify,
            Sourcemap: config.buildProperties.sourcemap,
            Target: config.buildProperties.target,
          },
        },
        Properties: {
          CodeUri: filename,
          Events: {
            Stream: {
              Properties: {
                BatchSize: batchSize,
                FunctionResponseTypes: ['ReportBatchItemFailures'],
                MaximumRetryAttempts: maximumRetryAttempts,
                StartingPosition: 'TRIM_HORIZON',
                Stream: {'Fn::GetAtt': [tableName, 'StreamArn']},
              },
              Type: 'DynamoDB',
            },
          },
          MemorySize: memorySize,
          Policies: [
            'AWSLambdaBasicExecutionRole',
            'AWSLambda_ReadOnlyAccess',
            'AWSXrayWriteOnlyAccess',
            'CloudWatchLambdaInsightsExecutionRolePolicy',
            {CloudWatchPutMetricPolicy: {}},
            {
              EventBridgePutEventsPolicy: {
                EventBusName: 'default',
              },
            },
          ],
          Timeout: timeout,
        },
        Type: 'AWS::Serverless::Function',
      },
    },
  });
}

/** It adds a level of directory depth to a path. */
export function increasePathDepth(moduleId: string) {
  return moduleId.startsWith('.') ? path.join('..', moduleId) : moduleId;
}
