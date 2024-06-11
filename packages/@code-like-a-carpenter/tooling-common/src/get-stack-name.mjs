import assert from 'node:assert';

import ci from 'ci-info';

import {env} from '@code-like-a-carpenter/env';

import {formatStackName} from './format-stack-name.mjs';

// Reminder: there's no good way to test this because `ci-info` does its thing
// before we'd have a chance to mock it.
/**
 * Get the stack name for a project
 *
 * @param {string} projectName
 * @returns {string}
 */
export function getStackName(projectName) {
  if (!ci.isCI) {
    return formatStackName({ci: false, projectName});
  }
  if (ci.BUILDKITE) {
    return formatStackName({
      ci: true,
      projectName,
      ref: env('BUILDKITE_BRANCH', ''),
      sha: env('BUILDKITE_COMMIT'),
    });
  }

  if (ci.GITHUB_ACTIONS) {
    return formatStackName({
      ci: true,
      fullRef: env('GITHUB_HEAD_REF', ''),
      projectName,
      ref: env('GITHUB_REF', ''),
      sha: env('GITHUB_SHA'),
    });
  }

  assert.fail(
    `"${ci.name}" is not a configured CI environment. Please update this file to support it.`
  );
}
