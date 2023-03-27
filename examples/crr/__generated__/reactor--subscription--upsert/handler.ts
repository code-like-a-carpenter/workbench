// This file is generated. Do not edit by hand.

import {placeholder} from '@check-run-reporter/trigger--subscription--upsert';

import {makeReactorHandler} from '@code-like-a-carpenter/foundation-runtime';

import {unmarshallSubscription} from '../graphql';
import type {Subscription} from '../graphql';

export const handler = makeReactorHandler<Subscription>(placeholder, {
  unmarshallSourceModel: unmarshallSubscription,
});
