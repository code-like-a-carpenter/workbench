import {assert} from '@code-like-a-carpenter/assert';
import {MultiReducer} from '@code-like-a-carpenter/foundation-runtime';

import type {
  Account,
  CreatePlanMetricInput,
  PlanMetric,
  UpdatePlanMetricInput,
  QueryAccountInput,
  QueryPlanMetricInput,
} from '../__generated__/graphql.ts';
import {queryAccount, queryPlanMetric} from '../__generated__/graphql.ts';

export class AccountUpsertPlanMetricReducer extends MultiReducer<
  Account,
  PlanMetric,
  CreatePlanMetricInput,
  UpdatePlanMetricInput
> {
  protected async loadSources(
    source: Account,
    previous: Account
  ): Promise<Account[]> {
    if (!previous) {
      const {items: accounts} = await queryAccount({
        cancelled: source.cancelled,
        hasEverSubscribed: true,
        index: 'gsi1',
        indexedPlanName: source.planName,
      });

      return accounts;
    }

    const changes = this.detectChanges(source, previous);

    let queryInput: QueryAccountInput = {
      hasEverSubscribed: true,
      index: 'gsi1',
    };
    if (!changes.has('cancelled')) {
      queryInput = {...queryInput, cancelled: source.cancelled};
    }
    if (!changes.has('planName')) {
      queryInput = {...queryInput, indexedPlanName: source.planName};
    }

    const {items} = await queryAccount(queryInput);
    return items;
  }

  protected async loadTargets(
    source: Account,
    previous: Account | undefined
  ): Promise<PlanMetric[]> {
    const changes = this.detectChanges(source, previous);

    let queryInput: QueryPlanMetricInput = {};
    if (!changes.has('onFreeTrial')) {
      queryInput = {...queryInput, onFreeTrial: source.onFreeTrial};
    }
    if (!changes.has('planName')) {
      queryInput = {...queryInput, planName: source.planName};
    }

    const {items} = await queryPlanMetric(queryInput);

    return items;
  }

  protected async createOrUpdate(
    source: Account,
    sources: Account[],
    targets: PlanMetric[],
    previous: Account | undefined
  ): Promise<(CreatePlanMetricInput | UpdatePlanMetricInput)[]> {
    const {before, after} = sources.reduce(
      (acc, a) => {
        if (
          a.cancelled === source.cancelled &&
          a.onFreeTrial === source.onFreeTrial &&
          a.planName === source.planName
        ) {
          acc.after.count++;
          acc.after.monthlyRecurringRevenueInCents +=
            a.monthlyPriceInCents ?? 0;
        } else {
          assert(
            a.cancelled === previous?.cancelled &&
              a.onFreeTrial === previous?.onFreeTrial &&
              a.planName === previous?.planName,
            'Account does not match previous account'
          );
          acc.before.count++;
          acc.before.monthlyRecurringRevenueInCents +=
            a.monthlyPriceInCents ?? 0;
        }

        return acc;
      },
      {
        after: {
          ...targets.find(
            (t) =>
              t.cancelled === source.cancelled &&
              t.onFreeTrial === source.onFreeTrial &&
              t.planName === source.planName
          ),
          cancelled: source.cancelled,
          count: 0,
          monthlyRecurringRevenueInCents: 0,
          onFreeTrial: source.onFreeTrial,
          planName: source.planName,
        } satisfies CreatePlanMetricInput | UpdatePlanMetricInput,
        before: {
          ...targets.find(
            (t) =>
              t.cancelled === previous?.cancelled &&
              t.onFreeTrial === previous?.onFreeTrial &&
              t.planName === previous?.planName
          ),
          cancelled: previous?.cancelled ?? source.cancelled,
          count: 0,
          monthlyRecurringRevenueInCents: 0,
          onFreeTrial: previous?.onFreeTrial ?? source.cancelled,
          planName: previous?.planName ?? source.planName,
        } satisfies CreatePlanMetricInput | UpdatePlanMetricInput,
      }
    );
    if (previous) {
      return [after, before];
    }
    return [after];
  }

  private detectChanges(
    source: Account,
    previous: Account | undefined
  ): Set<string> {
    const changes = new Set<string>();
    // if previous does not exist, this is not strictly a change and we only
    // care about updating the target that matches the new value, not all
    // possible target values
    if (previous && source.cancelled !== previous.cancelled) {
      changes.add('cancelled');
    }
    // if previous does not exist, this is not strictly a change and we only
    // care about updating the target that matches the new value, not all
    // possible target values
    if (previous && source.planName !== previous.planName) {
      changes.add('planName');
    }
    // if previous does not exist, this is not strictly a change and we only
    // care about updating the target that matches the new value, not all
    // possible target values
    if (previous && source.onFreeTrial !== previous.onFreeTrial) {
      changes.add('onFreeTrial');
    }
    return changes;
  }
}
