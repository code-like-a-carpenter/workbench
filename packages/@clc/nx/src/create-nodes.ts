import assert from 'node:assert';
import path from 'node:path';

import type {CreateNodes, TargetConfiguration} from '@nx/devkit';

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

    if (projectName.includes('nx')) {
      const targets: Record<string, TargetConfiguration> = {
        build: {
          cache: true,
          executor: '@code-like-a-carpenter/nx:json-schema',
          inputs: ['{projectRoot}/executors/*/schema.json', 'sharedGlobals'],
          options: {
            schemas: ['{projectRoot}/executors/*/schema.json'],
          },
          outputs: ['{projectRoot}/executors/*/schema.d.ts'],
        },
      };

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

    const targets: Record<string, TargetConfiguration> = {
      build: {
        cache: true,
        dependsOn: [
          '^build',
          'build:cjs',
          'build:esm',
          'build:types',
          'codegen',
        ],
        executor: 'nx:noop',
      },
      'build:cjs': {
        cache: true,
        dependsOn: ['codegen'],
        executor: '@code-like-a-carpenter/nx:esbuild',
        options: {
          entryPoints: ['{projectRoot}/src/**/*.[jt]s?(x)', '!**/*.test.*'],
          format: 'cjs',
          outDir: '{projectRoot}/dist/cjs',
        },
        outputs: ['{projectRoot}/dist/cjs'],
      },
      'build:esm': {
        cache: true,
        dependsOn: ['codegen'],
        executor: '@code-like-a-carpenter/nx:esbuild',
        inputs: ['{projectRoot}/src/**/*', 'sharedGlobals'],
        options: {
          entryPoints: ['{projectRoot}/src/**/*.[jt]s?(x)', '!**/*.test.*'],
          format: 'esm',
          outDir: '{projectRoot}/dist/esm',
        },
        outputs: ['{projectRoot}/dist/esm'],
      },
      'build:types': {
        cache: true,
        dependsOn: ['^build:types', 'codegen;'],
        executor: 'nx:run-commands',
        inputs: ['{projectRoot}/src/**/*', 'sharedGlobals'],
        options: {
          command: `tsc --project {projectRoot}/tsconfig.json`,
        },
        outputs: ['{projectRoot}/dist/types'],
      },
      codegen: {
        cache: true,
        dependsOn: [
          '^codegen',
          'codegen:executors',
          'codegen:json-schemas',
          'codegen:openapi',
          'codegen:package',
          'codegen:project-refs',
          'codegen:readme',
        ],
        executor: 'nx:noop',
      },
      'codegen:deps': {
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
      },
      'codegen:executors': {
        cache: true,
        executor: '@code-like-a-carpenter/nx:json-schema',
        inputs: ['{projectRoot}/executors/*/schema.json'],
        options: {
          schemas: ['{projectRoot}/executors/*/schema.json'],
        },
        outputs: ['{projectRoot}/executors/*/schema.d.ts'],
      },
      'codegen:foundation': {
        cache: true,
        dependsOn: ['^build'],
        executor: 'nx:run-commands',
        inputs: [
          '{projectRoot}/schema/**/*.graphqls',
          '{projectRoot}/.foundationrc.js',
          '{projectRoot}/../common.graphqls',
          '{workspaceRoot}/.graphqlrc.js',
          '{workspaceRoot}/schema.graphqls',
        ],
        options: {
          command: `
if [ -d {projectRoot}/schema ] ; then
  npx @code-like-a-carpenter/foundation-cli codegen --config {projectRoot}/.foundationrc.js && \\
  npm run eslint -- '{projectRoot}/__generated__/**/*.ts' --fix
fi
`,
          parallel: false,
        },
        outputs: [
          '{projectRoot}/src/__generated__/graphql.ts',
          '{projectRoot}/src/__generated__/template.yml',
          '{projectRoot}/src/__generated__/**/*',
        ],
      },
      'codegen:json-schemas': {
        cache: true,
        executor: '@code-like-a-carpenter/nx:json-schema',
        inputs: ['{projectRoot}/json-schemas/**/*.json'],
        options: {
          outDir: '{projectRoot}/src/__generated__/',
          schemas: ['{projectRoot}/json-schemas/**/*.json'],
        },
        outputs: ['{projectRoot}/src/__generated__/json-schemas/**/*.d.ts'],
      },
      'codegen:openapi': {
        cache: true,
        executor: 'nx:run-commands',
        inputs: ['{projectRoot}/api.yml'],
        options: {
          command: `if [ -e {projectRoot}/api.yml ]; then npx --no-install openapi-typescript {projectRoot}/api.yml --prettier-config ./.prettierrc --output {projectRoot}/src/__generated__/api.ts && npm run eslint -- {projectRoot}/src/__generated__/api.ts --fix; fi`,
        },
        outputs: [`{projectRoot}/src/__generated__/api.ts`],
      },
      'codegen:package': {
        cache: true,
        executor: 'nx:run-commands',
        inputs: [
          '{projectRoot}/src/**/*',
          '{workspaceRoot}/package.json',
          'sharedGlobals',
        ],
        options: {
          command: `node ./packages/@code-like-a-carpenter/nx-auto/ package --package-name {projectName} --type=${type}`,
        },
        outputs: ['{projectRoot}/package.json'],
      },
      'codegen:project-refs': {
        cache: true,
        dependsOn: ['^codegen:project-refs', 'codegen:deps'],
        executor: 'nx:run-commands',
        inputs: ['{projectRoot}/package.json', 'sharedGlobals'],
        options: {
          command: `node ./packages/@code-like-a-carpenter/nx-auto/ project-refs --package-name {projectName}`,
        },
        outputs: [
          '{projectRoot}/tsconfig.json',
          '{workspaceRoot}/tsconfig.json',
        ],
      },
      'codegen:readme': {
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
      },
    };

    if (type === 'cli') {
      delete targets['build:cjs'];
      assert(
        targets.build.dependsOn,
        'targets.build.dependsOn must be defined'
      );
      targets.build.dependsOn = targets.build.dependsOn.filter(
        (x) => x !== 'build:cjs'
      );
    }

    if (type === 'example') {
      delete targets['build:cjs'];
      delete targets['build:esm'];
      delete targets['build:types'];
      assert(
        targets.build.dependsOn,
        'targets.build.dependsOn must be defined'
      );
      targets.build.dependsOn = targets.build.dependsOn.filter(
        (x) => x !== 'build:cjs' && x !== 'build:esm' && x !== 'build:types'
      );

      delete targets['codegen:package'];
      delete targets['codegen:project-refs'];
      delete targets['codegen:readme'];
      assert(
        targets.codegen.dependsOn,
        'targets.codegen.dependsOn must be defined'
      );
      targets.codegen.dependsOn = targets.codegen.dependsOn.filter(
        (x) =>
          x !== 'codegen:package' &&
          x !== 'codegen:project-refs' &&
          x !== 'codegen:readme'
      );
    }

    if (
      projectName ===
      '@code-like-a-carpenter/foundation-intermediate-representation'
    ) {
      targets.codegen.dependsOn = ['codegen:core-schema'];
      targets['codegen:core-schema'] = {
        cache: true,
        executor: '@code-like-a-carpenter/nx:inliner',
        inputs: ['{projectRoot}/schema.graphqls', 'sharedGlobals'],
        options: {
          exportName: 'schema',
          sourceFile: '{projectRoot}/schema.graphqls',
          targetFile: '{projectRoot}/src/__generated__/schema.ts',
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
  },
];
