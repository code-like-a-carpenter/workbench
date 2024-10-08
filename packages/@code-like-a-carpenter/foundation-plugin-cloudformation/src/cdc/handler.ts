import snakeCase from 'lodash/snakeCase.js';

import type {
  ChangeDataCaptureConfig,
  Model,
} from '@code-like-a-carpenter/foundation-intermediate-representation';

import type {
  AWSIAMPolicy,
  Resource7,
} from '../__generated__/json-schemas/serverless-application-model.ts';
import type {Config} from '../config.ts';
import {combineFragments} from '../fragments/combine-fragments.ts';
import {makeKmsKey} from '../fragments/kms-key.ts';
import {writeLambda} from '../fragments/lambda.ts';
import {filterNull} from '../helpers.ts';
import {makeHandlerStack, makeHandlerStackName} from '../stacks/handler.ts';
import type {ServerlessApplicationModel} from '../types.ts';

/** generate the dispatcher lambda function */
export function makeHandler(
  config: Config,
  model: Model,
  cdc: ChangeDataCaptureConfig,
  template: string
): {
  fragment: ServerlessApplicationModel;
  stack: ServerlessApplicationModel;
} {
  const {
    table: {tableName},
  } = model;

  const {
    directory,
    event,
    filename,
    functionName,
    memorySize,
    readableTables,
    sourceModelName,
    timeout,
    nestedStackLocation,
    writableTables,
  } = cdc;

  writeLambda(directory, template);

  const stackName = makeHandlerStackName(model, cdc);
  const qKeyName = 'SharedKmsKey';

  const stack: Resource7 = {
    Properties: {
      Location: nestedStackLocation,
      Parameters: {
        ...(config.singleQueueKey
          ? {
              ExternalKmsMasterKeyId: {
                'Fn::If': [
                  'DefineSharedKmsKey',
                  {Ref: qKeyName},
                  'AWS::NoValue',
                ],
              },
            }
          : {}),
        CodeUri: filename,
        DetailType: event === 'UPSERT' ? 'INSERT,MODIFY' : event,
        MemorySize: memorySize,
        SourceModelName: sourceModelName,
        StageName: {Ref: 'StageName'},
        TableArn: {'Fn::GetAtt': [tableName, 'Arn']},
        // This is the table logical name, not the table name
        TableName: tableName,
        TableNames: {
          'Fn::ToJsonString': Object.fromEntries(
            [...readableTables, ...writableTables].map((t) => [
              snakeCase(t).toUpperCase(),
              {Ref: t},
            ])
          ),
        },
        Timeout: timeout,
      },
    },
    Type: 'AWS::Serverless::Application',
  };

  const tableAccessPolicy: AWSIAMPolicy = {
    Properties: {
      PolicyDocument: {
        Statement: [
          readableTables.length && {
            Action: [
              'dynamodb:GetItem',
              'dynamodb:Scan',
              'dynamodb:Query',
              'dynamodb:BatchGetItem',
              'dynamodb:DescribeTable',
            ],
            Effect: 'Allow',
            Resource: [
              ...readableTables.map((name) => ({
                'Fn::GetAtt': [name, 'Arn'],
              })),
              ...readableTables.map((name) => ({
                'Fn::Sub': [
                  // eslint-disable-next-line no-template-curly-in-string
                  '${tableArn}/index/*',
                  {tableArn: {'Fn::GetAtt': [name, 'Arn']}},
                ],
              })),
            ],
          },
          writableTables.length && {
            Action: [
              'dynamodb:GetItem',
              'dynamodb:DeleteItem',
              'dynamodb:PutItem',
              'dynamodb:Scan',
              'dynamodb:Query',
              'dynamodb:UpdateItem',
              'dynamodb:BatchWriteItem',
              'dynamodb:BatchGetItem',
              'dynamodb:DescribeTable',
              'dynamodb:ConditionCheckItem',
            ],
            Effect: 'Allow',
            Resource: [
              ...writableTables.map((name) => ({
                'Fn::GetAtt': [name, 'Arn'],
              })),
              ...writableTables.map((name) => ({
                'Fn::Sub': [
                  // eslint-disable-next-line no-template-curly-in-string
                  '${tableArn}/index/*',
                  {tableArn: {'Fn::GetAtt': [name, 'Arn']}},
                ],
              })),
            ],
          },
        ].filter(filterNull),
        Version: '2012-10-17',
      },
      PolicyName: `${functionName}TableAccessPolicy`,
      Roles: [
        // @ts-expect-error typedef doesn't include intrinsic functions
        {'Fn::GetAtt': [stackName, 'Outputs.Role']},
      ],
    },
    Type: 'AWS::IAM::Policy',
  };

  const tableAccessPolicyName = `${functionName}TableAccessPolicy`;

  const fragment = combineFragments({
    Conditions: config.singleQueueKey
      ? {DefineSharedKmsKey: {Condition: 'IsProd'}}
      : {},
    Resources: {
      ...(config.singleQueueKey
        ? {[qKeyName]: {...makeKmsKey(), Condition: 'DefineSharedKmsKey'}}
        : {}),
      [stackName]: stack,
      ...(readableTables.length || writableTables.length
        ? {[tableAccessPolicyName]: tableAccessPolicy}
        : {}),
    },
    Transform: ['AWS::LanguageExtensions'],
  });
  const handlerStack = makeHandlerStack(config);

  return {fragment, stack: handlerStack};
}
