// This file is generated. Do not edit by hand.

import * as dependencies from '@clc/dependencies';

import {makeDynamoDBStreamDispatcher} from '@code-like-a-carpenter/foundation-runtime';

export const handler = makeDynamoDBStreamDispatcher({
  ...dependencies,
  tableName: 'TableSubscriptionEvent',
});
