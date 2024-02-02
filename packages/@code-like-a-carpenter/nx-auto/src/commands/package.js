'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const {writePackageJson} = require('../lib/helpers');
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
        /* eslint-disable sort-keys */
        // `types` should [always come first](https://nodejs.org/api/packages.html#community-conditions-definitions)
        types: './dist/types/index.d.ts',
        development: './src/index.ts',
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
  } else {
    pkg.bin = './cli.mjs';

    pkg.exports = {
      '.': {
        /* eslint-disable sort-keys */
        // `types` should [always come first](https://nodejs.org/api/packages.html#community-conditions-definitions)
        types: './dist/types/index.d.ts',
        development: './src/index.ts',
        import: './dist/esm/index.mjs',
        /* eslint-enable sort-keys */
      },
      './package.json': './package.json',
    };

    delete pkg.main;
    delete pkg.module;
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
 * @returns {Promise<import('@schemastore/package').JSONSchemaForNPMPackageJsonFiles>}
 */
async function loadRootPackageJson() {
  return JSON.parse(
    await fs.promises.readFile(
      path.join(process.cwd(), 'package.json'),
      'utf-8'
    )
  );
}
