// This file is generated. Do not edit by hand.
import {makeEnricher} from '@code-like-a-carpenter/foundation-runtime';

import * as dependencies from '../../../dependencies';
import {SubscriptionEventUpsertAccountEnricher} from '../../src/enrich--subscription--upsert--account';
import type {
  SubscriptionEvent,
  Account,
  CreateAccountInput,
  UpdateAccountInput,
} from '../graphql';
import {
  createAccount,
  unmarshallSubscriptionEvent,
  updateAccount,
} from '../graphql';

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
