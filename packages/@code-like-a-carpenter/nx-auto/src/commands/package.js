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
      type: {
        choices: ['package', 'example', 'cli'],
        default: 'package',
        required: false,
      },
    });
  },
  command: 'package',
  async handler({packageName, type}) {
    assert(
      !packageName.endsWith('package.json'),
      `packageName must not end with package.json, got ${packageName}`
    );

    await deps(packageName);
    if (type === 'example') {
      await configExample(packageName);
    } else {
      await config(packageName, type);
    }
  },
};

module.exports = command;

/**
 * @param {string} packageName
 */
async function configExample(packageName) {
  const pkg = await readPackageJson(packageName);
  const rootPackageJson = await loadRootPackageJson();

  pkg.engines = rootPackageJson.engines;
  pkg.private = true;

  await writePackageJson(packageName, pkg);
}

/**
 * @param {string} packageName
 * @param {'cli'|'package'} type
 */
async function config(packageName, type) {
  const pkg = await readPackageJson(packageName);
  const rootPackageJson = await loadRootPackageJson();

  assert(pkg.description, `Missing package.json description in ${packageName}`);

  pkg.author = pkg.author ?? rootPackageJson.author;
  pkg.bugs = rootPackageJson.bugs;
  pkg.engines = rootPackageJson.engines;
  if (type === 'package') {
    delete pkg.bin;

    pkg.exports = {
      '.': {
        import: './dist/esm/index.js',
        require: './dist/cjs/index.js',
        types: './dist/types/index.d.ts',
      },
      './package.json': './package.json',
    };

    // These are mostly for legacy fallbacks and, if `exports` is configured
    // correctly, should not be needed on modern platforms. When `main` is
    // present, esbuild seems to prefer it in some unpredictable cases.
    delete pkg.main;
    delete pkg.module;
  } else {
    pkg.bin = './cli.js';
    pkg.main = './dist/cjs/index.js';

    delete pkg.exports;
  }
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
  pkg.homepage = homepage.toString();
  pkg.license = pkg.license ?? rootPackageJson.license;
  pkg.name = packageName;
  pkg.repository = rootPackageJson.repository;
  pkg.types = 'dist/types';

  if (!pkg.publishConfig?.access || pkg.publishConfig.access === 'public') {
    pkg.publishConfig = {
      ...pkg.publishConfig,
      access: 'public',
    };
  }

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
    ignoreDirs: ['.aws-sam', 'dist'],
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

// This is the current version bundled with lambda
const awsSdkVersion = '3.188.0';

/**
 * @param {string} packageName
 * @param {readonly string[]} dependencies
 */
function addMissingNodeDependencies(packageName, dependencies) {
  const awsDeps = dependencies
    .filter((d) => d.startsWith('@aws-sdk'))
    .map((d) => `${d}@${awsSdkVersion}`);

  const normalDeps = dependencies
    .filter((d) => !d.startsWith('@aws-sdk'))
    .filter((d) => d !== 'aws-lambda')
    .map((d) => `${d}@latest`);

  const needsLambda = dependencies.includes('aws-lambda');

  if (awsDeps.length) {
    spawnSync(
      'npm',
      ['install', '--workspace', packageName, '--save-exact', ...awsDeps],
      {
        stdio: 'inherit',
      }
    );
  }

  if (normalDeps.length) {
    spawnSync('npm', ['install', '--workspace', packageName, ...normalDeps], {
      stdio: 'inherit',
    });
  }

  if (needsLambda) {
    spawnSync(
      'npm',
      [
        'install',
        '--save-dev',
        '--workspace',
        packageName,
        '@types/aws-lambda',
      ],
      {stdio: 'inherit'}
    );
  }
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
