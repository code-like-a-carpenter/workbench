import assert from 'node:assert';
import {readFile} from 'node:fs/promises';
import path from 'path';

import {glob} from 'glob';
import ts from 'typescript';

import {
  findLocalPackages,
  readPackageJson,
  writePrettierFile,
} from '@code-like-a-carpenter/tooling-common';

// This can be fixed my moving executors into src
// eslint-disable-next-line no-restricted-imports
import {extractProjectRoot} from '../../src/index.mjs';

/** @typedef {import('@nx/devkit').Executor} Executor */

/** @typedef {import('./schema.d.json').ProjectRefsExecutor} ProjectRefsExecutor */

/** @type {Executor<ProjectRefsExecutor>} */
const runExecutor = async (options, context) => {
  const root = extractProjectRoot(context);
  const tsconfigPath = path.join(root, 'tsconfig.json');
  const packageJsonPath = path.join(root, 'package.json');

  const rootPkg = await readPackageJson(
    path.join(context.root, 'package.json')
  );
  const pkg = await readPackageJson(packageJsonPath);
  const tsconfig = await loadTsConfig(tsconfigPath);

  const localPackages = await findLocalPackages();

  tsconfig.references = Object.keys(pkg.dependencies ?? {})
    .filter((d) => localPackages.has(d))
    .map((d) => {
      const repoRelativePath = localPackages.get(d);
      assert(repoRelativePath, `Could not find path for ${d}`);
      const dependencyPackagePath = path.resolve(
        context.root,
        path.dirname(repoRelativePath)
      );
      return {path: path.relative(root, dependencyPackagePath)};
    });

  await writePrettierFile(tsconfigPath, JSON.stringify(tsconfig, null, 2));

  const rootTsConfig = await loadTsConfig(
    path.join(context.root, 'tsconfig.json')
  );

  const workspaces = Array.isArray(rootPkg.workspaces)
    ? rootPkg.workspaces
    : rootPkg.workspaces?.packages ?? [];

  rootTsConfig.references = (
    await glob(
      workspaces.map((w) => path.join(w, '**', 'tsconfig.json')),
      {ignore: '**/node_modules/**'}
    )
  )
    .map((p) => path.dirname(p))
    .map((p) => path.resolve(p))
    .map((p) => path.relative(process.cwd(), p))
    .sort()
    .map((p) => ({path: p}));

  await writePrettierFile(
    path.resolve(process.cwd(), 'tsconfig.json'),
    JSON.stringify(rootTsConfig, null, 2)
  );

  return {
    success: true,
  };
};

/**
 * @param {string} tsconfigPath
 */
async function loadTsConfig(tsconfigPath) {
  try {
    const text = await readFile(tsconfigPath, 'utf-8');
    return ts.parseConfigFileTextToJson(tsconfigPath, text).config;
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

export default runExecutor;
