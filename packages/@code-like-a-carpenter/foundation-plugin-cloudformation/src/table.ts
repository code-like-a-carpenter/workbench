import type {Table} from '@code-like-a-carpenter/foundation-intermediate-representation';

import type {AWSDynamoDBTable} from './__generated__/json-schemas/serverless-application-model.ts';
import type {ServerlessApplicationModel} from './types.ts';

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
    ? expandCompositeAttribute('pk', 'sk')
    : expandSimpleAttribute('pk');

  const keySchema = isComposite
    ? expandCompositeKey('pk', 'sk')
    : expandSimpleKey('pk');

  const globalSecondaryIndexes = [];
  const localSecondaryIndexes = [];

  for (const index of secondaryIndexes) {
    if (index.type === 'gsi') {
      attributeDefinitions.push(
        ...(index.isComposite
          ? expandCompositeAttribute(index.partitionKeyName, index.sortKeyName)
          : expandSimpleAttribute(index.partitionKeyName))
      );
      const gsiKeySchema = index.isComposite
        ? expandCompositeKey(index.partitionKeyName, index.sortKeyName)
        : expandSimpleKey(index.partitionKeyName);
      globalSecondaryIndexes.push({
        IndexName: index.name,
        KeySchema: gsiKeySchema,
        Projection: {
          ProjectionType: index.projectionType.toUpperCase(),
        },
      });
    } else if (index.type === 'lsi') {
      attributeDefinitions.push(...expandSimpleAttribute(index.sortKeyName));
      const lsiKeySchema = expandCompositeKey(
        index.partitionKeyName,
        index.sortKeyName
      );
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
      SSESpecification: {
        // @ts-expect-error typedef doesn't include intrinsic functions
        SSEEnabled: {'Fn::If': ['IsProd', true, false]},
      },
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
      ...conditionalObject(enableStreaming, {
        StreamSpecification: {
          StreamViewType: 'NEW_AND_OLD_IMAGES',
        },
      }),
      ...conditionalObject(enablePointInTimeRecovery, {
        PointInTimeRecoverySpecification: {
          PointInTimeRecoveryEnabled: {'Fn::If': ['IsProd', true, false]},
        },
      }),
      ...conditionalObject(hasTtl, {
        TimeToLiveSpecification: {
          AttributeName: 'ttl',
          Enabled: true,
        },
      }),
    },
    Type: 'AWS::DynamoDB::Table',
  };

  return {
    Conditions: {
      IsProd: {'Fn::Equals': [{Ref: 'StageName'}, 'production']},
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

function expandCompositeAttribute(pk: string, sk: string) {
  return [
    {AttributeName: pk, AttributeType: 'S'},
    {AttributeName: sk, AttributeType: 'S'},
  ];
}

function expandSimpleAttribute(pk: string) {
  return [{AttributeName: pk, AttributeType: 'S'}];
}

function expandCompositeKey(pk: string, sk: string) {
  return [
    {AttributeName: pk, KeyType: 'HASH'},
    {AttributeName: sk, KeyType: 'RANGE'},
  ];
}

function expandSimpleKey(pk: string) {
  return [{AttributeName: pk, KeyType: 'HASH'}];
}

function conditionalObject(condition: boolean, object: object) {
  return condition ? object : {};
}
