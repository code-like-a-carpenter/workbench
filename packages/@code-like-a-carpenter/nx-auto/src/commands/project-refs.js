'use strict';

const fs = require('fs');
const path = require('path');

const glob = require('glob');
const prettier = require('prettier');

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
    const packagePath = path.resolve(process.cwd(), 'packages', packageName);
    const pkgJsonPath = path.join(packagePath, 'package.json');
    const tsconfigPath = path.join(packagePath, 'tsconfig.json');

    const pkg = JSON.parse(await fs.promises.readFile(pkgJsonPath, 'utf-8'));

    const tsconfig = await loadTsConfig(tsconfigPath);

    tsconfig.references = Object.keys(pkg.dependencies)
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
 * @param {string} tsconfigPath
 */
async function loadTsConfig(tsconfigPath) {
  try {
    return JSON.parse(await fs.promises.readFile(tsconfigPath, 'utf-8'));
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
 */
async function loadRootTsConfig(tsconfigPath) {
  return JSON.parse(await fs.promises.readFile(tsconfigPath, 'utf-8'));
}

/**
 * @param {string} filename
 * @param {string} content
 */
async function writePrettierFile(filename, content) {
  const config = await prettier.resolveConfig(filename);
  const formatted = prettier.format(content, {
    ...config,
    filepath: filename,
  });
  await fs.promises.writeFile(filename, formatted);
}
