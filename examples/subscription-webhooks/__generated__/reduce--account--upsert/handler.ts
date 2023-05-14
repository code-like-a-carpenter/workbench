// This file is generated. Do not edit by hand.
import {makeMultiReducer} from '@code-like-a-carpenter/foundation-runtime';

import {AccountUpsertPlanMetricReducer} from '../../src/reduce--account--upsert--plan-metric';
import {unmarshallAccount} from '../graphql';
import type {Account} from '../graphql';

export const handler = makeMultiReducer<Account>(
  AccountUpsertPlanMetricReducer,
  {unmarshallSourceModel: unmarshallAccount}
);
