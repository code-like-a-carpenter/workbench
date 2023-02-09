'use strict';

const {spawnSync} = require('child_process');
const path = require('path');

const depcheck = require('depcheck');

/** @type import('yargs').CommandModule */
const command = {
  builder(yargs) {
    return yargs.options({
      packageName: {
        description: 'The name of the package to generate dependencies for',
        required: true,
        type: 'string',
      },
    });
  },
  command: 'package-deps',
  async handler({packageName}) {
    const packagePath = path.resolve(process.cwd(), 'packages', packageName);

    const results = await depcheck(packagePath, {
      detectors: [
        ...Object.values(depcheck.detector),
        depcheck.detector.typescriptImportType,
      ],
    });

    if (results.dependencies.length > 0) {
      await removeExtraDependencies(packagePath, results.dependencies);
    }

    const missingLocalPackages = Object.keys(results.missing).filter((m) =>
      m.startsWith('@code-like-a-carpenter')
    );
    const missingNodePackages = Object.keys(results.missing).filter(
      (m) => !m.startsWith('@code-like-a-carpenter')
    );

    if (missingLocalPackages.length > 0) {
      await addMissingLocalDependencies(packagePath, missingLocalPackages);
    }

    if (missingNodePackages.length > 0) {
      await addMissingNodeDependencies(packagePath, missingNodePackages);
    }
  },
};

module.exports = command;

/**
 * @param {string} packageName
 * @param {readonly string[]} dependencies
 */
function addMissingLocalDependencies(packageName, dependencies) {
  spawnSync('npm', ['install', '--workspace', packageName, ...dependencies], {
    stdio: 'inherit',
  });
}

/**
 * @param {string} packageName
 * @param {readonly string[]} dependencies
 */
function addMissingNodeDependencies(packageName, dependencies) {
  spawnSync(
    'npm',
    [
      'install',
      '--workspace',
      packageName,
      ...dependencies.map((d) => `${d}@latest`),
    ],
    {
      stdio: 'inherit',
    }
  );
}

/**
 * @param {string} packageName
 * @param {readonly string[]} dependencies
 */
function removeExtraDependencies(packageName, dependencies) {
  spawnSync('npm', ['uninstall', '--workspace', packageName, ...dependencies], {
    stdio: 'inherit',
  });
}
