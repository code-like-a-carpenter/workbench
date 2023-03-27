// This file is generated. Do not edit by hand.

import {placeholder} from '@check-run-reporter/trigger--github-event--insert';

import {makeReactorHandler} from '@code-like-a-carpenter/foundation-runtime';

import {unmarshallGithubEvent} from '../graphql';
import type {GithubEvent} from '../graphql';

export const handler = makeReactorHandler<GithubEvent>(placeholder, {
  unmarshallSourceModel: unmarshallGithubEvent,
});
