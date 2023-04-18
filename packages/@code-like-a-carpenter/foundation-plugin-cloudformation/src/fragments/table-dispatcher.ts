import {mkdirSync, writeFileSync} from 'fs';
import path from 'node:path';

import yml from 'js-yaml';

import type {
  Resource1,
  Resource7,
} from '../__generated__/json-schemas/serverless-application-model';
import type {Config} from '../config';
import type {ServerlessApplicationModel} from '../types';

import {combineFragments} from './combine-fragments';
import type {LambdaDynamoDBEventInput, LambdaInput} from './lambda';
import {writeLambda} from './lambda';
import {makeLogGroup} from './log-group';

export interface TableDispatcherInput
  extends LambdaInput,
    LambdaDynamoDBEventInput {
  memorySize: number;
  nested: boolean;
  nestedStackLocation: string;
  nestedStackTemplatePath: string;
  timeout: number;
}

/** cloudformation generator */
export function makeTableDispatcher(
  config: Config,
  {
    batchSize,
    buildProperties,
    codeUri,
    dependenciesModuleId,
    functionName,
    libImportPath,
    maximumRetryAttempts,
    memorySize,
    nested,
    nestedStackLocation,
    nestedStackTemplatePath,
    outputPath,
    tableName,
    timeout,
  }: TableDispatcherInput
): ServerlessApplicationModel {
  writeLambda(
    outputPath,
    `// This file is generated. Do not edit by hand.

import {expandTableNames,makeDynamoDBStreamDispatcher} from '${libImportPath}';
import * as dependencies from '${dependenciesModuleId}';

expandTableNames();

export const handler = makeDynamoDBStreamDispatcher({
  ...dependencies,
  tableName: '${tableName}',
});
`
  );

  if (nested) {
    writeTemplate(config, nestedStackTemplatePath);

    const stack: Resource7 = {
      Properties: {
        Location: nestedStackLocation,
        Parameters: {
          BatchSize: batchSize,
          CodeUri: codeUri,
          EventBus: 'default',
          MaximumRetryAttempts: maximumRetryAttempts,
          MemorySize: memorySize,
          StreamArn: {'Fn::GetAtt': [tableName, 'StreamArn']},
          TableNames: {Type: 'String'},
          Timeout: timeout,
        },
      },
      Type: 'AWS::Serverless::Application',
    };

    return {
      Resources: {
        [`Nested${functionName}Stack`]: stack,
      },
    };
  }

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

function writeTemplate(config: Config, templatePath: string) {
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
      Environment: {
        Variables: {
          // TableNames will get set after-the-fact the the main plugin script
          // before writing the template.
          FOUNDATION_TABLE_NAMES: {Ref: 'TableNames'},
        },
      },
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
      Timeout: {Ref: 'Timeout'},
    },
    Type: 'AWS::Serverless::Function',
  };

  const fragments = combineFragments(makeLogGroup({functionName}), {
    Globals: {
      Function: {
        Handler: 'index.handler',
        Runtime: 'nodejs18.x',
        Tracing: 'Active',
      },
    },
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
      TableNames: {
        Type: 'String',
      },
      Timeout: {
        Type: 'Number',
      },
    },
    Resources: {
      [functionName]: fn,
    },
  });

  const tpl = {
    ...fragments,
    AWSTemplateFormatVersion: '2010-09-09',
    Transform: 'AWS::Serverless-2016-10-31',
  };

  const {format} = config.outputConfig;

  const out =
    format === 'json'
      ? JSON.stringify(tpl, null, 2)
      : yml.dump(tpl, config.outputConfig.yamlConfig);

  const dirname = path.dirname(templatePath);

  mkdirSync(dirname, {recursive: true});
  writeFileSync(templatePath, out);
}
