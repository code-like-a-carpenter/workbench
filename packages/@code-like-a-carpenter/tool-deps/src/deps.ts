import assert from 'node:assert';
import {spawnSync} from 'node:child_process';
import path from 'node:path';

import {minimatch} from 'minimatch';

import {findLocalPackages} from '@code-like-a-carpenter/tooling-common';

import type {DepsExecutor} from './__generated__/deps-types.ts';
import {load} from './config';
import {runDepcheck} from './depcheck';

export async function handler(argv: DepsExecutor): Promise<void> {
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

function ensureStrings(arr: readonly (number | string)[] = []): string[] {
  return arr.map((item) => {
    assert(typeof item === 'string', 'Expected string');
    return item;
  });
}

// eslint-disable-next-line complexity
export async function processSinglePackage(
  args: DepsExecutor & {readonly packageName: string},
  localPackages: Map<string, string>
) {
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

  const depsToAdd = new Set<string>();
  const devDepsToAdd = new Set<string>();
  const localDepsToAdd = new Set<string>();
  const localDevDepsToAdd = new Set<string>();

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

export async function addMissingLocalPackages(
  packageName: string,
  dependencies: string[],
  dev: boolean
) {
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

export async function addMissingNodeModules({
  awsSdkVersion,
  dependencies,
  dev,
  packageName,
}: {
  readonly awsSdkVersion: string;
  readonly dependencies: readonly string[];
  readonly dev: boolean;
  readonly packageName: string;
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

export async function removeExtraneousPackages(
  packageName: string,
  dependencies: string[]
) {
  console.log('Removing extraneous packages', packageName, dependencies);
  assert(dependencies.length > 0, 'Received empty dependencies list');

  spawnSync('npm', ['uninstall', '--workspace', packageName, ...dependencies], {
    stdio: 'inherit',
  });
}
