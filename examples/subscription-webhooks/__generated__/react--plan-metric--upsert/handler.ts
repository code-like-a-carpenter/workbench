// This file is generated. Do not edit by hand.
import {
  expandTableNames,
  makeReactor,
} from '@code-like-a-carpenter/foundation-runtime';

import {PlanMetricUpsertReactor} from '../../src/react--plan-metric--upsert';
import {unmarshallPlanMetric} from '../graphql';
import type {PlanMetric} from '../graphql';

expandTableNames();

export const handler = makeReactor<PlanMetric>(PlanMetricUpsertReactor, {
  unmarshallSourceModel: unmarshallPlanMetric,
});
