import {readFile} from 'node:fs/promises';
import path from 'node:path';

import type {CreateNodesFunction, TargetConfiguration} from '@nx/devkit';

export const createPackageNodes: CreateNodesFunction = async (
  projectConfigurationFile
) => {
  const projectRoot = path.dirname(projectConfigurationFile);
  const pkg = JSON.parse(await readFile(projectConfigurationFile, 'utf8'));
  const projectName = pkg.name;

  const targets: Record<string, TargetConfiguration> = {
    build: {
      cache: true,
      dependsOn: [
        'build-cjs',
        'build-esm',
        'build-json-schemas',
        'build-readme',
        'build-types',
        '^build',
      ],
      executor: 'nx:noop',
    },
    'build-cjs': {
      cache: true,
      executor: '@code-like-a-carpenter/nx:esbuild',
      inputs: ['{projectRoot}/src/**/*', 'sharedGlobals'],
      options: {
        entryPoints: ['{projectRoot}/src/**/*.[jt]s?(x)', '!**/*.test.*'],
        format: 'cjs',
        outDir: '{projectRoot}/dist/cjs',
      },
      outputs: ['{projectRoot}/dist/cjs'],
    },
    'build-esm': {
      cache: true,
      executor: '@code-like-a-carpenter/nx:esbuild',
      inputs: ['{projectRoot}/src/**/*', 'sharedGlobals'],
      options: {
        entryPoints: ['{projectRoot}/src/**/*.[jt]s?(x)', '!**/*.test.*'],
        format: 'esm',
        outDir: '{projectRoot}/dist/esm',
      },
      outputs: ['{projectRoot}/dist/esm'],
    },
    'build-json-schemas': {
      cache: true,
      executor: '@code-like-a-carpenter/nx:json-schema',
      inputs: ['{projectRoot}/json-schemas/**/*.json'],
      options: {
        outDir: '{projectRoot}/src/__generated__/',
        schemas: ['{projectRoot}/json-schemas/**/*.json'],
      },
      outputs: ['{projectRoot}/src/__generated__/json-schemas/**/*.d.ts'],
    },
    'build-package': {
      cache: true,
      executor: 'nx:run-commands',
      inputs: [
        '{projectRoot}/src/**/*',
        '{workspaceRoot}/package.json',
        'sharedGlobals',
      ],
      options: {
        command: `node ./packages/@code-like-a-carpenter/nx-auto/ package --package-name {projectName}`,
      },
      outputs: ['{projectRoot}/package.json'],
    },
    'build-project-refs': {
      cache: true,
      dependsOn: ['build-package', '^build-project-refs'],
      executor: 'nx:run-commands',
      inputs: ['{projectRoot}/package.json', 'sharedGlobals'],
      options: {
        command: `node ./packages/@code-like-a-carpenter/nx-auto/ project-refs --package-name {projectName}`,
      },
      outputs: ['{projectRoot}/tsconfig.json', '{workspaceRoot}/tsconfig.json'],
    },
    'build-readme': {
      cache: true,
      dependsOn: ['build-package'],
      executor: 'nx:run-commands',
      inputs: [
        '{projectRoot}/README.md',
        '{projectRoot}/package.json',
        '{workspaceRoot}/package.json',
        'sharedGlobals',
      ],
      options: {
        command: `node ./packages/@code-like-a-carpenter/nx-auto/ readme --package-name {projectName}`,
      },
      outputs: ['{projectRoot}/README.md'],
    },
    'build-types': {
      cache: true,
      dependsOn: ['build-project-refs', '^build-types'],
      executor: 'nx:run-commands',
      inputs: ['{projectRoot}/src/**/*', 'sharedGlobals'],
      options: {
        command: `tsc --project {projectRoot}/tsconfig.json`,
      },
      outputs: ['{projectRoot}/dist/types'],
    },
  };

  if (
    projectName ===
    '@code-like-a-carpenter/foundation-intermediate-representation'
  ) {
    targets['build-cjs'].dependsOn = ['build-core-schema'];
    targets['build-esm'].dependsOn = ['build-core-schema'];
    targets['build-core-schema'] = {
      cache: true,
      executor: 'nx:run-commands',
      inputs: ['{projectRoot}/schema.graphqls', 'sharedGlobals'],
      options: {
        command:
          'node ./packages/@code-like-a-carpenter/nx-auto/ inliner --export-name schema --source-file {projectRoot}/schema.graphqls --target-file {projectRoot}/src/__generated__/schema.ts',
      },
      outputs: ['{projectRoot}/src/__generated__/schema.ts'],
    };
  }

  return {
    projects: {
      [projectRoot]: {
        targets,
      },
    },
  };
};
