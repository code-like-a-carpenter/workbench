'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const glob = require('glob');

const {readPackageJson} = require('../lib/helpers');
const {readTsConfigJson} = require('../lib/helpers');
const {pathToPackageFile, pathToPackage} = require('../lib/helpers');
const {writePrettierFile} = require('../lib/helpers');

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
  command: 'project-refs',
  async handler({packageName}) {
    assert(
      !packageName.endsWith('package.json'),
      `packageName must not end with package.json, got ${packageName}`
    );
    assert(
      /@.+\/.+/.test(packageName),
      `packageName must be in the format @scope/name, got ${packageName}`
    );

    const packagePath = pathToPackage(packageName);
    const tsconfigPath = pathToPackageFile(packageName, 'tsconfig.json');

    const pkg = await readPackageJson(packageName);
    const tsconfig = await loadTsConfig(packageName);

    tsconfig.references = Object.keys(pkg.dependencies ?? {})
      .filter((d) => d.startsWith('@code-like-a-carpenter'))
      .map((d) => {
        const dependencyPackagePath = path.resolve(
          process.cwd(),
          'packages',
          d
        );
        return {path: path.relative(packagePath, dependencyPackagePath)};
      });

    await writePrettierFile(tsconfigPath, JSON.stringify(tsconfig, null, 2));

    const rootTsConfig = await loadRootTsConfig(
      path.resolve(process.cwd(), 'tsconfig.json')
    );

    rootTsConfig.references = glob
      .sync(path.join('packages', '**', 'tsconfig.json'))
      .map((p) => path.dirname(p))
      .map((p) => path.resolve(p))
      .map((p) => path.relative(process.cwd(), p))
      .map((p) => ({path: p}));

    await writePrettierFile(
      path.resolve(process.cwd(), 'tsconfig.json'),
      JSON.stringify(rootTsConfig, null, 2)
    );
  },
};

module.exports = command;

/**
 * @param {string} packageName
 * @returns {Promise<import("@schemastore/tsconfig").JSONSchemaForTheTypeScriptCompilerSConfigurationFile>}
 */
async function loadTsConfig(packageName) {
  try {
    return await readTsConfigJson(packageName);
  } catch (e) {
    return {
      compilerOptions: {
        outDir: './dist/types',
        rootDir: './src',
      },
      extends: '../../../tsconfig.references.json',
      include: ['src'],
    };
  }
}

/**
 * @param {string} tsconfigPath
 * @returns {Promise<import("@schemastore/tsconfig").JSONSchemaForTheTypeScriptCompilerSConfigurationFile>}
 */
async function loadRootTsConfig(tsconfigPath) {
  return JSON.parse(await fs.promises.readFile(tsconfigPath, 'utf-8'));
}
