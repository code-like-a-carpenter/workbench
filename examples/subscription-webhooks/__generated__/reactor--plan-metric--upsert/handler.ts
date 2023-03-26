// This file is generated. Do not edit by hand.

import {makeReactorHandler} from '@code-like-a-carpenter/foundation-runtime';

import {PlanMetricUpsertReactor} from '../../src/react--plan-metric--upsert';
import {unmarshallPlanMetric} from '../graphql';
import type {PlanMetric} from '../graphql';

export const handler = makeReactorHandler<PlanMetric>(PlanMetricUpsertReactor, {
  unmarshallSourceModel: unmarshallPlanMetric,
});
