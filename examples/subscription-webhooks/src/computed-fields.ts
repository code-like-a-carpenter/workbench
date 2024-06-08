import {FieldProvider} from '@code-like-a-carpenter/foundation-runtime';

import type {Account} from '../__generated__/graphql.ts';

export class AccountIndexedPlanNameProvider extends FieldProvider<
  Account,
  'indexedPlanName'
> {
  compute(account: Account): string | null {
    if (account.cancelled) {
      return account.lastPlanName ?? null;
    }
    return account.planName ?? null;
  }
}
