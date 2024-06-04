import {GetCommand} from '@aws-sdk/lib-dynamodb';

import {ddbDocClient} from './dependencies.ts';

/** Loads a record raw */
export async function load({
  tableName,
  pk,
  sk,
}: {
  tableName: string;
  pk: string;
  sk?: string;
}) {
  return ddbDocClient.send(
    new GetCommand({
      ConsistentRead: true,
      Key: sk ? {pk, sk} : {pk},
      ReturnConsumedCapacity: 'INDEXES',
      TableName: tableName,
    })
  );
}
