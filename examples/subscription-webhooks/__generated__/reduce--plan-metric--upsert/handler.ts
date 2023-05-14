// This file is generated. Do not edit by hand.
import {makeReducer} from '@code-like-a-carpenter/foundation-runtime';

import {PlanMetricUpsertMetricReducer} from '../../src/reduce--plan-metric--upsert--metric';
import {unmarshallPlanMetric} from '../graphql';
import type {PlanMetric} from '../graphql';

export const handler = makeReducer<PlanMetric>(PlanMetricUpsertMetricReducer, {
  unmarshallSourceModel: unmarshallPlanMetric,
});
