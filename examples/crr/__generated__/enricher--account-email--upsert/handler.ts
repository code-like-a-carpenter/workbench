// This file is generated. Do not edit by hand.

import {placeholder} from '@check-run-reporter/enricher--account-email--upsert--account';

import {makeEnricher} from '@code-like-a-carpenter/foundation-runtime';

import type {
  AccountEmail,
  Account,
  CreateAccountInput,
  UpdateAccountInput,
} from '../graphql';
import {createAccount, unmarshallAccountEmail, updateAccount} from '../graphql';

export const handler = makeEnricher<
  AccountEmail,
  Account,
  CreateAccountInput,
  UpdateAccountInput
>(placeholder, {
  createTargetModel: createAccount,
  unmarshallSourceModel: unmarshallAccountEmail,
  updateTargetModel: updateAccount,
});
