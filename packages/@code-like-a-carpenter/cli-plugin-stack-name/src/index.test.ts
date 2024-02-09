import {execSync} from 'node:child_process';

const GITHUB_HEAD_REF = 'dependabot/npm_and_yarn/openapi-typescript-6.7.4';
const GITHUB_REF =
  'refs/heads/dependabot/npm_and_yarn/openapi-typescript-6.7.4';
const GITHUB_SHA = 'f7d69db466396454e27435e3dc4affde6a1f3263';
const BUILDKITE_BRANCH = 'dependabot/npm_and_yarn/openapi-typescript-6.7.4';
const BUILDKITE_COMMIT = 'f7d69db466396454e27435e3dc4affde6a1f3263';

const gitData = [
  {GITHUB_ACTIONS: 'true', GITHUB_SHA},
  {GITHUB_ACTIONS: 'true', GITHUB_HEAD_REF, GITHUB_SHA},
  {GITHUB_ACTIONS: 'true', GITHUB_REF, GITHUB_SHA},
  {BUILDKITE: 'true', BUILDKITE_COMMIT},
  {BUILDKITE: 'true', BUILDKITE_BRANCH, BUILDKITE_COMMIT},
];

const projectNames = [
  '@code-like-a-carpenter/tooling-common',
  '@code-like-a-carpenter/foundation-intermediate-representation',
  'aws-otel',
  'check-run-reporter',
];

const testData = projectNames
  .map((projectName) => gitData.map((env) => [projectName, env] as const))
  .flat(1);

describe('cli-plugin-stack-name', () => {
  it.each(projectNames)('formats a stack name', async (projectName) => {
    const result = execSync(
      `npx @code-like-a-carpenter/cli stack-name ${projectName}`,
      {env: {NODE_OPTIONS: process.env.NODE_OPTIONS, PATH: process.env.PATH}}
    );
    const stackName = result.toString().trim();
    expect(stackName).toMatchSnapshot();
  });

  it.each(testData)('formats a stack name in ci', async (projectName, env) => {
    const result = execSync(
      `npx @code-like-a-carpenter/cli stack-name ${projectName}`,
      {
        env: {
          ...env,
          NODE_OPTIONS: process.env.NODE_OPTIONS,
          PATH: process.env.PATH,
        },
      }
    );
    const stackName = result.toString().trim();
    expect(stackName).toMatchSnapshot();
    expect(stackName).toMatch(/^ci--/);
    expect(stackName.length).toBeLessThan(128);
  });
});
