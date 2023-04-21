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
import {makeLogGroup} from '../fragments/log-group';
import {filterNull} from '../helpers';
import type {ServerlessApplicationModel} from '../types';

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

  const dlq: AWSSQSQueue = {
    Properties: {
      // @ts-expect-error typedef doesn't include intrinsic functions
      KmsMasterKeyId: {
        'Fn::If': ['IsProd', {Ref: qKeyName}, 'AWS::NoValue'],
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
          // TableNames will get set after-the-fact the the main plugin script
          // before writing the template.
          FOUNDATION_TABLE_NAMES: {Ref: 'TableNames'},
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
    Condition: 'IsProd',
    Properties: {
      KeyPolicy: {
        Statement: [
          {
            Action: ['kms:Decrypt', 'kms:GenerateDataKey'],
            Effect: 'Allow',
            Principal: {
              Service: 'events.amazonaws.com',
            },
            Resource: '*',
            Sid: 'Allow EventBridge to use the Key',
          },
          {
            Action: [
              'kms:Create*',
              'kms:Describe*',
              'kms:Enable*',
              'kms:List*',
              'kms:Put*',
              'kms:Update*',
              'kms:Revoke*',
              'kms:Disable*',
              'kms:Get*',
              'kms:Delete*',
              'kms:ScheduleKeyDeletion',
              'kms:CancelKeyDeletion',
            ],
            Effect: 'Allow',
            Principal: {
              AWS: {
                // eslint-disable-next-line no-template-curly-in-string
                'Fn::Sub': 'arn:aws:iam::${AWS::AccountId}:root',
              },
            },
            Resource: '*',
            Sid: 'Allow administration of the key',
          },
          {
            Action: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:CreateGrant',
              'kms:DescribeKey',
            ],
            Condition: {
              StringEquals: {
                'kms:CallerAccount': {
                  // eslint-disable-next-line no-template-curly-in-string
                  'Fn::Sub': '${AWS::AccountId}',
                },
                'kms:ViaService': 'sqs.us-east-1.amazonaws.com',
              },
            },
            Effect: 'Allow',
            Principal: {
              AWS: '*',
            },
            Resource: '*',
            Sid: 'Allow authorized SQS callers to access the key',
          },
          {
            Action: [
              'kms:Describe*',
              'kms:Get*',
              'kms:List*',
              'kms:RevokeGrant',
            ],
            Effect: 'Allow',
            Principal: {
              AWS: {
                // eslint-disable-next-line no-template-curly-in-string
                'Fn::Sub': 'arn:aws:iam::${AWS::AccountId}:root',
              },
            },
            Resource: '*',
            Sid: 'Allow direct access to key metadata to the account',
          },
        ],
        Version: '2012-10-17',
      },
      PendingWindowInDays: 7,
    },
    Type: 'AWS::KMS::Key',
  };

  const q: AWSSQSQueue = {
    Properties: {
      // @ts-expect-error typedef doesn't include intrinsic functions
      'Fn::If': [
        'IsProd',
        {
          KmsMasterKeyId: {
            Ref: qKeyName,
          },
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
    Conditions: {
      IsProd: {'Fn::Equals': [{Ref: 'StageName'}, 'production']},
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
      CodeUri: {Type: 'String'},
      DetailType: {Type: 'CommaDelimitedList'},
      MemorySize: {Type: 'Number'},
      SourceModelName: {Type: 'String'},
      StageName: {Type: 'String'},
      TableArn: {Type: 'String'},
      TableName: {Type: 'String'},
      Timeout: {Type: 'Number'},
    },
    Resources: {
      [dlqName]: dlq,
      [fnName]: fn,
      [qKeyName]: qKey,
      [qName]: q,
      [qPolicyName]: qPolicy,
      [ruleName]: rule,
    },
    Transform: 'AWS::Serverless-2016-10-31',
  });
}
