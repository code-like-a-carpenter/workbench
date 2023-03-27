// This file is generated. Do not edit by hand.

import {placeholder} from '@check-run-reporter/enricher--account-login--upsert--account';

import {makeEnricher} from '@code-like-a-carpenter/foundation-runtime';

import type {
  AccountLogin,
  Account,
  CreateAccountInput,
  UpdateAccountInput,
} from '../graphql';
import {createAccount, unmarshallAccountLogin, updateAccount} from '../graphql';

export const handler = makeEnricher<
  AccountLogin,
  Account,
  CreateAccountInput,
  UpdateAccountInput
>(placeholder, {
  createTargetModel: createAccount,
  unmarshallSourceModel: unmarshallAccountLogin,
  updateTargetModel: updateAccount,
});
