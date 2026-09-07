#!/usr/bin/env node

// Packs every publishable package, extracts the tarball, and loads every target
// in its `exports` map out of the extracted directory.
//
// `publint` and `attw` read the `exports` map statically, so a condition that
// resolves to a file which is present but does not execute passes both. Only
// loading the file catches that. Loading from the extracted tarball rather than
// the workspace is the other half: a workspace symlink resolves files `npm
// pack` may not have included.
//
// Each extracted package gets a `node_modules` holding its declared
// dependencies, so a sibling package resolves to *its* extracted tarball and a
// third-party dependency resolves to the version the package asked for rather
// than whatever the workspace root happens to hoist. Anything undeclared falls
// through to the workspace's own `node_modules`; policing dependency
// declarations is `tool-deps`' job, not this one's.

import {spawn} from 'node:child_process';
import fs from 'node:fs/promises';
import {createRequire} from 'node:module';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import {pathToFileURL} from 'node:url';

/** @typedef {{subpath: string, conditions: string[], target: string}} Target */
/** @typedef {{name: string, dir: string, source: string, manifest: Record<string, any>}} Package */

const PACKAGES_DIR = 'packages/@code-like-a-carpenter';

// Packages carry no `version` — multi-semantic-release supplies one at publish
// time — and `npm pack` refuses to run without one.
const SYNTHETIC_VERSION = '0.0.0-verify-pack';

// `@code-like-a-carpenter/cli`'s `.` export is the CLI itself: it calls
// `main()` at module scope, and its `bin` is a one-line wrapper that imports
// it. Loading it runs the CLI and exits, so it gets an existence check.
const PROGRAM_ENTRY_POINTS = new Set(['@code-like-a-carpenter/cli']);

/**
 * @param {string} command
 * @param {string[]} args
 * @param {string} cwd
 * @returns {Promise<{code: number, stdout: string, stderr: string}>}
 */
function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (chunk) => (stdout += chunk));
    child.stderr.on('data', (chunk) => (stderr += chunk));
    child.on('error', reject);
    child.on('close', (code) => resolve({code: code ?? 1, stderr, stdout}));
  });
}

/**
 * Every string leaf of an `exports` subpath value, tagged with the conditions
 * it sits under.
 *
 * @param {string} subpath
 * @param {unknown} value
 * @param {string[]} conditions
 * @returns {Target[]}
 */
function collectTargets(subpath, value, conditions = []) {
  if (typeof value === 'string') {
    return [{conditions, subpath, target: value}];
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return Object.entries(value).flatMap(([condition, nested]) =>
      collectTargets(subpath, nested, [...conditions, condition])
    );
  }
  // `null` blocks a subpath, and the array fallback form is not used here;
  // neither has a file to check.
  return [];
}

/**
 * @param {unknown} bin
 * @returns {Target[]}
 */
function binTargets(bin) {
  if (typeof bin === 'string') {
    return [{conditions: ['bin'], subpath: 'bin', target: bin}];
  }
  if (bin && typeof bin === 'object') {
    return Object.entries(bin)
      .filter(([, target]) => typeof target === 'string')
      .map(([name, target]) => ({
        conditions: ['bin'],
        subpath: `bin.${name}`,
        target,
      }));
  }
  return [];
}

/**
 * @param {Record<string, any>} manifest
 * @returns {Target[]}
 */
function targetsOf(manifest) {
  const {exports: exportsMap} = manifest;
  if (exportsMap === undefined) {
    throw new Error('package has no "exports" map');
  }

  /** @type {Target[]} */
  const targets =
    typeof exportsMap === 'string'
      ? collectTargets('.', exportsMap)
      : Object.entries(exportsMap).flatMap(([key, value]) =>
          // A key that does not start with "." is a condition on ".".
          key.startsWith('.')
            ? collectTargets(key, value)
            : collectTargets('.', value, [key])
        );

  if (typeof manifest.types === 'string') {
    targets.push({
      conditions: ['types'],
      subpath: 'types',
      target: manifest.types,
    });
  }

  return [...targets, ...binTargets(manifest.bin)];
}

/**
 * `types` targets are declarations and `bin` targets are programs; neither is
 * loadable as a module, so both get an existence check.
 *
 * @param {Target} target
 * @param {string} packageName
 * @returns {'import' | 'require' | 'exists'}
 */
function checkFor({conditions, subpath}, packageName) {
  if (conditions.includes('types') || conditions.includes('bin')) {
    return 'exists';
  }
  if (subpath === '.' && PROGRAM_ENTRY_POINTS.has(packageName)) {
    return 'exists';
  }
  if (conditions.includes('require')) {
    return 'require';
  }
  if (conditions.includes('import')) {
    return 'import';
  }
  return 'exists';
}

/** @param {Target} target */
function describe({conditions, subpath, target}) {
  const suffix = conditions.length ? ` (${conditions.join('.')})` : '';
  return `${subpath}${suffix} -> ${target}`;
}

/**
 * Loads every target of one extracted package. Runs in a child process so that
 * an entry point which kills the process is reported rather than taking the
 * whole run down with it.
 *
 * @param {string} packageDir
 * @returns {Promise<number>}
 */
async function loadPackage(packageDir) {
  const manifest = JSON.parse(
    await fs.readFile(path.join(packageDir, 'package.json'), 'utf8')
  );
  const require = createRequire(import.meta.url);

  /** @type {string[]} */
  const failures = [];

  for (const target of targetsOf(manifest)) {
    const resolved = path.resolve(packageDir, target.target);
    const label = describe(target);

    try {
      await fs.access(resolved);
    } catch {
      failures.push(`${label}: missing from the tarball`);
      continue;
    }

    const check = checkFor(target, manifest.name);
    try {
      if (check === 'require') {
        require(resolved);
      } else if (check === 'import') {
        await import(pathToFileURL(resolved).href);
      }
    } catch (err) {
      failures.push(`${label}: ${check}() threw: ${err}`);
    }
  }

  for (const failure of failures) {
    process.stderr.write(`${failure}\n`);
  }
  return failures.length === 0 ? 0 : 1;
}

/**
 * The directory node would resolve `dependency` to from `fromDir`, found the
 * way node finds it: by walking up looking for `node_modules/<dependency>`.
 * `require.resolve` cannot stand in here because a package whose `exports` map
 * omits `./package.json` is unresolvable by specifier.
 *
 * @param {string} fromDir
 * @param {string} dependency
 * @returns {Promise<string | null>}
 */
async function resolvePackageDir(fromDir, dependency) {
  let dir = fromDir;
  for (;;) {
    const candidate = path.join(dir, 'node_modules', dependency);
    try {
      await fs.access(path.join(candidate, 'package.json'));
      return await fs.realpath(candidate);
    } catch {
      // keep walking
    }
    const parent = path.dirname(dir);
    if (parent === dir) {
      return null;
    }
    dir = parent;
  }
}

/**
 * @param {Package} pkg
 * @param {string} stageRoot
 * @returns {Promise<void>}
 */
async function packAndExtract(pkg, stageRoot) {
  // Staging happens outside the workspace so that `npm pack` sees a plain
  // package rather than a workspace member.
  const stage = path.join(stageRoot, path.basename(pkg.source));
  await fs.cp(pkg.source, stage, {
    filter: (src) => path.basename(src) !== 'node_modules',
    recursive: true,
  });
  await fs.writeFile(
    path.join(stage, 'package.json'),
    `${JSON.stringify({...pkg.manifest, version: SYNTHETIC_VERSION}, null, 2)}\n`
  );

  const packed = await run(
    'npm',
    ['pack', '--ignore-scripts', '--json', '--pack-destination', stageRoot],
    stage
  );
  if (packed.code !== 0) {
    throw new Error(`npm pack failed:\n${packed.stderr}`);
  }
  const [{filename}] = JSON.parse(packed.stdout);

  await fs.mkdir(pkg.dir, {recursive: true});
  const extracted = await run(
    'tar',
    [
      '--extract',
      '--gzip',
      '--strip-components=1',
      '--file',
      path.join(stageRoot, filename),
      '--directory',
      pkg.dir,
    ],
    stageRoot
  );
  if (extracted.code !== 0) {
    throw new Error(`tar failed:\n${extracted.stderr}`);
  }
}

/**
 * @param {Package} pkg
 * @param {Map<string, Package>} packages
 * @returns {Promise<string[]>} dependencies that could not be resolved
 */
async function linkDependencies(pkg, packages) {
  const dependencies = Object.keys({
    ...pkg.manifest.dependencies,
    ...pkg.manifest.optionalDependencies,
  });

  /** @type {string[]} */
  const unresolved = [];

  for (const dependency of dependencies) {
    const sibling = packages.get(dependency);
    const target = sibling
      ? sibling.dir
      : await resolvePackageDir(pkg.source, dependency);

    if (!target) {
      unresolved.push(dependency);
      continue;
    }

    const link = path.join(pkg.dir, 'node_modules', dependency);
    await fs.mkdir(path.dirname(link), {recursive: true});
    await fs.symlink(target, link, 'dir');
  }

  return unresolved;
}

/**
 * Every publishable package under {@link PACKAGES_DIR}, keyed by package name.
 *
 * @param {string} packagesRoot
 * @param {string} extractRoot
 * @returns {Promise<Map<string, Package>>}
 */
async function findPackages(packagesRoot, extractRoot) {
  const entries = await fs.readdir(packagesRoot, {withFileTypes: true});

  /** @type {Map<string, Package>} */
  const packages = new Map();

  for (const entry of entries.filter((e) => e.isDirectory()).sort()) {
    const source = path.join(packagesRoot, entry.name);
    const manifest = JSON.parse(
      await fs.readFile(path.join(source, 'package.json'), 'utf8')
    );
    if (!manifest.private) {
      packages.set(manifest.name, {
        dir: path.join(extractRoot, manifest.name),
        manifest,
        name: manifest.name,
        source,
      });
    }
  }

  return packages;
}

/**
 * @param {Map<string, Package>} packages
 * @param {string} stageRoot
 * @returns {Promise<Map<string, string[]>>} failures, keyed by package name
 */
async function prepare(packages, stageRoot) {
  /** @type {Map<string, string[]>} */
  const failures = new Map();

  for (const pkg of packages.values()) {
    try {
      await packAndExtract(pkg, stageRoot);
    } catch (err) {
      failures.set(pkg.name, [String(err)]);
    }
  }

  for (const pkg of packages.values()) {
    if (failures.has(pkg.name)) {
      continue;
    }
    const unresolved = await linkDependencies(pkg, packages);
    if (unresolved.length) {
      failures.set(pkg.name, [
        `dependencies are not installed in the workspace: ${unresolved.join(', ')}`,
      ]);
    }
  }

  return failures;
}

/**
 * @param {Map<string, Package>} packages
 * @param {Map<string, string[]>} failures
 * @returns {Promise<void>}
 */
async function loadAll(packages, failures) {
  for (const pkg of packages.values()) {
    if (failures.has(pkg.name)) {
      process.stdout.write(`FAIL ${pkg.name}\n`);
      continue;
    }

    const result = await run(
      process.execPath,
      [import.meta.filename, '--load', pkg.dir],
      process.cwd()
    );

    if (result.code === 0) {
      process.stdout.write(`ok   ${pkg.name}\n`);
    } else {
      const output = `${result.stderr}${result.stdout}`.trimEnd();
      failures.set(
        pkg.name,
        output ? output.split('\n') : ['loading exited non-zero']
      );
      process.stdout.write(`FAIL ${pkg.name}\n`);
    }
  }
}

/**
 * @param {Map<string, string[]>} failures
 * @param {number} total
 * @returns {void}
 */
function report(failures, total) {
  if (failures.size === 0) {
    process.stdout.write(`\nAll ${total} packages load from their tarball\n`);
    return;
  }

  process.stdout.write('\n');
  for (const [name, lines] of failures) {
    process.stdout.write(`${name}\n`);
    for (const line of lines) {
      process.stdout.write(`  ${line}\n`);
    }
  }

  const prefix = process.env.GITHUB_ACTIONS ? '::error::' : '';
  process.stdout.write(
    `${prefix}${failures.size} of ${total} packages do not load from their tarball: ${[...failures.keys()].join(', ')}\n`
  );
  process.exitCode = 1;
}

async function main() {
  const workspaceRoot = process.cwd();
  const workRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'verify-pack-'));
  const stageRoot = path.join(workRoot, 'stage');
  await fs.mkdir(stageRoot, {recursive: true});
  // Puts the workspace's node_modules on the resolution path of every extracted
  // package, one directory above the extract root, so that an undeclared
  // dependency resolves the way it does in the workspace.
  await fs.symlink(
    path.join(workspaceRoot, 'node_modules'),
    path.join(workRoot, 'node_modules'),
    'dir'
  );

  const packages = await findPackages(
    path.join(workspaceRoot, PACKAGES_DIR),
    path.join(workRoot, 'extracted')
  );

  try {
    const failures = await prepare(packages, stageRoot);
    await loadAll(packages, failures);
    report(failures, packages.size);
  } finally {
    await fs.rm(workRoot, {force: true, recursive: true});
  }
}

if (process.argv[2] === '--load') {
  process.exitCode = await loadPackage(process.argv[3]);
} else {
  await main();
}
