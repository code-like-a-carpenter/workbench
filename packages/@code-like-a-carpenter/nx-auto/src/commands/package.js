'use strict';

const assert = require('assert');
const {spawnSync} = require('child_process');
const fs = require('fs');
const path = require('path');

const depcheck = require('depcheck');

const {writePackageJson} = require('../lib/helpers');
const {pathToPackage} = require('../lib/helpers');
const {readPackageJson} = require('../lib/helpers');

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
  command: 'package',
  async handler({packageName}) {
    assert(
      !packageName.endsWith('package.json'),
      `packageName must not end with package.json, got ${packageName}`
    );
    assert(
      /@.+\/.+/.test(packageName),
      `packageName must be in the format @scope/name, got ${packageName}`
    );

    await deps(packageName);
    await config(packageName);
  },
};

module.exports = command;

/**
 * @param {string} packageName
 */
async function config(packageName) {
  const pkg = await readPackageJson(packageName);
  const rootPackageJson = await loadRootPackageJson();

  assert(pkg.description, `Missing package.json description in ${packageName}`);

  pkg.author = pkg.author ?? rootPackageJson.author;
  pkg.bugs = rootPackageJson.bugs;
  pkg.engines = rootPackageJson.engines;
  pkg.exports = {
    '.': {
      import: './dist/esm/index.js',
      require: './dist/cjs/index.js',
    },
    './package.json': './package.json',
  };
  assert(
    typeof rootPackageJson.homepage === 'string',
    'Missing homepage in top-level package.json'
  );
  const homepage = new URL(rootPackageJson.homepage);
  homepage.pathname = path.join(
    homepage.pathname,
    'tree',
    'main',
    'packages',
    packageName
  );
  // @ts-expect-error - the typedef seems to be incorrect here.
  pkg.homepage = homepage.toString();
  pkg.license = pkg.license ?? rootPackageJson.license;
  pkg.main = 'dist/cjs/index.js';
  pkg.module = 'dist/esm/index.js';
  pkg.name = packageName;
  pkg.repository = rootPackageJson.repository;
  pkg.types = 'dist/types';

  await writePackageJson(packageName, pkg);
}

/**
 * @returns {Promise<import("@schemastore/package").JSONSchemaForNPMPackageJsonFiles>}
 */
async function loadRootPackageJson() {
  return JSON.parse(
    await fs.promises.readFile(
      path.join(process.cwd(), 'package.json'),
      'utf-8'
    )
  );
}

/**
 * @param {string} packageName
 */
async function deps(packageName) {
  const packagePath = pathToPackage(packageName);

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
}

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
