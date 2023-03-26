import type {
  BaseChangeDataCaptureConfig,
  Model,
} from '@code-like-a-carpenter/foundation-intermediate-representation';

import type {
  AWSEventsRule,
  AWSKMSKey,
  AWSSQSQueue,
  AWSSQSQueuePolicy,
  Model as ServerlessApplicationModel,
  Resource1,
} from '../../__generated__/serverless-application-model';
import {combineFragments} from '../../combine-fragments';
import type {Config} from '../../config';

import {writeLambda} from './lambda';
import {makeLogGroup} from './log-group';

export function defineHandler(
  config: Config,
  model: Model,
  cdc: BaseChangeDataCaptureConfig,
  code: string
): ServerlessApplicationModel {
  const {
    table: {tableName},
  } = model;

  const {
    directory,
    event,
    filename,
    functionName,
    memorySize,
    sourceModelName,
    timeout,
  } = cdc;

  writeLambda(directory, code);

  const queueName = `${functionName}Queue`;
  const dlqName = `${functionName}DLQ`;
  const queueKeyName = `${queueName}Key`;
  const queuePolicyName = `${queueName}Policy`;
  const ruleName = `${functionName}Rule`;

  const deadLetterQueue: AWSSQSQueue = {
    Properties: {
      // FIXME configure this
      // @ts-expect-error typedef does not know about If, Ref
      KmsMasterKeyId: {
        'Fn::If': ['IsProd', {Ref: `${queueName}Key`}, 'AWS::NoValue'],
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
      CodeUri: filename,
      Events: {
        Stream: {
          Properties: {
            BatchSize: 10,
            // @ts-expect-error typedef has not been updated to include
            // `FunctionResponseTypes` for SQS events
            FunctionResponseTypes: ['ReportBatchItemFailures'],
            Queue: {'Fn::GetAtt': [queueName, 'Arn']},
          },
          Type: 'SQS',
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
          SQSSendMessagePolicy: {
            QueueName: {
              'Fn::GetAtt': [`${functionName}DLQ`, 'QueueName'],
            },
          },
        },
      ],
      Timeout: timeout,
    },
    Type: 'AWS::Serverless::Function',
  };

  const queue: AWSSQSQueue = {
    Properties: {
      // @ts-expect-error typedef does not include If
      'Fn::If': [
        // FIXME configure this
        'IsProd',
        {
          KmsMasterKeyId: {
            Ref: `${queueName}Key`,
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

  const queueKey: AWSKMSKey = {
    // FIXME configurable condition
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
            Sid: 'Allow access through Simple Queue Service (SQS) for all principals in the account that are authorized to use SQS',
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

  const queuePolicy: AWSSQSQueuePolicy = {
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
              'Fn::GetAtt': [queueName, 'Arn'],
            },
            Sid: 'Allow EventBridge to send messages to the queue',
          },
        ],
      },
      // @ts-expect-error - typedef does not include Ref
      Queues: [{Ref: queueName}],
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
                S: [`${sourceModelName}`],
              },
            },
          },
        },
        'detail-type': event === 'UPSERT' ? ['INSERT', 'MODIFY'] : [event],
        resources: [{'Fn::GetAtt': [tableName, 'Arn']}],
        source: [`${tableName}.${sourceModelName}`],
      },
      Targets: [
        {
          // @ts-expect-error - typedef does not include GetAtt
          Arn: {'Fn::GetAtt': [queueName, 'Arn']},
          Id: functionName,
        },
      ],
    },
    Type: 'AWS::Events::Rule',
  };

  return combineFragments(makeLogGroup({functionName}), {
    Resources: {
      [dlqName]: deadLetterQueue,
      [functionName]: fn,
      [queueKeyName]: queueKey,
      [queueName]: queue,
      [queuePolicyName]: queuePolicy,
      [ruleName]: rule,
    },
  });
}
