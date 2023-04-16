// This file is generated. Do not edit by hand.

import {
  expandTableNames,
  makeDynamoDBStreamDispatcher,
} from '@code-like-a-carpenter/foundation-runtime';

import * as dependencies from '../../../dependencies';

expandTableNames();

export const handler = makeDynamoDBStreamDispatcher({
  ...dependencies,
  tableName: 'TablePlanMetric',
});
