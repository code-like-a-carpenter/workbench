import {Reducer} from '@code-like-a-carpenter/foundation-runtime';

import type {
  CreateMetricInput,
  Metric,
  PlanMetric,
  UpdateMetricInput,
} from '../__generated__/graphql.ts';
import {queryPlanMetric, readMetric} from '../__generated__/graphql.ts';

export class PlanMetricUpsertMetricReducer extends Reducer<
  PlanMetric,
  Metric,
  CreateMetricInput,
  UpdateMetricInput
> {
  protected async loadTarget(source: PlanMetric): Promise<Metric> {
    const {item} = await readMetric({onFreeTrial: source.onFreeTrial});
    return item;
  }

  protected async loadSources(source: PlanMetric): Promise<PlanMetric[]> {
    const {items} = await queryPlanMetric({
      onFreeTrial: source.onFreeTrial,
      planName: source.planName,
    });
    return items;
  }

  protected async create(
    source: PlanMetric,
    sources: PlanMetric[]
  ): Promise<CreateMetricInput | undefined> {
    return this.generate(source, sources);
  }

  protected async update(
    source: PlanMetric,
    sources: PlanMetric[],
    target: Metric
  ): Promise<UpdateMetricInput | undefined> {
    return {...target, ...this.generate(source, sources)};
  }

  private generate(source: PlanMetric, sources: PlanMetric[]) {
    return sources.reduce(
      (acc, m) => {
        acc.count += m.count;
        acc.monthlyRecurringRevenueInCents += m.monthlyRecurringRevenueInCents;
        return acc;
      },
      {
        count: 0,
        monthlyRecurringRevenueInCents: 0,
        onFreeTrial: source.onFreeTrial,
      }
    );
  }
}
