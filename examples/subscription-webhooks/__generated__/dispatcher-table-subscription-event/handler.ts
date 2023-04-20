// This file is generated. Do not edit by hand.

import {
  expandEnvironmentVariables,
  makeDynamoDBStreamDispatcher,
} from '@code-like-a-carpenter/foundation-runtime';

import * as dependencies from '../../../dependencies';

expandEnvironmentVariables();

export const handler = makeDynamoDBStreamDispatcher({
  ...dependencies,
  tableName: 'TableSubscriptionEvent',
});
