import type {
  Account,
  AccountIndexedPlanNameProvider,
} from '../__generated__/graphql';

export class AccountIndexedPlanNameProviderImpl
  implements AccountIndexedPlanNameProvider
{
  async compute(account: Account): Promise<string> {
    if (account.cancelled) {
      return account.lastPlanName;
    }
    return account.planName;
  }
}
