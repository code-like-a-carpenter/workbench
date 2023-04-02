import type {Account} from '../__generated__/graphql';

/**
 * Computes the indexable plan name from either the current plan name or the
 * last plan name if the account is cancelled
 */
export function computeIndexedPlanName({
  cancelled,
  lastPlanName,
  planName,
}: Account) {
  return cancelled ? lastPlanName : planName;
}
