import type {TableWithCdc} from '@code-like-a-carpenter/foundation-intermediate-representation';

import type {Resource7} from '../__generated__/json-schemas/serverless-application-model.ts';
import type {Config} from '../config.ts';
import {combineFragments} from '../fragments/combine-fragments.ts';
import {writeLambda} from '../fragments/lambda.ts';
import {
  makeDispatcherStack,
  makeDispatcherStackName,
} from '../stacks/dispatcher.ts';
import type {ServerlessApplicationModel} from '../types.ts';

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
