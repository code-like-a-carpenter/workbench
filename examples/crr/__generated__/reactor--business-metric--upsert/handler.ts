// This file is generated. Do not edit by hand.

import {placeholder} from '@check-run-reporter/trigger--business-metric--upsert';

import {makeReactorHandler} from '@code-like-a-carpenter/foundation-runtime';

import {unmarshallBusinessMetric} from '../graphql';
import type {BusinessMetric} from '../graphql';

export const handler = makeReactorHandler<BusinessMetric>(placeholder, {
  unmarshallSourceModel: unmarshallBusinessMetric,
});
