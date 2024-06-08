import type {AWSKMSKey} from '../__generated__/json-schemas/serverless-application-model.ts';

export function makeKmsKey(): AWSKMSKey {
  return {
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
}
