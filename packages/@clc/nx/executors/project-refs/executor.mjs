import assert from 'node:assert';
import path from 'path';

import {
  findLocalPackages,
  readPackageJson,
  writePrettierFile,
} from '@code-like-a-carpenter/tooling-common';

// This can be fixed my moving executors into src
// eslint-disable-next-line no-restricted-imports
import {extractProjectRoot, loadTsConfig} from '../../src/index.mjs';

/** @typedef {import('@nx/devkit').Executor} Executor */

/** @typedef {import('./schema.d.json').ProjectRefsExecutor} ProjectRefsExecutor */

/** @type {Executor<ProjectRefsExecutor>} */
const runExecutor = async (options, context) => {
  const root = extractProjectRoot(context);
  const tsconfigPath = path.join(root, 'tsconfig.json');
  const packageJsonPath = path.join(root, 'package.json');

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

  return {
    success: true,
  };
};

export default runExecutor;
