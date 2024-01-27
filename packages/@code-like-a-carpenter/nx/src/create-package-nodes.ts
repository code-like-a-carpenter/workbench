import assert from 'node:assert';
import {readFile} from 'node:fs/promises';
import path from 'node:path';

import type {CreateNodesFunction, TargetConfiguration} from '@nx/devkit';
import {glob} from 'glob';

export const createPackageNodes: CreateNodesFunction = async (
  projectConfigurationFile
) => {
  const projectRoot = path.dirname(projectConfigurationFile);
  const pkg = JSON.parse(await readFile(projectConfigurationFile, 'utf8'));
  const projectName = pkg.name;

  const srcDir = path.join('.', projectRoot, 'src');

  const entryPoints = (await glob(`${srcDir}/**/*.ts?(x)`))
    .filter((filePath) => !filePath.includes('.test.'))
    .join(' ');

  let targets: Record<string, TargetConfiguration> = {
    build: {
      cache: true,
      dependsOn: [
        'build-cjs',
        'build-esm',
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

  const jsonSchemas = glob.sync('*.json', {
    cwd: path.join(projectRoot, 'json-schemas'),
  });

  if (jsonSchemas.length > 0) {
    targets = {
      ...targets,
      'build-json-schemas': {
        cache: true,
        executor: 'nx:run-commands',
        inputs: jsonSchemas.map(
          (filePath) => `{projectRoot}/json-schemas/${filePath}`
        ),
        options: {
          command: [
            ...jsonSchemas.map(
              (filepath) =>
                `npx --no-install json2ts {projectRoot}/json-schemas/${filepath} {projectRoot}/src/__generated__/json-schemas/${filepath.replace(
                  /.json$/,
                  '.ts'
                )}`
            ),
            `npx prettier --write {projectRoot}/src/__generated__/json-schemas`,
          ].join(' && \\\n'),
        },
        outputs: jsonSchemas.map(
          (filePath) =>
            `{projectRoot}/src/__generated__/json-schemas/${filePath}`
        ),
      },
    };

    assert(typeof targets.build === 'object');
    assert(targets.build !== null);
    assert('dependsOn' in targets.build);
    assert(Array.isArray(targets.build.dependsOn));

    targets.build.dependsOn.push('build-json-schemas');
  }

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
