import {snakeCase} from 'lodash';

import type {Table} from '@code-like-a-carpenter/foundation-intermediate-representation';

import type {AWSDynamoDBTable} from './__generated__/json-schemas/serverless-application-model';
import type {ServerlessApplicationModel} from './types';

/* eslint-disable complexity */
/** cloudformation generator */
export function defineTable({
  enablePointInTimeRecovery,
  enableStreaming,
  hasTtl,
  tableName,
  primaryKey: {isComposite},
  secondaryIndexes,
}: Table): ServerlessApplicationModel {
  const attributeDefinitions = isComposite
    ? [
        {
          AttributeName: 'pk',
          AttributeType: 'S',
        },
        {
          AttributeName: 'sk',
          AttributeType: 'S',
        },
      ]
    : [{AttributeName: 'pk', AttributeType: 'S'}];

  const keySchema = isComposite
    ? [
        {
          AttributeName: 'pk',
          KeyType: 'HASH',
        },
        {
          AttributeName: 'sk',
          KeyType: 'RANGE',
        },
      ]
    : [
        {
          AttributeName: 'pk',
          KeyType: 'HASH',
        },
      ];

  const globalSecondaryIndexes = [];
  const localSecondaryIndexes = [];

  for (const index of secondaryIndexes) {
    if (index.type === 'gsi') {
      attributeDefinitions.push(
        ...(index.isComposite
          ? [
              {
                AttributeName: `${index.name}pk`,
                AttributeType: 'S',
              },
              {
                AttributeName: `${index.name}sk`,
                AttributeType: 'S',
              },
            ]
          : [
              {
                AttributeName: index.isSingleField
                  ? index.name
                  : `${index.name}pk`,
                AttributeType: 'S',
              },
            ])
      );
      const gsiKeySchema = index.isComposite
        ? [
            {
              AttributeName: `${index.name}pk`,
              KeyType: 'HASH',
            },
            {
              AttributeName: `${index.name}sk`,
              KeyType: 'RANGE',
            },
          ]
        : [
            {
              AttributeName: index.isSingleField
                ? index.name
                : `${index.name}pk`,
              KeyType: 'HASH',
            },
          ];
      globalSecondaryIndexes.push({
        IndexName: index.name,
        KeySchema: gsiKeySchema,
        Projection: {
          ProjectionType: index.projectionType.toUpperCase(),
        },
      });
    } else if (index.type === 'lsi') {
      attributeDefinitions.push({
        AttributeName: `${index.name}sk`,
        AttributeType: 'S',
      });
      const lsiKeySchema = [
        {
          AttributeName: 'pk',
          KeyType: 'HASH',
        },
        {
          AttributeName: `${index.name}sk`,
          KeyType: 'RANGE',
        },
      ];
      localSecondaryIndexes.push({
        IndexName: index.name,
        KeySchema: lsiKeySchema,
        Projection: {
          ProjectionType: index.projectionType.toUpperCase(),
        },
      });
    }
  }

  const resource: AWSDynamoDBTable = {
    Properties: {
      AttributeDefinitions: attributeDefinitions,
      BillingMode: 'PAY_PER_REQUEST',
      ...(globalSecondaryIndexes.length
        ? {GlobalSecondaryIndexes: globalSecondaryIndexes}
        : {}),
      KeySchema: keySchema,
      ...(localSecondaryIndexes.length
        ? {LocalSecondaryIndexes: localSecondaryIndexes}
        : {}),
      ...(enablePointInTimeRecovery
        ? {
            PointInTimeRecoverySpecification: {
              PointInTimeRecoveryEnabled: {'Fn::If': ['IsProd', true, false]},
            },
          }
        : {}),
      SSESpecification: {
        // @ts-expect-error typedef doesn't include intrinsic functions
        SSEEnabled: {'Fn::If': ['IsProd', true, false]},
      },
      StreamSpecification: enableStreaming
        ? {
            StreamViewType: 'NEW_AND_OLD_IMAGES',
          }
        : undefined,
      Tags: [
        {
          Key: 'StageName',
          // @ts-expect-error typedef doesn't include intrinsic functions
          Value: {Ref: 'StageName'},
        },
        {
          Key: 'TableName',
          Value: tableName,
        },
      ],
      ...(hasTtl
        ? {
            TimeToLiveSpecification: {
              AttributeName: 'ttl',
              Enabled: true,
            },
          }
        : {}),
    },
    Type: 'AWS::DynamoDB::Table',
  };

  return {
    Conditions: {
      IsProd: {'Fn::Equals': [{Ref: 'StageName'}, 'production']},
    },
    Globals: {
      Function: {
        Environment: {
          Variables: {
            [`${snakeCase(tableName).toUpperCase()}`]: {Ref: tableName},
          },
        },
      },
    },
    Outputs: {
      [tableName]: {
        Description: `The name of the DynamoDB table for ${tableName}`,
        Export: {
          Name: {'Fn::Sub': `\${AWS::StackName}-${tableName}`},
        },
        Value: {Ref: tableName},
      },
    },
    Resources: {
      [tableName]: resource,
    },
  };
}

/* eslint-enable complexity */
