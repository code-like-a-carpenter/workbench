import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';

import type {CreateNodesFunction, TargetConfiguration} from '@nx/devkit';

export const createExampleNodes: CreateNodesFunction = async (
  projectConfigurationFile
) => {
  const projectRoot = path.dirname(projectConfigurationFile);

  let targets: Record<string, TargetConfiguration> = {
    build: {
      cache: true,
      dependsOn: ['build-package', '^build'],
      executor: 'nx:noop',
    },
    'build-package': {
      cache: true,
      dependsOn: ['build-graphql', '^build'],
      executor: 'nx:run-commands',
      inputs: [
        '{projectRoot}/src/**/*',
        '{workspaceRoot}/package.json',
        'sharedGlobals',
      ],
      options: {
        command: `node ./packages/@code-like-a-carpenter/nx-auto package --package-name {projectName} --type="example"`,
      },
      outputs: ['{projectRoot}/package.json'],
    },
  };

  if (fs.existsSync(path.join(projectRoot, '/api.yml'))) {
    targets = {
      ...targets,
      'build-openapi': {
        cache: true,
        executor: 'nx:run-commands',
        inputs: ['{projectRoot}/api.yml'],
        options: {
          command: `npx --no-install openapi-typescript {projectRoot}/api.yml --prettier-config ./.prettierrc --output {projectRoot}/src/__generated__/api.ts && npm run eslint -- {projectRoot}/src/__generated__/api.ts --fix`,
        },
        outputs: [`{projectRoot}/src/__generated__/api.ts`],
      },
    };
    assert(typeof targets.build === 'object');
    assert(targets.build !== null);
    assert('dependsOn' in targets.build);
    assert(Array.isArray(targets.build.dependsOn));

    targets.build.dependsOn.push('build-openapi');
  }

  if (fs.existsSync(path.join(projectRoot, '/schema'))) {
    targets = {
      ...targets,
      'build-graphql': {
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
          commands: [
            `npx @code-like-a-carpenter/foundation-cli codegen --config {projectRoot}/.foundationrc.js `,
            `npm run eslint -- '{projectRoot}/__generated__/**/*.ts' --fix`,
          ],
          parallel: false,
        },
        outputs: [
          '{projectRoot}/src/__generated__/graphql.ts',
          '{projectRoot}/src/__generated__/template.yml',
          '{projectRoot}/src/__generated__/**/*',
        ],
      },
    };
    assert(typeof targets.build === 'object');
    assert(targets.build !== null);
    assert('dependsOn' in targets.build);
    assert(Array.isArray(targets.build.dependsOn));

    targets.build.dependsOn.push('build-graphql');
  }

  return {
    projects: {
      [projectRoot]: {
        targets,
      },
    },
  };
};
