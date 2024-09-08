import {formatStackName} from './format-stack-name.mjs';

const GITHUB_HEAD_REF = 'dependabot/npm_and_yarn/openapi-typescript-6.7.4';
const GITHUB_REF =
  'refs/heads/dependabot/npm_and_yarn/openapi-typescript-6.7.4';
const GITHUB_SHA = 'f7d69db466396454e27435e3dc4affde6a1f3263';
const BUILDKITE_BRANCH = 'dependabot/npm_and_yarn/openapi-typescript-6.7.4';
const BUILDKITE_COMMIT = 'f7d69db466396454e27435e3dc4affde6a1f3263';

const gitData = [
  {ci: true, sha: GITHUB_SHA},
  {ci: true, fullRef: GITHUB_HEAD_REF, sha: GITHUB_SHA},
  {ci: true, ref: GITHUB_REF, sha: GITHUB_SHA},
  {ci: true, sha: BUILDKITE_COMMIT},
  {ci: true, ref: BUILDKITE_BRANCH, sha: BUILDKITE_COMMIT},
];

const projectNames = [
  '@code-like-a-carpenter/tooling-common',
  '@code-like-a-carpenter/foundation-intermediate-representation',
  'aws-otel',
  'check-run-reporter',
];

const testData = projectNames
  .map((projectName) =>
    gitData.map((env) => {
      /** @type {[string, {ci: boolean, fullRef?: string, sha: string, ref?: string}]} */
      const ret = [projectName, env];
      return ret;
    })
  )
  .flat(1);

describe('formatStackName()', () => {
  it.each(projectNames)(
    'converts a project name to a stack name',
    (projectName) => {
      const stackName = formatStackName({ci: false, projectName});
      expect(stackName).toMatchSnapshot();
      expect(stackName.length).toBeLessThan(128);
    }
  );

  it.each(testData)(
    'converts a project name to a stack name in ci',
    (projectName, env) => {
      const stackName = formatStackName({projectName, ...env});
      expect(stackName).toMatchSnapshot();
      expect(stackName).toMatch(/^ci--/);
      expect(stackName.length).toBeLessThan(128);
    }
  );

  it.each(testData)(
    'converts a project name to a stack name in ci in prod',
    (projectName, env) => {
      const stackName = formatStackName({projectName, ...env, isProd: true});
      expect(stackName).toMatchSnapshot();
      expect(stackName.length).toBeLessThan(128);
    }
  );
});
