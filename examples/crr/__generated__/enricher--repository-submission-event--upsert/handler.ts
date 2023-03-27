// This file is generated. Do not edit by hand.

import {placeholder} from '@check-run-reporter/enricher--repository-submission-event--upsert--repository';

import {makeEnricher} from '@code-like-a-carpenter/foundation-runtime';

import type {
  RepositorySubmissionEvent,
  Repository,
  CreateRepositoryInput,
  UpdateRepositoryInput,
} from '../graphql';
import {
  createRepository,
  unmarshallRepositorySubmissionEvent,
  updateRepository,
} from '../graphql';

export const handler = makeEnricher<
  RepositorySubmissionEvent,
  Repository,
  CreateRepositoryInput,
  UpdateRepositoryInput
>(placeholder, {
  createTargetModel: createRepository,
  unmarshallSourceModel: unmarshallRepositorySubmissionEvent,
  updateTargetModel: updateRepository,
});
