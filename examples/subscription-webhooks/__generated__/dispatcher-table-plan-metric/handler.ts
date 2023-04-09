// This file is generated. Do not edit by hand.

import {makeDynamoDBStreamDispatcher} from '@code-like-a-carpenter/foundation-runtime';

import * as dependencies from '../../../dependencies';

export const handler = makeDynamoDBStreamDispatcher({
  ...dependencies,
  tableName: 'TablePlanMetric',
});
