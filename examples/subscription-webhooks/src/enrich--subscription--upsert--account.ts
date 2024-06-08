import {Enricher} from '@code-like-a-carpenter/foundation-runtime';

import type {
  Account,
  CreateAccountInput,
  SubscriptionEvent,
  UpdateAccountInput,
} from '../__generated__/graphql.ts';
import {readAccount} from '../__generated__/graphql.ts';

export class SubscriptionEventUpsertAccountEnricher extends Enricher<
  SubscriptionEvent,
  Account,
  CreateAccountInput,
  UpdateAccountInput
> {
  async create(
    subscription: SubscriptionEvent
  ): Promise<CreateAccountInput | undefined> {
    if (subscription.cancelled) {
      // depending on your use case, it may make sense to throw here or to fetch
      // here.
      return;
    }

    return {
      cancelled: false,
      effectiveDate: subscription.effectiveDate,
      externalId: subscription.externalId,
      hasEverSubscribed: !!subscription.planName,
      monthlyPriceInCents: subscription.monthlyPriceInCents,
      onFreeTrial: subscription.onFreeTrial,
      planName: subscription.planName,
    };
  }

  async load(subscription: SubscriptionEvent): Promise<Account> {
    const {item} = await readAccount({externalId: subscription.externalId});
    return item;
  }

  async update(
    subscription: SubscriptionEvent,
    account: Account
  ): Promise<UpdateAccountInput | undefined> {
    if (subscription.effectiveDate < account.effectiveDate) {
      return;
    }

    if (subscription.cancelled) {
      return {
        ...account,
        cancelled: true,
        effectiveDate: subscription.effectiveDate,
        lastPlanName: account.planName,
        onFreeTrial: false,
        planName: null,
      };
    }

    return {
      ...account,
      cancelled: false,
      effectiveDate: subscription.effectiveDate,
      hasEverSubscribed: true,
      monthlyPriceInCents: subscription.monthlyPriceInCents,
      onFreeTrial: subscription.onFreeTrial,
      planName: subscription.planName,
    };
  }
}
