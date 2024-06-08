import assert from 'node:assert';
import {spawnSync} from 'node:child_process';
import path from 'node:path';

import {minimatch} from 'minimatch';

import {findLocalPackages} from '@code-like-a-carpenter/tooling-common';

/** @typedef {import('./__generated__/deps-types.mts').DepsExecutor} DepsExecutor */
import {load} from './config.mjs';
import {runDepcheck} from './depcheck.mjs';

/**
 * @param {DepsExecutor} argv
 * @return {Promise<void>}
 */
export async function handler(argv) {
  const args = (await load({deps: argv})).deps;
  const localPackages = await findLocalPackages();
  if ('packageName' in args && typeof args.packageName === 'string') {
    const {packageName} = args;
    await processSinglePackage({...args, packageName}, localPackages);
    return;
  }

  for (const packageName of localPackages.keys()) {
    await processSinglePackage({...args, packageName}, localPackages);
  }
}

/**
 * @param {readonly (number | string)[]} arr
 * @return {string[]}
 */
function ensureStrings(arr = []) {
  return arr.map((item) => {
    assert(typeof item === 'string', 'Expected string');
    return item;
  });
}

/**
 * @param {DepsExecutor & {readonly packageName: string}} args
 * @param {Map<string, string>} localPackages
 */
// eslint-disable-next-line complexity
export async function processSinglePackage(args, localPackages) {
  const {
    awsSdkVersion,
    definitelyTyped,
    devPatterns,
    dryRun,
    ignoreDirs,
    packageName,
  } = args;
  assert(Array.isArray(devPatterns), 'devPatterns must be an array');

  const packagePath = localPackages.get(packageName);
  assert(packagePath, `Could not find path for ${packageName}`);

  const depcheckresults = await runDepcheck(
    path.resolve(
      packagePath.endsWith('package.json')
        ? path.dirname(packagePath)
        : packagePath
    ),
    packageName,
    ensureStrings(ignoreDirs),
    ensureStrings(definitelyTyped)
  );

  /** @type {Set<string>} */
  const depsToAdd = new Set();
  /** @type {Set<string>} */
  const devDepsToAdd = new Set();
  /** @type {Set<string>} */
  const localDepsToAdd = new Set();
  /** @type {Set<string>} */
  const localDevDepsToAdd = new Set();

  for (const [dep, places] of Object.entries(depcheckresults.missing)) {
    const isLocal = localPackages.has(dep);
    const isDev =
      dep.startsWith('@types/') ||
      places.every((place) =>
        ensureStrings(devPatterns).some((pattern) => minimatch(place, pattern))
      );

    if (isLocal && isDev) {
      localDevDepsToAdd.add(dep);
    } else if (isLocal) {
      localDepsToAdd.add(dep);
    } else if (isDev) {
      devDepsToAdd.add(dep);
    } else {
      depsToAdd.add(dep);
    }
  }

  if (depsToAdd.size) {
    assert(
      !dryRun,
      `${packageName} is missing the following dependencies: ${Array.from(depsToAdd).join(', ')}. Please "npm run cli -- deps" and commit the changes`
    );

    assert(awsSdkVersion, 'awsSdkVersion is required');
    await addMissingNodeModules({
      awsSdkVersion,
      dependencies: Array.from(depsToAdd),
      dev: false,
      packageName,
    });
  }

  if (devDepsToAdd.size) {
    assert(
      !dryRun,
      `${packageName} is missing the following dependencies: ${Array.from(devDepsToAdd).join(', ')}. Please "npm run cli -- deps" and commit the changes`
    );

    assert(awsSdkVersion, 'awsSdkVersion is required');
    await addMissingNodeModules({
      awsSdkVersion,
      dependencies: Array.from(devDepsToAdd),
      dev: true,
      packageName,
    });
  }

  if (localDepsToAdd.size) {
    assert(
      !dryRun,
      `${packageName} is missing the following dependencies: ${Array.from(localDepsToAdd).join(', ')}. Please "npm run cli -- deps" and commit the changes`
    );

    await addMissingLocalPackages(
      packageName,
      Array.from(localDepsToAdd),
      false
    );
  }

  if (localDevDepsToAdd.size) {
    assert(
      !dryRun,
      `${packageName} is missing the following dependencies: ${Array.from(localDevDepsToAdd).join(', ')}. Please "npm run cli -- deps" and commit the changes`
    );

    await addMissingLocalPackages(
      packageName,
      Array.from(localDevDepsToAdd),
      true
    );
  }

  if (
    depcheckresults.dependencies.length ||
    depcheckresults.devDependencies.length
  ) {
    await removeExtraneousPackages(packageName, [
      ...depcheckresults.dependencies,
      ...depcheckresults.devDependencies,
    ]);
  }
}

/**
 * @param {string} packageName
 * @param {string[]} dependencies
 * @param {boolean} dev
 * @return {Promise<void>}
 */
export async function addMissingLocalPackages(packageName, dependencies, dev) {
  console.log('Adding missing local packages', packageName, dependencies, dev);
  assert(dependencies.length > 0, 'Received empty dependencies list');

  spawnSync(
    'npm',
    [
      'install',
      dev ? '--save-dev' : '',
      '--workspace',
      packageName,
      ...dependencies,
    ],
    {
      stdio: 'inherit',
    }
  );
}

/**
 * @param {object} options
 * @param { string} options.awsSdkVersion
 * @param {readonly string[]} options.dependencies
 * @param { boolean} options.dev
 * @param { string} options.packageName
 *
 */

export async function addMissingNodeModules({
  awsSdkVersion,
  dependencies,
  dev,
  packageName,
}) {
  console.log('Adding missing node modules', packageName, dependencies, dev);
  assert(dependencies.length > 0, 'Received empty dependencies list');

  const awsDeps = dependencies
    .filter((d) => d.startsWith('@aws-sdk'))
    .map((d) => `${d}@${awsSdkVersion}`);

  const normalDeps = dependencies
    .filter((d) => !d.startsWith('@aws-sdk'))
    .map((d) => `${d}@latest`);

  if (awsDeps.length) {
    spawnSync(
      'npm',
      [
        'install',
        dev ? '--save-dev' : '',
        '--workspace',
        packageName,
        '--save-exact',
        ...awsDeps,
      ].filter(Boolean),
      {
        stdio: 'inherit',
      }
    );
  }

  if (normalDeps.length) {
    spawnSync(
      'npm',
      [
        'install',
        dev ? '--save-dev' : '',
        '--workspace',
        packageName,
        ...normalDeps,
      ].filter(Boolean),
      {
        stdio: 'inherit',
      }
    );
  }
}

/**
 * @param {string} packageName
 * @param {readonly string[]} dependencies
 * @return {Promise<void>}
 */
export async function removeExtraneousPackages(packageName, dependencies) {
  console.log('Removing extraneous packages', packageName, dependencies);
  assert(dependencies.length > 0, 'Received empty dependencies list');

  spawnSync('npm', ['uninstall', '--workspace', packageName, ...dependencies], {
    stdio: 'inherit',
  });
}
