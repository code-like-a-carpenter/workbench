import path from 'node:path';

import type {CreateNodesFunction, TargetConfiguration} from '@nx/devkit';
import {glob} from 'glob';

export const createCliNodes: CreateNodesFunction = async (
  projectConfigurationFile
) => {
  const projectRoot = path.dirname(projectConfigurationFile);

  const srcDir = path.join('.', projectRoot, 'src');

  const entryPoints = (await glob(`${srcDir}/**/*.ts?(x)`))
    .filter((filePath) => !filePath.includes('.test.'))
    .join(' ');

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
      executor: 'nx:run-commands',
      inputs: ['{projectRoot}/src/**/*', 'sharedGlobals'],
      options: {
        command: `esbuild ${entryPoints} --format=cjs --outdir={projectRoot}/dist/cjs --platform=node --sourcemap=external`,
      },
      outputs: ['{projectRoot}/dist/cjs'],
    },
    'build-esm': {
      cache: true,
      executor: 'nx:run-commands',
      inputs: ['{projectRoot}/src/**/*', 'sharedGlobals'],
      options: {
        command: `esbuild ${entryPoints} --format=esm --outdir={projectRoot}/dist/esm --platform=node --sourcemap=external`,
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
        command: `node ./packages/@code-like-a-carpenter/nx-auto/ package --package-name {projectName} --type="cli"`,
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

  return {
    projects: {
      [projectRoot]: {
        targets,
      },
    },
  };
};
