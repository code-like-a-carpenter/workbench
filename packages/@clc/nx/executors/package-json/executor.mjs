import assert from 'node:assert';
import path from 'node:path';

import {readPackageJson} from '@code-like-a-carpenter/tooling-common';

// This can be fixed by moving executors into src
// eslint-disable-next-line no-restricted-imports
import {
  extractProjectName,
  extractProjectRoot,
  writePackageJson,
} from '../../src/index.mjs';

/** @typedef {import('@nx/devkit').Executor} Executor */
/** @typedef {import('@nx/devkit').ExecutorContext} ExecutorContext */
/** @typedef {import('@schemastore/package').JSONSchemaForNPMPackageJsonFiles} JSONSchemaForNPMPackageJsonFiles */

/** @typedef {import('./schema.d.json').PackageJsonExecutor} PackageJsonExecutor */

/** @type {Executor<PackageJsonExecutor>} */
const runExecutor = async (
  {extraFiles = [], mjs = false, mts = false, type = 'package'},
  context
) => {
  const root = extractProjectRoot(context);
  const packageJsonPath = path.join(root, 'package.json');
  const pkg = await readPackageJson(packageJsonPath);

  if (type === 'example') {
    await configExample(pkg, context);
  } else {
    await config(pkg, extraFiles, mjs, mts, type, context);
  }

  await writePackageJson(packageJsonPath, pkg);

  return {
    success: true,
  };
};

/**
 * @param { JSONSchemaForNPMPackageJsonFiles } pkg
 * @param {ExecutorContext} context
 */
async function configExample(pkg, context) {
  const rootPackageJson = await loadRootPackageJson(context);

  pkg.engines = rootPackageJson.engines;
  pkg.private = true;
}

/**
 *
 * @param { JSONSchemaForNPMPackageJsonFiles } pkg
 * @param { string[] } extraFiles
 * @param { boolean } mjs
 * @param { boolean } mts
 * @param { Exclude<PackageJsonExecutor['type'], 'undefined'> } type
 * @param { ExecutorContext } context
 */
// eslint-disable-next-line complexity
async function config(pkg, extraFiles, mjs, mts, type, context) {
  const packageName = extractProjectName(context);
  const rootPackageJson = await loadRootPackageJson(context);

  assert(
    pkg.description,
    `Missing package.json description in "${packageName}"`
  );

  pkg.author = pkg.author ?? rootPackageJson.author;
  pkg.bugs = rootPackageJson.bugs;
  pkg.engines = rootPackageJson.engines;
  pkg.files = [
    'dist',
    // `src` is published for every package, not just the `mjs` ones that serve
    // `./src/index.mjs` as their `import` condition: `tsconfig.references.json`
    // sets `declarationMap`, and tsc does not inline sources into a
    // `.d.ts.map`, so dropping `src` would leave every declaration map in
    // `dist/types` pointing at a file that isn't in the tarball.
    'src',
    ...(type === 'cli' ? ['cli.mjs'] : []),
    // nx reads `executors.json`, which names a schema under `tools/` and an
    // implementation under `src/__generated__/` (`mjs` tools) or `dist/cjs/`
    // (built tools).
    ...(type === 'tool' ? ['executors.json', 'tools'] : []),
    ...extraFiles,
    '!**/*.test.*',
    '!**/__snapshots__',
    '!**/*.tsbuildinfo',
  ];
  pkg.exports = {
    '.': {
      /* eslint-disable sort-keys */
      // `types` should [always come first](https://nodejs.org/api/packages.html#community-conditions-definitions)
      import: {
        types:
          mjs || mts ? './dist/types/index.d.mts' : './dist/types/index.d.ts',
        default: mjs ? './src/index.mjs' : './dist/esm/index.mjs',
      },
      require: {
        types:
          mjs || mts
            ? './dist/cjs-types/index.d.ts'
            : './dist/types/index.d.ts',
        default: './dist/cjs/index.cjs',
      },
      /* eslint-enable sort-keys */
    },
    './package.json': './package.json',
  };
  // These are mostly for legacy fallbacks and, if `exports` is configured
  // correctly, should not be needed on modern platforms. When `main` is
  // present, esbuild seems to prefer it in some unpredictable cases.
  delete pkg.main;
  delete pkg.module;

  if (type === 'cli') {
    pkg.bin = './cli.mjs';
  } else {
    delete pkg.bin;
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

  // everything needs to be a module for local type resolution to work. this
  // _probably_ won't effect consumers since we're still building CommonJS and
  // ESM outputs.
  pkg.type = 'module';
  // I _think_ `types` here is necessary for any consumer that's not yet
  // migrated to NodeNext
  pkg.types =
    mjs || mts ? './dist/types/index.d.mts' : './dist/types/index.d.ts';

  if (!pkg.publishConfig?.access || pkg.publishConfig.access === 'public') {
    pkg.publishConfig = {
      ...pkg.publishConfig,
      access: 'public',
    };
  }
}

/**
 * @param {ExecutorContext} context
 * @returns {Promise<JSONSchemaForNPMPackageJsonFiles>}
 */
async function loadRootPackageJson(context) {
  const packageJsonPath = path.join(context.root, 'package.json');
  return readPackageJson(packageJsonPath);
}

export default runExecutor;
