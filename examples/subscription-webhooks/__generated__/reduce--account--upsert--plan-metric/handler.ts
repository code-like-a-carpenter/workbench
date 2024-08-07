// This file is generated. Do not edit by hand.
import * as dependencies from '@clc/dependencies';

import {makeMultiReducer} from '@code-like-a-carpenter/foundation-runtime';

import {AccountUpsertPlanMetricReducer} from '../../src/reduce--account--upsert--plan-metric.ts';
import type {
  Account,
  PlanMetric,
  CreatePlanMetricInput,
  UpdatePlanMetricInput,
} from '../graphql.ts';
import {
  createPlanMetric,
  unmarshallAccount,
  updatePlanMetric,
} from '../graphql.ts';

export const handler = makeMultiReducer<
  Account,
  PlanMetric,
  CreatePlanMetricInput,
  UpdatePlanMetricInput
>(
  AccountUpsertPlanMetricReducer,
  {
    createTargetModel: createPlanMetric,
    unmarshallSourceModel: unmarshallAccount,
    updateTargetModel: updatePlanMetric,
  },
  dependencies
);
