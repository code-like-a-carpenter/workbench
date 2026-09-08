import assert from 'node:assert';
import path from 'path';

import {glob} from 'glob';

import {
  readPackageJson,
  writePrettierFile,
} from '@code-like-a-carpenter/tooling-common';

// This can be fixed by moving executors into src
// eslint-disable-next-line no-restricted-imports
import {readTsConfig} from '../../src/index.mjs';

/** @typedef {import('@nx/devkit').Executor} Executor */

/** @typedef {import('./schema.d.json').WorkspaceRefsExecutor} WorkspaceRefsExecutor */

/**
 * Regenerates the `references` list in the workspace's root tsconfig.json.
 *
 * This is deliberately a single workspace-level task rather than something
 * every package does: the root tsconfig.json is one shared file, and a
 * read-modify-write from tasks running in parallel loses whichever write lands
 * first.
 *
 * @type {Executor<WorkspaceRefsExecutor>}
 */
const runExecutor = async (options, context) => {
  const tsconfigPath = path.join(context.root, 'tsconfig.json');

  const rootPkg = await readPackageJson(
    path.join(context.root, 'package.json')
  );
  const workspaces = Array.isArray(rootPkg.workspaces)
    ? rootPkg.workspaces
    : rootPkg.workspaces?.packages ?? [];
  assert(workspaces.length, 'The root package.json declares no workspaces');

  // Deliberately not tolerant of a missing root tsconfig.json: there is no
  // sensible default for it, and NX deletes an output before restoring it from
  // cache, so a missing file can mean "another run is mid-restore" rather than
  // "this workspace has no root tsconfig".
  const tsconfig = await readTsConfig(tsconfigPath);

  tsconfig.references = (
    await glob(
      workspaces.map((w) => path.join(w, '**', 'tsconfig.json')),
      {cwd: context.root, ignore: '**/node_modules/**'}
    )
  )
    .map((p) => path.dirname(p))
    .sort()
    .map((p) => ({path: p}));

  await writePrettierFile(tsconfigPath, JSON.stringify(tsconfig, null, 2));

  return {
    success: true,
  };
};

export default runExecutor;
