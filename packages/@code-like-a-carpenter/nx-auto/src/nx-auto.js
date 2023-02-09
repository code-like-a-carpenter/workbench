'use strict';

const path = require('path');

const glob = require('glob');

exports.projectFilePatterns = ['package.json'];

/** @param {string} projectFilePath */
exports.registerProjectTargets = function registerProjectTargets(
  projectFilePath
) {
  if (projectFilePath.includes('nx')) {
    return {};
  }

  const projectRoot = path.dirname(projectFilePath);

  const srcDir = path.join('.', projectRoot, 'src');
  const distDir = path.join('.', projectRoot, 'dist');

  const entryPoints = glob.sync(`${srcDir}/**/*.ts?(x)`).join(' ');

  const packageName = projectFilePath.split('/').slice(-2).join('/');

  return {
    build: {
      dependsOn: ['build:cjs', 'build:esm', 'build:types', '^build'],
      executor: 'nx:noop',
    },
    'build:cjs': {
      executor: 'nx:run-commands',
      options: {
        command: `esbuild ${entryPoints} --format=cjs --outdir=${distDir}/cjs --platform=node --sourcemap=external`,
      },
      outputs: ['{projectRoot}/dist/cjs'],
    },
    'build:esm': {
      executor: 'nx:run-commands',
      options: {
        command: `esbuild ${entryPoints} --format=esm --outdir=${distDir}/esm --platform=node --sourcemap=external`,
      },
      outputs: ['{projectRoot}/dist/esm'],
    },
    'build:package-deps': {
      executor: 'nx:run-commands',
      inputs: ['{projectRoot}/src/**/*'],
      options: {
        command: `node ./packages/@code-like-a-carpenter/nx-auto/ package-deps --package-name ${packageName}`,
      },
      outputs: ['{projectRoot}/package.json'],
    },
    'build:project-refs': {
      dependsOn: ['build:package-deps', '^build:project-refs'],
      executor: 'nx:run-commands',
      inputs: ['{projectRoot}/package.json'],
      options: {
        command: `node ./packages/@code-like-a-carpenter/nx-auto/ project-refs --package-name ${packageName}`,
      },
      outputs: ['{projectRoot}/tsconfig.json', '{workspaceRoot}/tsconfig.json'],
    },
    'build:types': {
      dependsOn: ['build:project-refs', '^build:types'],
      executor: 'nx:run-commands',
      options: {
        command: `tsc --build --project ${projectRoot}/tsconfig.json`,
      },
      outputs: ['{projectRoot}/dist/types'],
    },
  };
};
