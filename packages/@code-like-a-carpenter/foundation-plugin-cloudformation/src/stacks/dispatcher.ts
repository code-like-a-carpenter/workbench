import type {TableWithCdc} from '@code-like-a-carpenter/foundation-intermediate-representation';

import type {Resource1} from '../__generated__/json-schemas/serverless-application-model.ts';
import type {Config} from '../config.ts';
import {combineFragments} from '../fragments/combine-fragments.ts';
import {makeLogGroup} from '../fragments/log-group.ts';
import type {ServerlessApplicationModel} from '../types.ts';

export function isDispatcherStack(resourceName: string) {
  return resourceName.startsWith('FNDNSTD');
}

export function makeDispatcherStackName(table: TableWithCdc): string {
  // Foundation Nested Stack Table Dispatcher
  return `FNDNSTD${table.dispatcherConfig.functionName}`;
}

export function makeDispatcherStack(
  config: Config
): ServerlessApplicationModel {
  const functionName = 'Function';

  const fn: Resource1 = {
    Metadata: {
      BuildMethod: 'esbuild',
      buildProperties: {
        EntryPoints: ['./index'],
        External: config.buildProperties.external,
        Minify: config.buildProperties.minify,
        Sourcemap: config.buildProperties.sourcemap,
        Target: config.buildProperties.target,
      },
    },
    Properties: {
      // @ts-expect-error - typedef does not know about intrinsic functions
      CodeUri: {Ref: 'CodeUri'},
      Events: {
        Stream: {
          Properties: {
            BatchSize: {Ref: 'BatchSize'},
            FunctionResponseTypes: ['ReportBatchItemFailures'],
            MaximumRetryAttempts: {Ref: 'MaximumRetryAttempts'},
            StartingPosition: 'TRIM_HORIZON',
            Stream: {Ref: 'StreamArn'},
          },
          Type: 'DynamoDB',
        },
      },
      Handler: 'index.handler',
      MemorySize: {Ref: 'MemorySize'},
      Policies: [
        'AWSLambdaBasicExecutionRole',
        'AWSLambda_ReadOnlyAccess',
        'AWSXrayWriteOnlyAccess',
        'CloudWatchLambdaInsightsExecutionRolePolicy',
        {CloudWatchPutMetricPolicy: {}},
        {
          EventBridgePutEventsPolicy: {
            EventBusName: {Ref: 'EventBus'},
          },
        },
      ],
      Runtime: 'nodejs22.x',
      Timeout: {Ref: 'Timeout'},
      Tracing: 'Active',
    },
    Type: 'AWS::Serverless::Function',
  };

  return combineFragments(makeLogGroup({functionName}), {
    AWSTemplateFormatVersion: '2010-09-09',
    Outputs: {
      FunctionName: {
        Export: {
          // eslint-disable-next-line no-template-curly-in-string
          Name: {'Fn::Sub': '${AWS::StackName}-FunctionName'},
        },
        Value: {Ref: 'Function'},
      },
    },
    Parameters: {
      BatchSize: {
        Type: 'Number',
      },
      CodeUri: {
        Type: 'String',
      },
      EventBus: {
        Type: 'String',
      },
      MaximumRetryAttempts: {
        Type: 'Number',
      },
      MemorySize: {
        Type: 'Number',
      },
      StreamArn: {
        Type: 'String',
      },
      Timeout: {
        Type: 'Number',
      },
    },
    Resources: {
      [functionName]: fn,
    },
    Transform: 'AWS::Serverless-2016-10-31',
  });
}
