import assert from 'node:assert';
import path from 'node:path';

import type {Config} from '@jest/types';
import {globSync} from 'glob';
// For a detailed explanation regarding each configuration property, visit:
// https://jestjs.io/docs/en/configuration.html

import pkg from './package.json';

// This is a hack to get around the fact that no one seems to be maintaining the
// Jest types https://github.com/facebook/jest/issues/11640
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace NodeJS {
    // eslint-disable-next-line @typescript-eslint/no-empty-interface
    interface Global {}
  }
}

const commonProjectConfig: Partial<Config.ProjectConfig> = {
  clearMocks: true,
  modulePathIgnorePatterns: ['.nx/'],
  prettierPath: require.resolve('prettier-2'),
  setupFilesAfterEnv: ['./jest.d/setup-files-after-env/faker.ts'],
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/dist/', '/node_modules/'],
};

const CI = !!process.env.CI;
const {workspaces} = pkg;

assert(
  workspaces,
  'This Jest config is intended only for Monorepos and cannot work without a `workspaces` field in package.json'
);

const config: Config.GlobalConfig = {
  bail: 0,
  collectCoverage: CI,
  coverageDirectory: 'reports/coverage',

  projects: [
    // @ts-expect-error - types seem wrong
    {
      ...commonProjectConfig,
      displayName: 'Unit Tests',
      testMatch: workspaces
        .flatMap((ws) => globSync(ws))
        .filter(
          (packagePath) => !packagePath.split(path.sep).includes('examples')
        )
        .flatMap((packagePath) => [
          `<rootDir>/${packagePath}/**/?(*.)+(test).[tj]s?(x)`,
        ]),
    },
    // @ts-expect-error - types seem wrong
    {
      ...commonProjectConfig,
      displayName: 'Examples',
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
  // @ts-expect-error - types seem wrong
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
