// This file is generated. Do not edit by hand.

import {placeholder} from '@check-run-reporter/enricher--account-installation--upsert--account';

import {makeEnricher} from '@code-like-a-carpenter/foundation-runtime';

import type {
  AccountInstallation,
  Account,
  CreateAccountInput,
  UpdateAccountInput,
} from '../graphql';
import {
  createAccount,
  unmarshallAccountInstallation,
  updateAccount,
} from '../graphql';

export const handler = makeEnricher<
  AccountInstallation,
  Account,
  CreateAccountInput,
  UpdateAccountInput
>(placeholder, {
  createTargetModel: createAccount,
  unmarshallSourceModel: unmarshallAccountInstallation,
  updateTargetModel: updateAccount,
});
