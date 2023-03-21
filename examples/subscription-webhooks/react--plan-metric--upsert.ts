import {Reactor} from '@code-like-a-carpenter/foundation-runtime';

import {blindWriteMetric, queryPlanMetric} from '../__generated__/graphql';
import type {PlanMetric} from '../__generated__/graphql';

export class PlanMetricUpsertReactor extends Reactor<PlanMetric> {
  protected async handle(): Promise<void> {
    await Promise.all(
      [true, false].map(async (onFreeTrial) => {
        const {items: metrics} = await queryPlanMetric(
          {onFreeTrial},
          {consistent: true}
        );

        const metric = metrics.reduce(
          (acc, m) => {
            acc.count += m.count;
            acc.monthlyRecurringRevenueInCents +=
              m.monthlyRecurringRevenueInCents;
            return acc;
          },
          {
            count: 0,
            monthlyRecurringRevenueInCents: 0,
            onFreeTrial,
          }
        );

        await blindWriteMetric(metric);
      })
    );
  }
}
