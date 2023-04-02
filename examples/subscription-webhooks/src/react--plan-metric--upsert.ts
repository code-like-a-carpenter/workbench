import {blindWriteMetric, queryPlanMetric} from '../__generated__/graphql';

/** */
export async function handler(): Promise<void> {
  await Promise.all(
    [true, false].map(async (onFreeTrial) => {
      const {items: metrics} = await queryPlanMetric({onFreeTrial});

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
