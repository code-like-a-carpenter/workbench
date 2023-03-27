// This file is generated. Do not edit by hand.

import {placeholder} from '@check-run-reporter/enricher--user-email--upsert--user';

import {makeEnricher} from '@code-like-a-carpenter/foundation-runtime';

import type {
  UserEmail,
  User,
  CreateUserInput,
  UpdateUserInput,
} from '../graphql';
import {createUser, unmarshallUserEmail, updateUser} from '../graphql';

export const handler = makeEnricher<
  UserEmail,
  User,
  CreateUserInput,
  UpdateUserInput
>(placeholder, {
  createTargetModel: createUser,
  unmarshallSourceModel: unmarshallUserEmail,
  updateTargetModel: updateUser,
});
