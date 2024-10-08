// This file is generated. Do not edit by hand.
import * as dependencies from '@clc/dependencies';

import {makeReducer} from '@code-like-a-carpenter/foundation-runtime';

import {PlanMetricUpsertMetricReducer} from '../../src/reduce--plan-metric--upsert--metric.ts';
import type {
  PlanMetric,
  Metric,
  CreateMetricInput,
  UpdateMetricInput,
} from '../graphql.ts';
import {createMetric, unmarshallPlanMetric, updateMetric} from '../graphql.ts';

export const handler = makeReducer<
  PlanMetric,
  Metric,
  CreateMetricInput,
  UpdateMetricInput
>(
  PlanMetricUpsertMetricReducer,
  {
    createTargetModel: createMetric,
    unmarshallSourceModel: unmarshallPlanMetric,
    updateTargetModel: updateMetric,
  },
  dependencies
);
