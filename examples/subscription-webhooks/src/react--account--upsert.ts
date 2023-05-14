import {Reactor} from '@code-like-a-carpenter/foundation-runtime';

import {blindWritePlanMetric, queryAccount} from '../__generated__/graphql';
import type {Account} from '../__generated__/graphql';

/**
 * This reactor cannot be a reducer because it updates two different metrics:
 * when an account transitions from a free trial to a paying customer, this
 * reactor updates both the active and trial metrics.
 */
export class AccountUpsertReactor extends Reactor<Account> {
  protected async handle(account: Account): Promise<void> {
    if (account.cancelled && account.lastPlanName) {
      await this.generate(account.cancelled, account.lastPlanName);
    } else if (!account.cancelled && account.planName) {
      await this.generate(account.cancelled, account.planName);
    }
  }

  protected async generate(
    cancelled: boolean,
    planName: string
  ): Promise<void> {
    const {items: accounts} = await queryAccount({
      cancelled,
      hasEverSubscribed: true,
      index: 'gsi1',
      indexedPlanName: planName,
    });

    const {active, trial} = accounts.reduce(
      (acc, account) => {
        if (account.onFreeTrial) {
          acc.trial.count += 1;
          acc.trial.monthlyRecurringRevenueInCents +=
            account.monthlyPriceInCents ?? 0;
        } else {
          acc.active.count += 1;
          acc.active.monthlyRecurringRevenueInCents +=
            account.monthlyPriceInCents ?? 0;
        }

        return acc;
      },
      {
        active: {
          cancelled,
          count: 0,
          monthlyRecurringRevenueInCents: 0,
          onFreeTrial: false,
          planName,
        },
        trial: {
          cancelled,
          count: 0,
          monthlyRecurringRevenueInCents: 0,
          onFreeTrial: true,
          planName,
        },
      }
    );
    await Promise.all([
      blindWritePlanMetric(active),
      blindWritePlanMetric(trial),
    ]);
  }
}
