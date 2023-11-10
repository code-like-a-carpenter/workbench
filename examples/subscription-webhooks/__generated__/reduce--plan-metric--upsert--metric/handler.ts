// This file is generated. Do not edit by hand.
import {makeReducer} from '@code-like-a-carpenter/foundation-runtime';

import * as dependencies from '../../../dependencies';
import {PlanMetricUpsertMetricReducer} from '../../src/reduce--plan-metric--upsert--metric';
import type {
  PlanMetric,
  Metric,
  CreateMetricInput,
  UpdateMetricInput,
} from '../graphql';
import {createMetric, unmarshallPlanMetric, updateMetric} from '../graphql';

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
