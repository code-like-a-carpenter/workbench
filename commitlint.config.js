'use strict';

const IS_DBOT = (
  process.env.GITHUB_REF ||
  process.env.BUILDKITE_BRANCH ||
  ''
).includes('dependabot');

const IS_MERGEQUEUE = (process.env.GITHUB_REF || '').includes(
  'gh-readonly-queue'
);

const ignoreLength = IS_MERGEQUEUE || IS_DBOT;

module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'body-max-line-length': [2, 'always', ignoreLength ? Infinity : 100],
    'footer-max-line-length': [2, 'always', ignoreLength ? Infinity : 100],
    'header-max-length': [2, 'always', ignoreLength ? Infinity : 100],
  },
};
