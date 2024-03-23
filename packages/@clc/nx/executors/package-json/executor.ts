import assert from 'node:assert';
import path from 'node:path';

import type {Executor, ExecutorContext} from '@nx/devkit';
import type {JSONSchemaForNPMPackageJsonFiles} from '@schemastore/package';

import {readPackageJson} from '@code-like-a-carpenter/tooling-common';

import {extractProjectName, extractProjectRoot, writePackageJson} from '../..';

import type {PackageJsonExecutor} from './schema';

const runExecutor: Executor<PackageJsonExecutor> = async ({type}, context) => {
  const root = extractProjectRoot(context);
  const packageJsonPath = path.join(root, 'package.json');
  const pkg = await readPackageJson(packageJsonPath);

  if (type === 'example') {
    await configExample(pkg, context);
  } else {
    await config(pkg, type, context);
  }

  await writePackageJson(packageJsonPath, pkg);

  return {
    success: true,
  };
};

async function configExample(
  pkg: JSONSchemaForNPMPackageJsonFiles,
  context: ExecutorContext
) {
  const rootPackageJson = await loadRootPackageJson(context);

  pkg.engines = rootPackageJson.engines;
  pkg.private = true;
}

async function config(
  pkg: JSONSchemaForNPMPackageJsonFiles,
  type: 'cli' | 'package',
  context: ExecutorContext
) {
  const packageName = extractProjectName(context);
  const rootPackageJson = await loadRootPackageJson(context);

  assert(
    pkg.description,
    `Missing package.json description in "${packageName}"`
  );

  pkg.author = pkg.author ?? rootPackageJson.author;
  pkg.bugs = rootPackageJson.bugs;
  pkg.engines = rootPackageJson.engines;
  pkg.exports = {
    '.': {
      /* eslint-disable sort-keys */
      // `types` should [always come first](https://nodejs.org/api/packages.html#community-conditions-definitions)
      types: './dist/types/index.d.ts',
      carpentry: './src/index.ts',
      import: './dist/esm/index.mjs',
      require: './dist/cjs/index.cjs',
      /* eslint-enable sort-keys */
    },
    './package.json': './package.json',
  };
  // These are mostly for legacy fallbacks and, if `exports` is configured
  // correctly, should not be needed on modern platforms. When `main` is
  // present, esbuild seems to prefer it in some unpredictable cases.
  delete pkg.main;
  delete pkg.module;

  if (type === 'package') {
    delete pkg.bin;
  } else {
    pkg.bin = './cli.mjs';
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
}

async function loadRootPackageJson(
  context: ExecutorContext
): Promise<JSONSchemaForNPMPackageJsonFiles> {
  const packageJsonPath = path.join(context.root, 'package.json');
  return readPackageJson(packageJsonPath);
}

export default runExecutor;
