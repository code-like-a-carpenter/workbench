import {existsSync} from 'node:fs';
import path from 'node:path';

import {addDependency, addPhase, addTarget} from './targets.mjs';

/** @typedef {import('@nx/devkit').CreateNodes} CreateNodes */
/** @typedef {import('@nx/devkit').TargetConfiguration} TargetConfiguration */

/**
 * The workspace root is a project of its own so that exactly one task owns the
 * root tsconfig.json. Letting each package regenerate it turned a shared file
 * into a read-modify-write race between parallel tasks, and NX cached the
 * result.
 *
 * @returns {Record<string, TargetConfiguration>}
 */
function createRootTargets() {
  /** @type {Record<string, TargetConfiguration>} */
  const targets = {};

  addPhase(targets, 'codegen');
  addPhase(targets, 'build', ['codegen']);
  addPhase(targets, 'all', ['build', 'codegen']);

  addTarget(targets, 'codegen', 'workspace-refs', {
    cache: true,
    // Every package tsconfig.json must exist before the root file can point at
    // it.
    dependsOn: [{projects: '*', target: 'codegen:project-refs'}],
    executor: '@clc/nx:workspace-refs',
    inputs: [
      // The executor preserves everything in the root tsconfig.json except
      // references, so its current contents are part of the task's input.
      '{workspaceRoot}/tsconfig.json',
      // The workspace globs decide which directories are searched.
      '{workspaceRoot}/package.json',
      '{workspaceRoot}/examples/**/tsconfig.json',
      '{workspaceRoot}/packages/**/tsconfig.json',
      // NX hashes plain filesets before any dependency has run, so the globs
      // above cannot see a tsconfig.json that codegen:project-refs is about to
      // create. This input is hashed after those tasks finish.
      {dependentTasksOutputFiles: '**/tsconfig.json'},
    ],
    outputs: ['{workspaceRoot}/tsconfig.json'],
  });

  return targets;
}

/** @type {CreateNodes} */
export const createNodes = [
  '**/package.json',
  // eslint-disable-next-line complexity
  async (projectConfigurationFile) => {
    const projectRoot = path.dirname(projectConfigurationFile);
    const projectName = projectRoot.includes('@')
      ? projectRoot.split('/').slice(-2).join('/')
      : path.basename(projectRoot);

    const projectBaseName = path.basename(projectRoot);

    if (projectRoot === '.') {
      return {projects: {[projectRoot]: {targets: createRootTargets()}}};
    }

    const mjs = existsSync(path.resolve(projectRoot, 'src/index.mjs'));
    const mts = existsSync(path.resolve(projectRoot, 'src/index.mts'));

    /** @type {Record<string, TargetConfiguration>} */
    let targets = {};
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
      executor: '@code-like-a-carpenter/tool-deps:deps',
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
      outputs: ['{projectRoot}/package.json'],
    });

    addTarget(targets, 'codegen', 'executors', {
      cache: true,
      executor: '@code-like-a-carpenter/tool-json-schema:json-schema',
      inputs: ['{projectRoot}/executors/*/schema.json'],
      options: {
        extension: mjs || mts ? 'mts' : 'ts',
        includeExtension: true,
        schemas: ['{projectRoot}/executors/*/schema.json'],
      },
      outputs: ['{projectRoot}/executors/*/schema.d.json.*'],
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
    } else if (projectName.split('/').pop()?.startsWith('tool-')) {
      type = 'tool';
    }

    if (type === 'package' || type === 'cli' || type === 'tool') {
      addTarget(targets, 'build', 'cjs', {
        cache: true,
        dependsOn: ['codegen'],
        executor: '@clc/nx:esbuild',
        options: {
          entryPoints: ['{projectRoot}/src/**/*.?(m)[jt]s?(x)', '!**/*.test.*'],
          format: 'cjs',
          outDir: '{projectRoot}/dist/cjs',
        },
        outputs: ['{projectRoot}/dist/cjs'],
      });

      if (!mjs) {
        addTarget(targets, 'build', 'esm', {
          cache: true,
          dependsOn: ['codegen'],
          executor: '@clc/nx:esbuild',
          inputs: ['{projectRoot}/src/**/*'],
          options: {
            entryPoints: [
              '{projectRoot}/src/**/*.?(m)[jt]s?(x)',
              '!**/*.test.*',
            ],
            format: 'esm',
            outDir: '{projectRoot}/dist/esm',
          },
          outputs: ['{projectRoot}/dist/esm'],
        });
      }

      addTarget(targets, 'build', 'types', {
        cache: true,
        dependsOn: ['^build:types', 'codegen'],
        executor: 'nx:run-commands',
        inputs: [
          'sharedGlobals',
          '{workspaceRoot}/tsconfig.base.json',
          '{workspaceRoot}/tsconfig.references.json',
          '{workspaceRoot}/tsconfig.json',
          '{projectRoot}/tsconfig.json',
          '{projectRoot}/package.json',
          '{projectRoot}/src/**/*.[jt]s?(x)',
        ],
        options: {
          command: mjs
            ? `tsc --project {projectRoot}/tsconfig.json && scripts/dmts-to-dts {projectRoot}`
            : mts
              ? `tsc --project {projectRoot}/tsconfig.json && scripts/dmts-to-dts {projectRoot}`
              : `tsc --project {projectRoot}/tsconfig.json`,
        },
        outputs: [
          '{projectRoot}/dist/.tsconfig.tsbuildinfo',
          '{projectRoot}/dist/types',
          '{projectRoot}/dist/cjs-types',
        ],
      });
    }

    addTarget(targets, 'codegen', 'json-schemas', {
      cache: true,
      executor: '@code-like-a-carpenter/tool-json-schema:json-schema',
      inputs: ['{projectRoot}/json-schemas/**/*.json'],
      options: {
        outDir: '{projectRoot}/src/__generated__/',
        schemas: ['{projectRoot}/json-schemas/**/*.json'],
      },
      outputs: ['{projectRoot}/src/__generated__/json-schemas/**/*.ts'],
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
      inputs: ['{workspaceRoot}/package.json'],
      options: {mjs, mts, type},
      outputs: ['{projectRoot}/package.json'],
    });

    if (type !== 'example') {
      addTarget(targets, 'codegen', 'project-refs', {
        cache: true,
        dependsOn: ['^codegen:project-refs', 'codegen:package'],
        executor: '@clc/nx:project-refs',
        // The executor preserves everything in the package's tsconfig.json
        // except references, so its current contents are part of the input; a
        // cache hit keyed on package.json alone would restore a stale copy over
        // a hand edit.
        inputs: ['{projectRoot}/package.json', '{projectRoot}/tsconfig.json'],
        outputs: ['{projectRoot}/tsconfig.json'],
      });

      addTarget(targets, 'codegen', 'readme', {
        cache: true,
        dependsOn: ['codegen:package'],
        executor: '@clc/nx:readme',
        inputs: [
          '{projectRoot}/README.md',
          '{projectRoot}/package.json',
          '{workspaceRoot}/package.json',
        ],
        outputs: ['{projectRoot}/README.md'],
      });
    }

    if (type === 'example') {
      let ext = null;
      if (existsSync(path.resolve(projectRoot, '.foundationrc.js'))) {
        ext = 'js';
      } else if (existsSync(path.resolve(projectRoot, '.foundationrc.cjs'))) {
        ext = 'cjs';
      } else if (existsSync(path.resolve(projectRoot, '.foundationrc.mjs'))) {
        ext = 'mjs';
      }
      if (ext) {
        addTarget(targets, 'build', 'foundation', {
          cache: true,
          dependsOn: [
            {
              projects: [
                '@code-like-a-carpenter/tool-foundation',
                '@code-like-a-carpenter/foundation-intermediate-representation',
                '@code-like-a-carpenter/foundation-parser',
                '@code-like-a-carpenter/foundation-plugin-cloudformation',
                '@code-like-a-carpenter/foundation-plugin-typescript',
                '@code-like-a-carpenter/foundation-runtime',
              ],
              target: 'build',
            },
          ],
          executor: '@code-like-a-carpenter/tool-foundation:foundation',
          inputs: [
            '{projectRoot}/schema/**/*.graphqls',
            '{projectRoot}/.foundationrc.*',
            '{projectRoot}/../common.graphqls',
            '{workspaceRoot}/.graphqlrc.js',
            '{workspaceRoot}/schema.graphqls',
            '{workspaceRoot}/packages/@code-like-a-carpenter/foundation-*/**/*',
          ],
          options: {
            config: `{projectRoot}/.foundationrc.${ext}`,
          },
          outputs: [
            '{projectRoot}/src/__generated__/graphql.ts',
            '{projectRoot}/src/__generated__/template.yml',
            '{projectRoot}/src/__generated__/**/*',
          ],
        });

        addTarget(targets, 'build', 'foundation:format', {
          cache: true,
          dependsOn: ['build:foundation'],
          executor: 'nx:run-commands',
          options: {
            command: `npm run eslint -- '{projectRoot}/__generated__/**/*.ts' --fix`,
          },
        });
      }
    }

    if (type === 'tool') {
      addTarget(targets, 'codegen', 'tool', {
        cache: true,
        executor: '@code-like-a-carpenter/tool-tool:tool',
        inputs: ['{projectRoot}/tools/*.json'],
        options: {
          buildBeforeRun: !mjs,
          schemaDir: '{projectRoot}/tools',
        },
        outputs: [
          '{projectRoot}/package.json',
          '{projectRoot}/executors.json',
          '{projectRoot}/src/__generated__/plugin.*',
          '{projectRoot}/src/__generated__/*-executor.*',
          '{projectRoot}/src/__generated__/*-types.*',
        ],
      });
    }

    if (
      projectName ===
      '@code-like-a-carpenter/foundation-intermediate-representation'
    ) {
      addTarget(targets, 'codegen', 'core-schema', {
        cache: true,
        executor: '@code-like-a-carpenter/tool-inliner:inliner',
        inputs: ['{projectRoot}/schema.graphqls'],
        options: {
          exportName: 'schema',
          sourceFile: '{projectRoot}/schema.graphqls',
          targetFile: '{projectRoot}/src/__generated__/schema.ts',
        },
        outputs: ['{projectRoot}/src/__generated__/schema.ts'],
      });
    }

    targets = Object.fromEntries(
      Object.entries(targets).sort(([k1], [k2]) => k1.localeCompare(k2))
    );

    if (type === 'tool') {
      addDependency(targets, 'build:types', 'codegen:tool');
      // codegen:tool can't work until the cjs for every tool exists. This should
      // probably be something like "anything that depends on a tool needs all
      // tools to be fully built", but I'm not sure how to express that
      addDependency(targets, 'codegen:tool', '^build:cjs');
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
