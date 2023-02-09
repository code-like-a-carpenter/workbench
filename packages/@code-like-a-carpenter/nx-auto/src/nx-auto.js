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
    'build:types': {
      executor: 'nx:run-commands',
      options: {
        command: `tsc --project ${projectRoot}/tsconfig.json`,
      },
      outputs: ['{projectRoot}/dist/types'],
    },
  };
};
