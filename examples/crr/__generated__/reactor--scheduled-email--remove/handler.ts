// This file is generated. Do not edit by hand.

import {placeholder} from '@check-run-reporter/trigger--scheduled-email--remove';

import {makeReactorHandler} from '@code-like-a-carpenter/foundation-runtime';

import {unmarshallScheduledEmail} from '../graphql';
import type {ScheduledEmail} from '../graphql';

export const handler = makeReactorHandler<ScheduledEmail>(placeholder, {
  unmarshallSourceModel: unmarshallScheduledEmail,
});
