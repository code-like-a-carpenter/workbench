// This file is generated. Do not edit by hand.

import {placeholder} from '@check-run-reporter/enricher--user-login--upsert--user';

import {makeEnricher} from '@code-like-a-carpenter/foundation-runtime';

import type {
  UserLogin,
  User,
  CreateUserInput,
  UpdateUserInput,
} from '../graphql';
import {createUser, unmarshallUserLogin, updateUser} from '../graphql';

export const handler = makeEnricher<
  UserLogin,
  User,
  CreateUserInput,
  UpdateUserInput
>(placeholder, {
  createTargetModel: createUser,
  unmarshallSourceModel: unmarshallUserLogin,
  updateTargetModel: updateUser,
});
