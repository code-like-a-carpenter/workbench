// This file is generated. Do not edit by hand.
import {makeMultiReducer} from '@code-like-a-carpenter/foundation-runtime';

import {AccountUpsertPlanMetricReducer} from '../../src/reduce--account--upsert--plan-metric';
import type {
  Account,
  PlanMetric,
  CreatePlanMetricInput,
  UpdatePlanMetricInput,
} from '../graphql';
import {
  createPlanMetric,
  unmarshallAccount,
  updatePlanMetric,
} from '../graphql';

export const handler = makeMultiReducer<
  Account,
  PlanMetric,
  CreatePlanMetricInput,
  UpdatePlanMetricInput
>(AccountUpsertPlanMetricReducer, {
  createTargetModel: createPlanMetric,
  unmarshallSourceModel: unmarshallAccount,
  updateTargetModel: updatePlanMetric,
});
