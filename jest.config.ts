import assert from 'node:assert';

import type {Config} from '@jest/types';
import glob from 'glob';
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

const commonProjectConfig: Config.ProjectConfig = {
  clearMocks: true,
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/dist/', '/node_modules/'],
  transform: {
    // jest uses babel-jest by default, but only if it can find a babel config
    // file. I'd like to avoid relying on babel for as long as possible, so I'm
    // using esbuild-jest here instead, which requires zero config.
    // @ts-expect-error
    '^.+\\.tsx?$': 'esbuild-jest',
  },
};

const CI = !!process.env.CI;
const {workspaces} = pkg;

assert(
  workspaces,
  'This Jest config is intended only for Monorepos and cannot work without a `workspaces` field in package.json'
);

/** @type {import('@jest/types').Config.GlobalConfig} */
module.exports = {
  bail: 0,
  collectCoverage: CI,
  coverageDirectory: 'reports/coverage',

  projects: [
    {
      ...commonProjectConfig,
      displayName: 'Unit Tests',
      testMatch: workspaces
        .flatMap((ws) => glob.sync(ws))
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
