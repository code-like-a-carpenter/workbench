import type {
  ChangeDataCaptureConfig,
  Model,
} from '@code-like-a-carpenter/foundation-intermediate-representation';

import type {
  AWSEventsRule,
  AWSKMSKey,
  AWSSQSQueue,
  AWSSQSQueuePolicy,
  Resource1,
} from '../__generated__/json-schemas/serverless-application-model';
import type {Config} from '../config';
import {combineFragments} from '../fragments/combine-fragments';
import {makeKmsKey} from '../fragments/kms-key';
import {makeLogGroup} from '../fragments/log-group';
import {filterNull} from '../helpers';
import type {ServerlessApplicationModel} from '../types';

export function isHandlerStack(resourceName: string) {
  return resourceName.startsWith('FNDNSCDC');
}

export function makeHandlerStackName(
  model: Model,
  cdc: ChangeDataCaptureConfig
): string {
  // Foundation Nested Stack CDC
  return `FNDNSCDC${cdc.functionName}`;
}

export function makeHandlerStack(config: Config): ServerlessApplicationModel {
  const dlqName = 'DeadLetterQueue';
  const fnName = 'Function';
  const qKeyName = 'QueueKey';
  const qName = 'Queue';
  const qPolicyName = 'QueuePolicy';
  const ruleName = 'Rule';

  const KmsMasterKeyId = config.singleQueueKey
    ? {Ref: 'ExternalKmsMasterKeyId'}
    : {Ref: qKeyName};

  const dlq: AWSSQSQueue = {
    Properties: {
      // @ts-expect-error typedef doesn't include intrinsic functions
      KmsMasterKeyId: {
        'Fn::If': ['UseKey', KmsMasterKeyId, 'AWS::NoValue'],
      },
    },
    Type: 'AWS::SQS::Queue',
  };

  const fn: Resource1 = {
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
      // @ts-expect-error - typedef doesn't include intrinsic functions
      CodeUri: {Ref: 'CodeUri'},
      Environment: {
        Variables: {
          TABLE_NAMES: {
            Ref: 'TableNames',
          },
        },
      },
      Events: {
        Stream: {
          Properties: {
            BatchSize: 10,
            // @ts-expect-error typedef doesn't include this property yet
            FunctionResponseTypes: ['ReportBatchItemFailures'],
            Queue: {'Fn::GetAtt': [qName, 'Arn']},
          },
          Type: 'SQS',
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
          SQSSendMessagePolicy: {
            QueueName: {
              'Fn::GetAtt': [dlqName, 'QueueName'],
            },
          },
        },
      ].filter(filterNull),
      Timeout: {Ref: 'Timeout'},
    },
    Type: 'AWS::Serverless::Function',
  };

  const qKey: AWSKMSKey = {
    ...makeKmsKey(),
    Condition: 'DefineKey',
  };

  const q: AWSSQSQueue = {
    Properties: {
      // @ts-expect-error typedef doesn't include intrinsic functions
      'Fn::If': [
        'UseKey',
        {
          KmsMasterKeyId,
          RedrivePolicy: {
            deadLetterTargetArn: {
              'Fn::GetAtt': [dlqName, 'Arn'],
            },
            maxReceiveCount: 3,
          },
          VisibilityTimeout: 320,
        },
        {
          RedrivePolicy: {
            deadLetterTargetArn: {
              'Fn::GetAtt': [dlqName, 'Arn'],
            },
            maxReceiveCount: 3,
          },
          VisibilityTimeout: 320,
        },
      ],
    },
    Type: 'AWS::SQS::Queue',
  };

  const qPolicy: AWSSQSQueuePolicy = {
    Properties: {
      PolicyDocument: {
        Statement: [
          {
            Action: ['sqs:SendMessage'],
            Condition: {
              ArnEquals: {
                'aws:SourceArn': {
                  'Fn::GetAtt': [ruleName, 'Arn'],
                },
              },
            },
            Effect: 'Allow',
            Principal: {
              Service: 'events.amazonaws.com',
            },
            Resource: {
              'Fn::GetAtt': [qName, 'Arn'],
            },
            Sid: 'Allow EventBridge to send messages to the queue',
          },
        ],
      },
      // @ts-expect-error typedef doesn't include intrinsic functions
      Queues: [{Ref: qName}],
    },
    Type: 'AWS::SQS::QueuePolicy',
  };

  const rule: AWSEventsRule = {
    Properties: {
      EventBusName: 'default',
      EventPattern: {
        detail: {
          dynamodb: {
            NewImage: {
              _et: {
                S: [{Ref: 'SourceModelName'}],
              },
            },
          },
        },
        'detail-type': {Ref: 'DetailType'},
        resources: [{Ref: 'TableArn'}],
        // eslint-disable-next-line no-template-curly-in-string
        source: [{'Fn::Sub': '${TableName}.${SourceModelName}'}],
      },
      Targets: [
        {
          // @ts-expect-error typedef doesn't include intrinsic functions
          Arn: {'Fn::GetAtt': [qName, 'Arn']},
          Id: fnName,
        },
      ],
    },
    Type: 'AWS::Events::Rule',
  };

  return combineFragments(makeLogGroup({functionName: fnName}), {
    AWSTemplateFormatVersion: '2010-09-09',
    Conditions: config.singleQueueKey
      ? {
          HasExternalKey: {
            'Fn::Not': [
              {'Fn::Equals': [{Ref: 'ExternalKmsMasterKeyId'}, 'AWS::NoValue']},
            ],
          },
          IsProd: {'Fn::Equals': [{Ref: 'StageName'}, 'production']},
          UseKey: {
            // The IsProd here is slightly redundant, but the goal is to ensure
            // this fail in prod if not external key is defined.
            'Fn::Or': [{Condition: 'HasExternalKey'}, {Condition: 'IsProd'}],
          },
        }
      : {
          DefineKey: {'Fn::And': [{Condition: 'IsProd'}]},
          IsProd: {'Fn::Equals': [{Ref: 'StageName'}, 'production']},
          UseKey: {Condition: 'DefineKey'},
        },
    Globals: {
      Function: {
        Handler: 'index.handler',
        Runtime: 'nodejs18.x',
        Tracing: 'Active',
      },
    },
    Outputs: {
      DeadLetterQueueArn: {
        Export: {
          // eslint-disable-next-line no-template-curly-in-string
          Name: {'Fn::Sub': '${AWS::StackName}-DeadLetterQueueArn'},
        },
        Value: {'Fn::GetAtt': [dlqName, 'Arn']},
      },
      DeadLetterQueueName: {
        Export: {
          // eslint-disable-next-line no-template-curly-in-string
          Name: {'Fn::Sub': '${AWS::StackName}-DeadLetterQueueName'},
        },
        Value: {Ref: dlqName},
      },
      FunctionArn: {
        Export: {
          // eslint-disable-next-line no-template-curly-in-string
          Name: {'Fn::Sub': '${AWS::StackName}-FunctionArn'},
        },
        Value: {'Fn::GetAtt': [fnName, 'Arn']},
      },
      FunctionName: {
        Export: {
          // eslint-disable-next-line no-template-curly-in-string
          Name: {'Fn::Sub': '${AWS::StackName}-FunctionName'},
        },
        Value: {Ref: fnName},
      },
      QueueArn: {
        Export: {
          // eslint-disable-next-line no-template-curly-in-string
          Name: {'Fn::Sub': '${AWS::StackName}-QueueArn'},
        },
        Value: {'Fn::GetAtt': [qName, 'Arn']},
      },
      QueueName: {
        Export: {
          // eslint-disable-next-line no-template-curly-in-string
          Name: {'Fn::Sub': '${AWS::StackName}-QueueName'},
        },
        Value: {Ref: qName},
      },
      Role: {
        Export: {
          // eslint-disable-next-line no-template-curly-in-string
          Name: {'Fn::Sub': '${AWS::StackName}-Role'},
        },
        Value: {Ref: `${fnName}Role`},
      },
      RuleName: {
        Export: {
          // eslint-disable-next-line no-template-curly-in-string
          Name: {'Fn::Sub': '${AWS::StackName}-RuleName'},
        },
        Value: {Ref: ruleName},
      },
    },
    Parameters: {
      ...(config.singleQueueKey
        ? {
            ExternalKmsMasterKeyId: {
              // We still need to allow this to be undefined in so that we can
              // avoid generating the key in non-prod scenarios.
              Default: 'AWS::NoValue',
              Type: 'String',
            },
          }
        : {}),
      CodeUri: {Type: 'String'},
      DetailType: {Type: 'CommaDelimitedList'},
      MemorySize: {Type: 'Number'},
      SourceModelName: {Type: 'String'},
      StageName: {Type: 'String'},
      TableArn: {Type: 'String'},
      TableName: {Type: 'String'},
      TableNames: {Type: 'String'},
      Timeout: {Type: 'Number'},
    },
    Resources: {
      ...(config.singleQueueKey ? {} : {[qKeyName]: qKey}),
      [dlqName]: dlq,
      [fnName]: fn,
      [qName]: q,
      [qPolicyName]: qPolicy,
      [ruleName]: rule,
    },
    Transform: 'AWS::Serverless-2016-10-31',
  });
}
