// This file is generated. Do not edit by hand.

import {
  assert,
  makeTriggerHandler,
} from '@code-like-a-carpenter/foundation-runtime';

import {handler as cdcHandler} from '../../src/react--plan-metric--upsert';
import {unmarshallPlanMetric} from '../graphql';

export const handler = makeTriggerHandler((record) => {
  assert(
    record.dynamodb.NewImage,
    'Expected DynamoDB Record to have a NewImage'
  );
  return cdcHandler(unmarshallPlanMetric(record.dynamodb.NewImage));
});
