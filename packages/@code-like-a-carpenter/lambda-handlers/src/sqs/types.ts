import type {SQSRecord} from 'aws-lambda';

import type {Context} from '../types';

export interface SQSCallback {
  (record: SQSRecord, context: Context): Promise<void>;
}
