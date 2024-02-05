import path from 'node:path';

import type {CreateNodes, TargetConfiguration} from '@nx/devkit';

import {addPhase, addTarget} from './targets';

export const createNodes: CreateNodes = [
  '**/package.json',
  // eslint-disable-next-line complexity
  async (projectConfigurationFile) => {
    const projectRoot = path.dirname(projectConfigurationFile);
    const projectName = projectRoot.includes('@')
      ? projectRoot.split('/').slice(-2).join('/')
      : path.basename(projectRoot);

    const projectBaseName = path.basename(projectRoot);

    if (projectRoot === '.') {
      return {};
    }

    const targets: Record<string, TargetConfiguration> = {};
    // Set up the basic phases of the build process

    // Codegen produces files that will be committed to the repo.
    addPhase(targets, 'codegen');

    // Build produces transient files that will not be committed
    addPhase(targets, 'build', ['codegen']);

    // All is just a catchall target that we should consider the default
    // target for any repo
    addPhase(targets, 'all', ['build', 'codegen']);

    addTarget(targets, 'codegen', 'deps', {
      cache: true,
      executor: '@code-like-a-carpenter/tooling-deps:deps',
      options: {
        definitelyTyped: [
          'dotenv',
          'http-proxy',
          'js-yaml',
          'lodash.*',
          'prettier',
          'vhost',
          'yargs',
        ],
        packageName: projectName,
      },
    });

    addTarget(targets, 'codegen', 'executors', {
      cache: true,
      executor: '@clc/nx:json-schema',
      inputs: ['{projectRoot}/executors/*/schema.json', 'sharedGlobals'],
      options: {
        schemas: ['{projectRoot}/executors/*/schema.json'],
      },
      outputs: ['{projectRoot}/executors/*/schema.d.ts'],
    });

    if (projectName.includes('nx')) {
      return {
        projects: {
          [projectRoot]: {
            targets,
          },
        },
      };
    }

    let type = 'package';
    if (
      projectBaseName.startsWith('cli-') ||
      projectBaseName.endsWith('-cli') ||
      projectBaseName === 'cli'
    ) {
      type = 'cli';
    } else if (projectConfigurationFile.startsWith('examples')) {
      type = 'example';
    }

    if (type === 'package') {
      addTarget(targets, 'build', 'cjs', {
        cache: true,
        executor: '@clc/nx:esbuild',
        options: {
          entryPoints: ['{projectRoot}/src/**/*.[jt]s?(x)', '!**/*.test.*'],
          format: 'cjs',
          outDir: '{projectRoot}/dist/cjs',
        },
        outputs: ['{projectRoot}/dist/cjs'],
      });
    }

    if (type === 'package' || type === 'cli') {
      addTarget(targets, 'build', 'esm', {
        cache: true,
        executor: '@clc/nx:esbuild',
        inputs: ['{projectRoot}/src/**/*', 'sharedGlobals'],
        options: {
          entryPoints: ['{projectRoot}/src/**/*.[jt]s?(x)', '!**/*.test.*'],
          format: 'esm',
          outDir: '{projectRoot}/dist/esm',
        },
        outputs: ['{projectRoot}/dist/esm'],
      });

      addTarget(targets, 'build', 'types', {
        cache: true,
        executor: 'nx:run-commands',
        inputs: ['{projectRoot}/src/**/*', 'sharedGlobals'],
        options: {
          command: `tsc --project {projectRoot}/tsconfig.json`,
        },
        outputs: ['{projectRoot}/dist/types'],
      });
    }

    addTarget(targets, 'codegen', 'json-schemas', {
      cache: true,
      executor: '@clc/nx:json-schema',
      inputs: ['{projectRoot}/json-schemas/**/*.json'],
      options: {
        outDir: '{projectRoot}/src/__generated__/',
        schemas: ['{projectRoot}/json-schemas/**/*.json'],
      },
      outputs: ['{projectRoot}/src/__generated__/json-schemas/**/*.d.ts'],
    });

    addTarget(targets, 'codegen', 'openapi', {
      cache: true,
      executor: 'nx:run-commands',
      inputs: ['{projectRoot}/api.yml'],
      options: {
        command: `if [ -e {projectRoot}/api.yml ]; then npx --no-install openapi-typescript {projectRoot}/api.yml --prettier-config ./.prettierrc --output {projectRoot}/src/__generated__/api.ts && npm run eslint -- {projectRoot}/src/__generated__/api.ts --fix; fi`,
      },
      outputs: [`{projectRoot}/src/__generated__/api.ts`],
    });

    addTarget(targets, 'codegen', 'package', {
      cache: true,
      executor: '@clc/nx:package-json',
      inputs: ['{workspaceRoot}/package.json', 'sharedGlobals'],
      options: {type},
      outputs: ['{projectRoot}/package.json'],
    });

    if (type !== 'example') {
      addTarget(targets, 'codegen', 'project-refs', {
        cache: true,
        dependsOn: ['codegen:package'],
        executor: 'nx:run-commands',
        inputs: ['{projectRoot}/package.json', 'sharedGlobals'],
        options: {
          command: `node ./packages/@code-like-a-carpenter/nx-auto/ project-refs --package-name {projectName}`,
        },
        outputs: [
          '{projectRoot}/tsconfig.json',
          '{workspaceRoot}/tsconfig.json',
        ],
      });

      addTarget(targets, 'codegen', 'readme', {
        cache: true,
        dependsOn: ['codegen:package'],
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
      });
    }

    if (
      projectName ===
      '@code-like-a-carpenter/foundation-intermediate-representation'
    ) {
      addTarget(targets, 'codegen', 'core-schema', {
        cache: true,
        executor: '@clc/nx:inliner',
        inputs: ['{projectRoot}/schema.graphqls', 'sharedGlobals'],
        options: {
          exportName: 'schema',
          sourceFile: '{projectRoot}/schema.graphqls',
          targetFile: '{projectRoot}/src/__generated__/schema.ts',
        },
        outputs: ['{projectRoot}/src/__generated__/schema.ts'],
      });
    }

    return {
      projects: {
        [projectRoot]: {
          targets,
        },
      },
    };
  },
];
