import {snakeCase} from 'lodash';

import {assert} from '@code-like-a-carpenter/assert';
import type {
  Condition,
  Table,
  TableSecondaryIndex,
} from '@code-like-a-carpenter/foundation-intermediate-representation';

import type {
  AWSDynamoDBTable,
  Model,
  Model as ServerlessApplicationModel,
} from './__generated__/serverless-application-model';
import type {Config} from './config';

export function defineTable(
  config: Config,
  {
    enableEncryption,
    enablePointInTimeRecovery,
    hasTtl,
    primaryKey: {isComposite},
    secondaryIndexes,
    tableName,
  }: Table
): ServerlessApplicationModel {
  const resource: AWSDynamoDBTable = {
    Properties: {
      AttributeDefinitions: defineAttributes(isComposite),
      BillingMode: 'PAY_PER_REQUEST',
      GlobalSecondaryIndexes: defineGSIs(secondaryIndexes),
      KeySchema: defineKeySchema(isComposite),
      LocalSecondaryIndexes: defineLSIs(secondaryIndexes),
      ...definePointInTimeRecoverySpecification(enablePointInTimeRecovery),
      ...defineSSESpecification(enableEncryption),
      Tags: [
        {
          Key: 'StageName',
          // @ts-expect-error - typedef doesn't know about Ref
          Value: {Ref: 'StageName'},
        },
        {
          Key: 'TableName',
          Value: tableName,
        },
      ],
      ...defineTTL(hasTtl),
    },
    Type: 'AWS::DynamoDB::Table',
  };

  if (resource.Properties.GlobalSecondaryIndexes?.length === 0) {
    delete resource.Properties.GlobalSecondaryIndexes;
  }

  if (resource.Properties.LocalSecondaryIndexes?.length === 0) {
    delete resource.Properties.LocalSecondaryIndexes;
  }

  return {
    Conditions: {
      ...makeCondition(config, enableEncryption),
      ...makeCondition(config, enablePointInTimeRecovery),
    },
    Globals: {
      Function: {
        Environment: {
          Variables: {
            [snakeCase(tableName).toUpperCase()]: {Ref: tableName},
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
        Value: {
          Ref: tableName,
        },
      },
    },
    Parameters: {},
    Resources: {
      [tableName]: resource,
    },
  };
}

function defineAttributes(isComposite: boolean) {
  return isComposite
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
}

function defineGSIs(secondaryIndexes: readonly TableSecondaryIndex[]) {
  return secondaryIndexes
    .filter(({type}) => type === 'gsi')
    .map((index) => {
      assert(index.type === 'gsi', 'gsi must be gsi');

      if (index.isComposite) {
        return {
          IndexName: index.name,
          KeySchema: [
            {AttributeName: `${index.name}pk`, KeyType: 'HASH'},
            {AttributeName: `${index.name}sk`, KeyType: 'RANGE'},
          ],
          Projection: {
            ProjectionType: index.projectionType.toUpperCase(),
          },
        };
      }

      return {
        IndexName: index.name,
        KeySchema: [
          {
            // FIXME This is a breaking change from @ianwremmel/data. Multi-field, simple primary keys end with "pk".
            AttributeName: index.name,
            KeyType: 'HASH',
          },
        ],
        Projection: {
          ProjectionType: index.projectionType.toUpperCase(),
        },
      };
    });
}

function defineKeySchema(isComposite: boolean) {
  return isComposite
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
}

function defineLSIs(secondaryIndexes: readonly TableSecondaryIndex[]) {
  return secondaryIndexes
    .filter(({type}) => type === 'lsi')
    .map((index) => {
      assert(index.type === 'lsi', 'lsi must be lsi');

      return {
        IndexName: index.name,
        KeySchema: [
          {AttributeName: 'pk', KeyType: 'HASH'},
          {AttributeName: `${index.name}sk`, KeyType: 'RANGE'},
        ],
        Projection: {
          ProjectionType: index.projectionType.toUpperCase(),
        },
      };
    });
}

function definePointInTimeRecoverySpecification(condition: Condition) {
  if (typeof condition === 'boolean') {
    return {
      PointInTimeRecoverySpecification: {
        PointInTimeRecoveryEnabled: condition,
      },
    };
  }

  return {
    PointInTimeRecoverySpecification: {
      PointInTimeRecoveryEnabled: {
        'Fn::If': [condition, true, false],
      },
    },
  };
}

function defineSSESpecification(condition: Condition) {
  if (typeof condition === 'boolean') {
    return {
      SSESpecification: {
        SSEEnabled: condition,
      },
    };
  }

  return {
    SSESpecification: {
      SSEEnabled: {
        'Fn::If': [condition, true, false],
      },
    },
  };
}

function defineTTL(hasTtl: boolean) {
  if (!hasTtl) {
    return undefined;
  }

  return {
    TimeToLiveSpecification: {
      AttributeName: 'ttl',
      Enabled: true,
    },
  };
}

function makeCondition(
  config: Config,
  condition: Condition
): Model['Conditions'] {
  if (typeof condition === 'boolean') {
    return {};
  }

  // @ts-expect-error - Conditions are not well-typed in the SAM typedef
  return {
    [condition]: config.conditions[condition],
  };
}
