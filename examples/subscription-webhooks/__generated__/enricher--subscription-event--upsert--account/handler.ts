// This file is generated. Do not edit by hand.
import {makeEnricher} from '@code-like-a-carpenter/foundation-runtime';

import * as dependencies from '../../../dependencies.mts';
import {SubscriptionEventUpsertAccountEnricher} from '../../src/enrich--subscription--upsert--account.ts';
import type {
  SubscriptionEvent,
  Account,
  CreateAccountInput,
  UpdateAccountInput,
} from '../graphql.ts';
import {
  createAccount,
  unmarshallSubscriptionEvent,
  updateAccount,
} from '../graphql.ts';

export const handler = makeEnricher<
  SubscriptionEvent,
  Account,
  CreateAccountInput,
  UpdateAccountInput
>(
  SubscriptionEventUpsertAccountEnricher,
  {
    createTargetModel: createAccount,
    unmarshallSourceModel: unmarshallSubscriptionEvent,
    updateTargetModel: updateAccount,
  },
  dependencies
);
