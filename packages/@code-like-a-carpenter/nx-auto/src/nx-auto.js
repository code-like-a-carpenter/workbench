'use strict';

const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

const glob = require('glob');

exports.projectFilePatterns = ['package.json'];

/** @param {string} projectFilePath */
exports.registerProjectTargets = function registerProjectTargets(
  projectFilePath
) {
  if (projectFilePath.includes('nx')) {
    return {};
  }

  if (projectFilePath.includes('examples')) {
    return configureExample(projectFilePath);
  }

  const projectRoot = path.dirname(projectFilePath);

  const srcDir = path.join('.', projectRoot, 'src');
  const distDir = path.join('.', projectRoot, 'dist');

  const entryPoints = glob
    .sync(`${srcDir}/**/*.ts?(x)`)
    .filter((filePath) => !filePath.includes('.test.'))
    .join(' ');

  const packageName = projectRoot.split('/').slice(-2).join('/');

  return {
    build: {
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
      executor: 'nx:run-commands',
      inputs: ['{projectRoot}/src/**/*', 'sharedGlobals'],
      options: {
        command: `esbuild ${entryPoints} --format=cjs --outdir=${distDir}/cjs --platform=node --sourcemap=external`,
      },
      outputs: ['{projectRoot}/dist/cjs'],
    },
    'build-esm': {
      executor: 'nx:run-commands',
      inputs: ['{projectRoot}/src/**/*', 'sharedGlobals'],
      options: {
        command: `esbuild ${entryPoints} --format=esm --outdir=${distDir}/esm --platform=node --sourcemap=external`,
      },
      outputs: ['{projectRoot}/dist/esm'],
    },
    'build-package': {
      executor: 'nx:run-commands',
      inputs: [
        '{projectRoot}/src/**/*',
        '{workspaceRoot}/package.json',
        'sharedGlobals',
      ],
      options: {
        command: `node ./packages/@code-like-a-carpenter/nx-auto/ package --package-name ${packageName}`,
      },
      outputs: ['{projectRoot}/package.json'],
    },
    'build-project-refs': {
      dependsOn: ['build-package', '^build-project-refs'],
      executor: 'nx:run-commands',
      inputs: ['{projectRoot}/package.json', 'sharedGlobals'],
      options: {
        command: `node ./packages/@code-like-a-carpenter/nx-auto/ project-refs --package-name ${packageName}`,
      },
      outputs: ['{projectRoot}/tsconfig.json', '{workspaceRoot}/tsconfig.json'],
    },
    'build-readme': {
      dependsOn: ['build-package'],
      executor: 'nx:run-commands',
      inputs: [
        '{projectRoot}/README.md',
        '{projectRoot}/package.json',
        '{workspaceRoot}/package.json',
        'sharedGlobals',
      ],
      options: {
        command: `node ./packages/@code-like-a-carpenter/nx-auto/ readme --package-name ${packageName}`,
      },
      outputs: ['{projectRoot}/README.md'],
    },
    'build-types': {
      dependsOn: ['build-project-refs', '^build-types'],
      executor: 'nx:run-commands',
      inputs: ['{projectRoot}/src/**/*', 'sharedGlobals'],
      options: {
        command: `tsc --project ${projectRoot}/tsconfig.json`,
      },
      outputs: ['{projectRoot}/dist/types'],
    },
  };
};

/** @param {string} projectFilePath */
function configureExample(projectFilePath) {
  const projectRoot = path.dirname(projectFilePath);

  const packageName = projectRoot.split('/').slice(-1).join('/');
  assert(packageName);

  /** @type Record<string, unknown> */
  let targets = {
    build: {
      dependsOn: ['build-package', '^build'],
      executor: 'nx:noop',
    },
    'build-package': {
      executor: 'nx:run-commands',
      inputs: [
        '{projectRoot}/src/**/*',
        '{workspaceRoot}/package.json',
        'sharedGlobals',
      ],
      options: {
        command: `node ./packages/@code-like-a-carpenter/nx-auto package --package-name ${packageName} --type="example"`,
      },
      outputs: ['{projectRoot}/package.json'],
    },
  };

  if (fs.existsSync(path.join(projectRoot, '/api.yml'))) {
    targets = {
      ...targets,
      'build-openapi': {
        executor: 'nx:run-commands',
        inputs: ['{projectRoot}/api.yml'],
        options: {
          command: `npx --no-install openapi-typescript ${projectRoot}/api.yml --prettier-config ./.prettierrc --output ${projectRoot}/src/__generated__/api.ts && npm run eslint -- ${projectRoot}/src/__generated__/api.ts --fix`,
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

  return targets;
}
