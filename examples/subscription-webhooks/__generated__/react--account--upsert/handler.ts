// This file is generated. Do not edit by hand.

import {assert, makeReactor} from '@code-like-a-carpenter/foundation-runtime';

import {handler as cdcHandler} from '../../src/react--account--upsert';
import {unmarshallAccount} from '../graphql';

export const handler = makeReactor((record) => {
  assert(
    record.dynamodb.NewImage,
    'Expected DynamoDB Record to have a NewImage'
  );
  return cdcHandler(unmarshallAccount(record.dynamodb.NewImage));
});
