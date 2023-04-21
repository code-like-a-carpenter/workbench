import type {TableWithCdc} from '@code-like-a-carpenter/foundation-intermediate-representation';

import type {Resource7} from '../__generated__/json-schemas/serverless-application-model';
import type {Config} from '../config';
import {combineFragments} from '../fragments/combine-fragments';
import {writeLambda} from '../fragments/lambda';
import {
  makeDispatcherStack,
  makeDispatcherStackName,
} from '../stacks/dispatcher';
import type {ServerlessApplicationModel} from '../types';

/** Generates CDC config for a table */
export function defineTableCdc(
  table: TableWithCdc,
  config: Config
): {
  fragment: ServerlessApplicationModel;
  stack: ServerlessApplicationModel;
} {
  const {dispatcherConfig, dependenciesModuleId, tableName} = table;

  const {
    batchSize,
    filename,
    directory,
    maximumRetryAttempts,
    memorySize,
    nestedStackLocation,
    runtimeModuleId,
    timeout,
  } = dispatcherConfig;

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

  const stack: Resource7 = {
    Properties: {
      Location: nestedStackLocation,
      Parameters: {
        BatchSize: batchSize,
        CodeUri: filename,
        EventBus: 'default',
        MaximumRetryAttempts: maximumRetryAttempts,
        MemorySize: memorySize,
        StreamArn: {'Fn::GetAtt': [tableName, 'StreamArn']},
        Timeout: timeout,
      },
    },
    Type: 'AWS::Serverless::Application',
  };

  const stackName = makeDispatcherStackName(table);

  const fragment = combineFragments({
    Resources: {
      [stackName]: stack,
    },
  });

  const dispatcherStack = makeDispatcherStack(config);

  return {fragment, stack: dispatcherStack};
}
