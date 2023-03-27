// This file is generated. Do not edit by hand.

import {placeholder} from '@check-run-reporter/trigger--account--upsert';

import {makeReactorHandler} from '@code-like-a-carpenter/foundation-runtime';

import {unmarshallAccount} from '../graphql';
import type {Account} from '../graphql';

export const handler = makeReactorHandler<Account>(placeholder, {
  unmarshallSourceModel: unmarshallAccount,
});
