import assert from 'node:assert';
import {createRequire} from 'node:module';
import path from 'node:path';

import {globSync} from 'glob';

// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

const require = createRequire(import.meta.url);
const pkg = require('./package.json');

const setupFilesAfterEnv = ['./jest.d/setup-files-after-env/faker.ts'];

/** @type {Partial<import('@jest/types').Config.ProjectConfig>} */
const commonProjectConfig = {
  clearMocks: true,
  // The dot needs escaping: `.nx/` also matches `@clc/nx/`, which hides every
  // test in the NX plugin.
  modulePathIgnorePatterns: ['/\\.nx/'],
  prettierPath: require.resolve('prettier-2'),
  setupFilesAfterEnv,
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/dist/', '/node_modules/'],
  transformIgnorePatterns: ['.*\\.mjs'],
};

const CI = !!process.env.CI;
const {workspaces} = pkg;

assert(
  workspaces,
  'This Jest config is intended only for Monorepos and cannot work without a `workspaces` field in package.json'
);

/** @type {import('jest').Config} */
const config = {
  bail: 0,
  collectCoverage: CI,
  coverageDirectory: 'reports/coverage',

  projects: [
    {
      ...commonProjectConfig,
      displayName: 'Unit Tests',
      testMatch: workspaces
        .flatMap((ws) => globSync(ws))
        .filter(
          (packagePath) => !packagePath.split(path.sep).includes('examples')
        )
        .flatMap((packagePath) => [
          `<rootDir>/${packagePath}/**/?(*.)+(test).?(m)[tj]s?(x)`,
        ]),
    },
    {
      ...commonProjectConfig,
      displayName: 'Examples',
      setupFilesAfterEnv: [
        ...setupFilesAfterEnv,
        './jest.d/setup-files-after-env/api-gateway-stage-propagation.ts',
      ],
      testEnvironment: './jest.d/environments/example.ts',
      testMatch: workspaces
        .flatMap((ws) => globSync(ws))
        .filter((packagePath) =>
          packagePath.split(path.sep).includes('examples')
        )
        .filter(
          (packagePath) =>
            process.env.TEST_ENV === 'aws' || !packagePath.includes('aws-')
        )
        .flatMap((packagePath) => [
          `<rootDir>/${packagePath}/**/?(*.)+(test).[tj]s?(x)`,
        ]),
    },
  ],
  reporters: [
    !CI && 'default',
    CI && ['github-actions', {silent: false}],
    CI && [
      'jest-junit',
      {
        addFileAttribute: 'true', // Yep, it really needs to be a string
        ancestorSeparator: ' › ',
        classNameTemplate: '{classname}',
        includeConsoleOutput: true,
        outputDirectory: 'reports/junit',
        outputName: `jest.xml`,
        reportTestSuiteErrors: true,
        titleTemplate: '{title}',
      },
    ],
    CI && 'summary',
  ].filter(Boolean),
  testLocationInResults: true,
};

export default config;
