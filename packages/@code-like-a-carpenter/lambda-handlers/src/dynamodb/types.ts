import type {DynamoDBRecord} from 'aws-lambda';

import type {Context} from '../types';

export interface DynamoCallback {
  (record: DynamoDBRecord, context: Context): Promise<void>;
}
