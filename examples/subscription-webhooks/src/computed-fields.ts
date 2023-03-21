import {AccountIndexedPlanNameProvider} from '../__generated__/graphql';
import type {Account} from '../__generated__/graphql';

export class AccountIndexedPlanNameProviderImpl extends AccountIndexedPlanNameProvider {
  protected _compute(account: Account): string | null {
    if (account.cancelled) {
      return account.lastPlanName ?? null;
    }
    return account.planName ?? null;
  }
}
