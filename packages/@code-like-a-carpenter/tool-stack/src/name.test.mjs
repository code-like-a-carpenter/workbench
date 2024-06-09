import {execSync} from 'node:child_process';

const GITHUB_HEAD_REF = 'dependabot/npm_and_yarn/openapi-typescript-6.7.4';
const GITHUB_REF =
  'refs/heads/dependabot/npm_and_yarn/openapi-typescript-6.7.4';
const GITHUB_SHA = 'f7d69db466396454e27435e3dc4affde6a1f3263';
const BUILDKITE_BRANCH = 'dependabot/npm_and_yarn/openapi-typescript-6.7.4';
const BUILDKITE_COMMIT = 'f7d69db466396454e27435e3dc4affde6a1f3263';

/** @type {Array<Record<string, string>>} */
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
];

const stackNames = ['check-run-reporter'];

const testDataForProjects = projectNames
  .map((projectName) =>
    gitData.map((env) => {
      /** @type {[string, Record<string, string>]} */
      const ret = [projectName, env];
      return ret;
    })
  )
  .flat(1);

const testDataForStacks = stackNames
  .map((stackName) =>
    gitData.map((env) => {
      /** @type {[string, Record<string, string>]} */
      const ret = [stackName, env];
      return ret;
    })
  )
  .flat(1);

describe('cli-plugin-stack-name', () => {
  it.each(projectNames)('formats a project name', async (projectName) => {
    const result = execSync(
      `npx @code-like-a-carpenter/cli stack:name --project-name ${projectName}`,
      {env: {NODE_OPTIONS: process.env.NODE_OPTIONS, PATH: process.env.PATH}}
    );
    const stackName = result.toString().trim();
    expect(stackName).toMatchSnapshot();
  });

  it.each(testDataForProjects)(
    'formats a project name in ci',
    async (projectName, env) => {
      const result = execSync(
        `npx @code-like-a-carpenter/cli stack:name --project-name ${projectName}`,
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
    }
  );

  it.each(stackNames)('formats a stack name', async (name) => {
    const result = execSync(
      `npx @code-like-a-carpenter/cli stack:name --name ${name}`,
      {env: {NODE_OPTIONS: process.env.NODE_OPTIONS, PATH: process.env.PATH}}
    );
    const stackName = result.toString().trim();
    expect(stackName).toMatchSnapshot();
  });

  it.each(testDataForStacks)(
    'formats a stack name in ci',
    async (name, env) => {
      const result = execSync(
        `npx @code-like-a-carpenter/cli stack:name --name ${name}`,
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
    }
  );
});
