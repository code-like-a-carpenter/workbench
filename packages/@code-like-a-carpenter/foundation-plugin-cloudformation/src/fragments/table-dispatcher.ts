import type {ServerlessApplicationModel} from '../types';

import {combineFragments} from './combine-fragments';
import type {LambdaDynamoDBEventInput, LambdaInput} from './lambda';
import {writeLambda} from './lambda';
import {makeLogGroup} from './log-group';

export interface TableDispatcherInput
  extends LambdaInput,
    LambdaDynamoDBEventInput {
  memorySize: number;
  timeout: number;
}

/** cloudformation generator */
export function makeTableDispatcher({
  batchSize,
  buildProperties,
  codeUri,
  dependenciesModuleId,
  functionName,
  libImportPath,
  maximumRetryAttempts,
  memorySize,
  outputPath,
  tableName,
  timeout,
}: TableDispatcherInput): ServerlessApplicationModel {
  writeLambda(
    outputPath,
    `// This file is generated. Do not edit by hand.

import {makeDynamoDBStreamDispatcher} from '${libImportPath}';
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
          BuildProperties: buildProperties,
        },
        Properties: {
          CodeUri: codeUri,
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
