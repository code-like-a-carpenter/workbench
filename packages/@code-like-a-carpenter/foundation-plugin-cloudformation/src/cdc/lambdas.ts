import type {
  ChangeDataCaptureEvent,
  HandlerConfig,
} from '@code-like-a-carpenter/foundation-intermediate-representation';

import type {
  AWSEventsRule,
  AWSKMSKey,
  AWSSQSQueue,
  AWSSQSQueuePolicy,
  Resource1,
} from '../__generated__/json-schemas/serverless-application-model';
import {combineFragments} from '../fragments/combine-fragments';
import type {LambdaInput} from '../fragments/lambda';
import {writeLambda} from '../fragments/lambda';
import {makeLogGroup} from '../fragments/log-group';
import {filterNull} from '../helpers';

export interface MakeHandlerOptions extends LambdaInput {
  readonly event: ChangeDataCaptureEvent;
  readonly handlerConfig: HandlerConfig;
  readonly readableTables: readonly string[];
  readonly sourceModelName: string;
  readonly tableName: string;
  readonly template: string;
  readonly writableTables: readonly string[];
}

/** generate the dispatcher lambda function */
export function makeHandler({
  buildProperties,
  codeUri,
  handlerConfig,
  event,
  functionName,
  outputPath,
  readableTables,
  sourceModelName,
  tableName,
  template,
  writableTables,
}: MakeHandlerOptions) {
  writeLambda(outputPath, template);

  const {timeout, memorySize} = handlerConfig;

  const queueName = `${functionName}Queue`;

  const dlqName = `${functionName}DLQ`;

  const ruleName = `${functionName}Rule`;

  const dlq: AWSSQSQueue = {
    Properties: {
      // @ts-expect-error typedef doesn't include intrinsic functions
      KmsMasterKeyId: {
        'Fn::If': ['IsProd', {Ref: `${queueName}Key`}, 'AWS::NoValue'],
      },
    },
    Type: 'AWS::SQS::Queue',
  };
  const fn: Resource1 = {
    Metadata: {
      BuildMethod: 'esbuild',
      BuildProperties: buildProperties,
    },
    Properties: {
      CodeUri: codeUri,
      Events: {
        Stream: {
          Properties: {
            BatchSize: 10,
            // @ts-expect-error typedef doesn't include this property yet
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
        ...readableTables.map((targetTable) => ({
          DynamoDBReadPolicy: {
            TableName: {Ref: targetTable},
          },
        })),
        ...writableTables.map((targetTable) => ({
          DynamoDBCrudPolicy: {
            TableName: {Ref: targetTable},
          },
        })),
        {
          SQSSendMessagePolicy: {
            QueueName: {
              'Fn::GetAtt': [`${functionName}DLQ`, 'QueueName'],
            },
          },
        },
      ].filter(filterNull),
      Timeout: timeout,
    },
    Type: 'AWS::Serverless::Function',
  };
  const queue: AWSSQSQueue = {
    Properties: {
      // @ts-expect-error typedef doesn't include intrinsic functions
      'Fn::If': [
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
      // @ts-expect-error typedef doesn't include intrinsic functions
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
          // @ts-expect-error typedef doesn't include intrinsic functions
          Arn: {'Fn::GetAtt': [queueName, 'Arn']},
          Id: functionName,
        },
      ],
    },
    Type: 'AWS::Events::Rule',
  };

  return combineFragments(makeLogGroup({functionName}), {
    Resources: {
      [dlqName]: dlq,
      [functionName]: fn,
      [queueName]: queue,
      [`${queueName}Key`]: queueKey,
      [`${queueName}Policy`]: queuePolicy,
      [ruleName]: rule,
    },
  });
}
