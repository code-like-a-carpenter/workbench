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
// Each loadable target is loaded in its own child process. One process per
// package would let an entry point that calls `process.exit()` — a CLI whose
// `.` export runs itself — report success for every target queued behind it.
// A pass needs two facts, because either alone is forgeable: the child writes
// MARKER unless loading threw, which an exit code cannot tell from "threw while
// loading", and the child must also exit 0, which the marker cannot tell from a
// module that loaded and then reported a failure. The marker is written from an
// `exit` handler so that a module which exits while evaluating is still
// observed; the price of that is that it proves evaluation was entered and did
// not throw, not that it ran to completion.
//
// Each extracted package gets a `node_modules` holding its declared
// dependencies, so a sibling resolves to *its* extracted tarball rather than to
// the workspace source. Third-party dependencies resolve exactly where node
// would resolve them from the source package, which is the nested install where
// there is one and the root hoist otherwise. Anything undeclared falls through
// to the workspace's own `node_modules`; policing dependency declarations is
// `tool-deps`' job, not this one's.

import {spawn} from 'node:child_process';
import fs from 'node:fs';
import fsp from 'node:fs/promises';
import {createRequire} from 'node:module';
import os from 'node:os';
import path from 'node:path';
import process from 'node:process';
import {pathToFileURL} from 'node:url';

/** @typedef {{subpath: string, conditions: string[], target: string, unsupported?: string}} Target */
/** @typedef {{name: string, dir: string, source: string, manifest: Record<string, any>}} Package */

const PACKAGES_DIR = 'packages';

// Packages carry no `version` — multi-semantic-release supplies one at publish
// time — and `npm pack` refuses to run without one.
const SYNTHETIC_VERSION = '0.0.0-verify-pack';

// Written by the child once the module under test has evaluated. `fs.writeSync`
// rather than `process.stdout.write` because the child writes it from an `exit`
// handler, where an async write to a pipe would be dropped.
const MARKER = '@@verify-pack:evaluated@@';

// A module that blocks the event loop cannot be waited out. Without this a
// single bad entry point burns the whole CI job's budget.
const CHILD_TIMEOUT_MS = 60_000;

const CONCURRENCY = Math.max(1, Math.min(8, os.availableParallelism()));

/**
 * @param {string} command
 * @param {string[]} args
 * @param {string} cwd
 * @returns {Promise<{code: number, stdout: string, stderr: string, timedOut: boolean}>}
 */
function run(command, args, cwd) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';
    let timedOut = false;

    // Decode per stream rather than per chunk so a multi-byte sequence split
    // across chunks is not mangled.
    child.stdout.setEncoding('utf8');
    child.stderr.setEncoding('utf8');
    child.stdout.on('data', (chunk) => (stdout += chunk));
    child.stderr.on('data', (chunk) => (stderr += chunk));

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill('SIGKILL');
    }, CHILD_TIMEOUT_MS);

    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({code: code ?? 1, stderr, stdout, timedOut});
    });
  });
}

/**
 * @template T
 * @param {T[]} items
 * @param {(item: T) => Promise<void>} fn
 * @returns {Promise<void>}
 */
async function forEachConcurrently(items, fn) {
  const queue = [...items];
  const workers = Array.from(
    {length: Math.min(CONCURRENCY, queue.length)},
    async () => {
      for (let item = queue.shift(); item !== undefined; item = queue.shift()) {
        await fn(item);
      }
    }
  );
  await Promise.all(workers);
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
  if (Array.isArray(value)) {
    // The fallback-array form: node tries each entry and takes the first that
    // resolves, so checking it means resolving the whole list in order. No
    // package here uses one. Reported rather than skipped, so that adding one
    // is a loud failure instead of a target that is silently never checked.
    return [
      {
        conditions,
        subpath,
        target: JSON.stringify(value),
        unsupported: 'fallback arrays are not supported',
      },
    ];
  }
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([condition, nested]) =>
      collectTargets(subpath, nested, [...conditions, condition])
    );
  }
  if (value === null) {
    // `null` blocks a subpath: there is no file to check.
    return [];
  }
  // A number, a boolean, `undefined` — node rejects all of them as export
  // targets. Reported for the same reason as the array form: skipping leaves a
  // target that is never checked and a package that passes without being read.
  return [
    {
      conditions,
      subpath,
      target: String(value),
      unsupported: 'not a string, an array, or an object of conditions',
    },
  ];
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

  // Only a plain object is a map of subpaths and conditions. Anything else —
  // a string, an array, or junk — is itself the target for ".". Routing an
  // array through Object.entries would turn its indices into condition names
  // and drop any non-string entry without checking it.
  const isSubpathMap =
    typeof exportsMap === 'object' &&
    exportsMap !== null &&
    !Array.isArray(exportsMap);

  /** @type {Target[]} */
  const targets = isSubpathMap
    ? Object.entries(exportsMap).flatMap(([key, value]) =>
        // A key that does not start with "." is a condition on ".".
        key.startsWith('.')
          ? collectTargets(key, value)
          : collectTargets('.', value, [key])
      )
    : collectTargets('.', exportsMap);

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
 * The loader for a target that names neither `import` nor `require`: the
 * extension decides where it is explicit, and the package's `type` otherwise.
 *
 * @param {string} target
 * @param {Record<string, any>} manifest
 * @returns {'import' | 'require'}
 */
function loaderFor(target, manifest) {
  if (target.endsWith('.cjs')) {
    return 'require';
  }
  if (target.endsWith('.mjs')) {
    return 'import';
  }
  return manifest.type === 'module' ? 'import' : 'require';
}

/**
 * How to check one target. `types` targets are declarations, `bin` targets are
 * programs and JSON is data, so those get an existence check. Everything else
 * is loaded, and a target under no condition this function recognises still
 * picks a loader from its extension and the package's `type` rather than
 * quietly degrading to an existence check.
 *
 * @param {Target} target
 * @param {Record<string, any>} manifest
 * @returns {'import' | 'require' | 'exists' | 'unsupported'}
 */
function checkFor({conditions, target, unsupported}, manifest) {
  if (unsupported || target.includes('*')) {
    return 'unsupported';
  }
  if (conditions.includes('types') || conditions.includes('bin')) {
    return 'exists';
  }
  // JSON under an explicit `require` condition is loadable, so load it: a file
  // that is present but does not parse is exactly the shape this job exists to
  // catch. Any other JSON target is existence-checked, because `import()` of
  // JSON needs a type attribute, and an unconditional target — every package's
  // `"./package.json": "./package.json"` — would otherwise be `import()`ed by a
  // `"type": "module"` package and fail for the missing attribute alone.
  if (target.endsWith('.json')) {
    return conditions.includes('require') ? 'require' : 'exists';
  }
  if (conditions.includes('require')) {
    return 'require';
  }
  if (conditions.includes('import')) {
    return 'import';
  }
  return loaderFor(target, manifest);
}

/** @param {Target} target */
function describe({conditions, subpath, target}) {
  const suffix = conditions.length ? ` (${conditions.join('.')})` : '';
  return `${subpath}${suffix} -> ${target}`;
}

/**
 * Loads one target, writing {@link MARKER} unless loading threw. The marker is
 * written from an `exit` handler so that a module which exits while evaluating
 * is still observed — which is also why it proves only that evaluation was
 * entered and did not throw. Whether the load *succeeded* is the exit code's
 * job, and {@link checkPackage} reads that.
 *
 * @param {'import' | 'require'} mode
 * @param {string} file
 * @returns {Promise<void>}
 */
async function loadTarget(mode, file) {
  let started = false;
  let threw = false;

  // The marker says only that evaluation was reached and did not throw. Whether
  // it *succeeded* is the exit code's job, and the caller reads that, because
  // the code passed to this handler is not final — a handler registered later
  // can still change `process.exitCode`.
  process.on('exit', () => {
    if (started && !threw) {
      fs.writeSync(1, MARKER);
    }
  });

  try {
    started = true;
    if (mode === 'require') {
      createRequire(import.meta.url)(file);
    } else {
      await import(pathToFileURL(file).href);
    }
  } catch (err) {
    threw = true;
    process.stderr.write(`${err instanceof Error ? err.stack : err}\n`);
    process.exit(1);
  }

  // The module loaded. Leaving normally would wait on whatever handles it
  // opened, so stop here rather than hanging on a timer or an open socket.
  // Exiting with whatever status the module asked for rather than a flat 0: a
  // module that set `process.exitCode` while evaluating is reporting a failure,
  // and overriding it here would hide that from the caller.
  process.exit(process.exitCode ?? 0);
}

/**
 * The directory node would resolve `dependency` to from `fromDir`, found the
 * way node finds it: by walking up looking for `node_modules/<dependency>`.
 * `require.resolve` cannot stand in here because a package whose `exports` map
 * omits `./package.json` is unresolvable by specifier.
 *
 * @param {string} fromDir
 * @param {string} stopDir the workspace root; resolving past it would reach
 *   modules that are not part of the checkout
 * @param {string} dependency
 * @returns {Promise<string | null>}
 */
async function resolvePackageDir(fromDir, stopDir, dependency) {
  let dir = fromDir;
  for (;;) {
    const candidate = path.join(dir, 'node_modules', dependency);
    try {
      await fsp.access(path.join(candidate, 'package.json'));
      return await fsp.realpath(candidate);
    } catch {
      // keep walking
    }
    if (dir === stopDir) {
      return null;
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
  // package rather than a workspace member. The scope stays a directory rather
  // than being flattened into the name: flattening maps both `@a/b_c` and
  // `@a_b/c` onto one directory, and two packages staged on top of each other
  // pack each other's files.
  const stage = path.join(stageRoot, pkg.name);
  await fsp.cp(pkg.source, stage, {
    filter: (src) => path.basename(src) !== 'node_modules',
    recursive: true,
  });
  await fsp.writeFile(
    path.join(stage, 'package.json'),
    `${JSON.stringify({...pkg.manifest, version: SYNTHETIC_VERSION}, null, 2)}\n`
  );

  const packed = await run(
    'npm',
    ['pack', '--ignore-scripts', '--json', '--pack-destination', stage],
    stage
  );
  if (packed.code !== 0) {
    throw new Error(`npm pack failed:\n${packed.stderr}`);
  }

  let filename;
  try {
    [{filename}] = JSON.parse(packed.stdout);
  } catch {
    throw new Error(`could not read npm pack output:\n${packed.stdout}`);
  }
  if (typeof filename !== 'string') {
    throw new Error(`npm pack named no tarball:\n${packed.stdout}`);
  }

  await fsp.mkdir(pkg.dir, {recursive: true});
  const extracted = await run(
    'tar',
    [
      '--extract',
      '--gzip',
      '--strip-components=1',
      '--file',
      path.join(stage, filename),
      '--directory',
      pkg.dir,
    ],
    stage
  );
  if (extracted.code !== 0) {
    throw new Error(`tar failed:\n${extracted.stderr}`);
  }
}

/**
 * @param {Package} pkg
 * @param {Map<string, Package>} packages
 * @param {string} workspaceRoot
 * @returns {Promise<string[]>} dependencies that could not be resolved
 */
async function linkDependencies(pkg, packages, workspaceRoot) {
  const optional = new Set(
    Object.keys(pkg.manifest.optionalDependencies ?? {})
  );
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
      : await resolvePackageDir(pkg.source, workspaceRoot, dependency);

    // A dangling link is worse than no link: node walks past it and resolves
    // the dependency from the workspace instead, which is the unpacked source
    // tree this whole check exists to avoid.
    if (!target || !fs.existsSync(target)) {
      if (!optional.has(dependency)) {
        unresolved.push(dependency);
      }
      continue;
    }

    const link = path.join(pkg.dir, 'node_modules', dependency);
    await fsp.mkdir(path.dirname(link), {recursive: true});
    await fsp.symlink(target, link, 'dir');
  }

  return unresolved;
}

/**
 * Every publishable package under {@link PACKAGES_DIR}, keyed by package name.
 * The workspace globs `packages/*` + '/*', so scopes other than
 * `@code-like-a-carpenter` count too.
 *
 * @param {string} packagesRoot
 * @param {string} extractRoot
 * @returns {Promise<Map<string, Package>>}
 */
async function findPackages(packagesRoot, extractRoot) {
  /** @type {Map<string, Package>} */
  const packages = new Map();

  const scopes = await fsp.readdir(packagesRoot, {withFileTypes: true});
  for (const scope of scopes.filter((entry) => entry.isDirectory())) {
    const scopeRoot = path.join(packagesRoot, scope.name);
    const entries = await fsp.readdir(scopeRoot, {withFileTypes: true});

    for (const entry of entries.filter((e) => e.isDirectory())) {
      const source = path.join(scopeRoot, entry.name);
      const manifestPath = path.join(source, 'package.json');
      let raw;
      try {
        raw = await fsp.readFile(manifestPath, 'utf8');
      } catch {
        // No manifest — a stray build or cache directory, not a package.
        continue;
      }
      // A manifest that exists but does not parse is a broken package, not a
      // non-package. Skipping it here would drop it from the run entirely and
      // let the job report that every package it did look at was fine.
      let manifest;
      try {
        manifest = JSON.parse(raw);
      } catch (err) {
        throw new Error(`${manifestPath} is not valid JSON: ${err.message}`);
      }
      if (!manifest.private) {
        // Keying by name means a second directory claiming the same name would
        // overwrite the first, dropping it from the run while the final count
        // still reports every package it did look at as passing.
        const existing = packages.get(manifest.name);
        if (existing) {
          throw new Error(
            `${manifest.name} is declared by both ${existing.source} and ${source}`
          );
        }
        packages.set(manifest.name, {
          dir: path.join(extractRoot, manifest.name),
          manifest,
          name: manifest.name,
          source,
        });
      }
    }
  }

  return new Map(
    [...packages.entries()].sort(([a], [b]) => a.localeCompare(b))
  );
}

/**
 * Packs, extracts and wires up `node_modules` for every package.
 *
 * @param {Map<string, Package>} packages
 * @param {string} stageRoot
 * @param {string} workspaceRoot
 * @returns {Promise<Map<string, string[]>>} failures, keyed by package name
 */
async function prepare(packages, stageRoot, workspaceRoot) {
  /** @type {Map<string, string[]>} */
  const failures = new Map();

  await forEachConcurrently([...packages.values()], async (pkg) => {
    try {
      await packAndExtract(pkg, stageRoot);
    } catch (err) {
      failures.set(pkg.name, [String(err)]);
    }
  });

  // A package whose sibling failed to pack cannot be verified against that
  // sibling's tarball, so it fails too rather than silently resolving the
  // sibling from the workspace.
  for (let changed = true; changed; ) {
    changed = false;
    for (const pkg of packages.values()) {
      if (failures.has(pkg.name)) {
        continue;
      }
      const broken = Object.keys(pkg.manifest.dependencies ?? {}).find(
        (dep) => packages.has(dep) && failures.has(dep)
      );
      if (broken) {
        failures.set(pkg.name, [`depends on ${broken}, which failed to pack`]);
        changed = true;
      }
    }
  }

  for (const pkg of packages.values()) {
    if (failures.has(pkg.name)) {
      continue;
    }
    try {
      const unresolved = await linkDependencies(pkg, packages, workspaceRoot);
      if (unresolved.length) {
        failures.set(pkg.name, [
          `dependencies are not installed in the workspace: ${unresolved.join(', ')}`,
        ]);
      }
    } catch (err) {
      failures.set(pkg.name, [`could not link dependencies: ${err}`]);
    }
  }

  return failures;
}

/**
 * Reads the outcome of one child load.
 *
 * @param {string} label
 * @param {'import' | 'require'} check
 * @param {{code: number, stdout: string, stderr: string, timedOut: boolean}} result
 * @returns {string | null} the failure, or null if the target loaded
 */
function loadProblem(label, check, result) {
  if (result.timedOut) {
    return `${label}: ${check}() did not finish within ${CHILD_TIMEOUT_MS / 1000}s`;
  }
  // Both are required. Without the marker, a module that threw while
  // evaluating is indistinguishable from one that loaded and exited; without a
  // zero exit code, a module that evaluated and then reported a failure —
  // `process.exit(1)` mid-evaluation, an unsettled top-level `await` (node
  // exits 13), a non-zero `process.exitCode` — passes.
  if (result.stdout.includes(MARKER) && result.code === 0) {
    return null;
  }
  const detail =
    `${result.stderr}${result.stdout.replaceAll(MARKER, '')}`.trim();
  return `${label}: ${check}() failed${detail ? `: ${detail}` : ` with exit code ${result.code}`}`;
}

/**
 * @param {Package} pkg
 * @param {Target} target
 * @returns {Promise<string | null>} the failure, or null if the target is fine
 */
async function checkTarget(pkg, target) {
  const label = describe(target);
  const check = checkFor(target, pkg.manifest);

  if (check === 'unsupported') {
    return `${label}: ${target.unsupported ?? 'subpath patterns are not supported'}`;
  }

  const file = path.resolve(pkg.dir, target.target);
  // Reading the tarball is the whole point, so a target that resolves out of
  // the extracted directory — an absolute path, or one that climbs out with
  // `..` — is a failure rather than something to load from wherever it landed.
  // Without this it could resolve back into the workspace source and pass.
  if (file !== pkg.dir && !file.startsWith(`${pkg.dir}${path.sep}`)) {
    return `${label}: resolves outside the extracted package`;
  }
  if (!fs.existsSync(file)) {
    return `${label}: missing from the tarball`;
  }
  if (check === 'exists') {
    return null;
  }

  const result = await run(
    process.execPath,
    [import.meta.filename, '--load', check, file],
    pkg.dir
  );

  return loadProblem(label, check, result);
}

/**
 * @param {Package} pkg
 * @returns {Promise<string[]>} one line per failed target
 */
async function checkPackage(pkg) {
  /** @type {string[]} */
  const problems = [];

  /** @type {Target[]} */
  let targets;
  try {
    targets = targetsOf(pkg.manifest);
  } catch (err) {
    return [String(err)];
  }

  for (const target of targets) {
    const problem = await checkTarget(pkg, target);
    if (problem) {
      problems.push(problem);
    }
  }

  return problems;
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

  const annotate = process.env.GITHUB_ACTIONS ? '::error::' : '';

  process.stdout.write('\n');
  for (const [name, lines] of failures) {
    for (const line of lines) {
      process.stdout.write(`${annotate}${name}: ${line}\n`);
    }
  }

  process.stdout.write(
    `\n${failures.size} of ${total} packages do not load from their tarball: ${[...failures.keys()].join(', ')}\n`
  );
  process.exitCode = 1;
}

async function main() {
  const workspaceRoot = process.cwd();
  const workRoot = await fsp.mkdtemp(path.join(os.tmpdir(), 'verify-pack-'));

  try {
    const stageRoot = path.join(workRoot, 'stage');
    await fsp.mkdir(stageRoot, {recursive: true});
    // Puts the workspace's node_modules on the resolution path of every
    // extracted package, one directory above the extract root, so that an
    // undeclared dependency resolves the way it does in the workspace.
    await fsp.symlink(
      path.join(workspaceRoot, 'node_modules'),
      path.join(workRoot, 'node_modules'),
      'dir'
    );

    const packages = await findPackages(
      path.join(workspaceRoot, PACKAGES_DIR),
      path.join(workRoot, 'extracted')
    );

    const failures = await prepare(packages, stageRoot, workspaceRoot);

    await forEachConcurrently(
      [...packages.values()].filter((pkg) => !failures.has(pkg.name)),
      async (pkg) => {
        const problems = await checkPackage(pkg);
        if (problems.length) {
          failures.set(pkg.name, problems);
        }
      }
    );

    for (const pkg of packages.values()) {
      process.stdout.write(
        `${failures.has(pkg.name) ? 'FAIL' : 'ok  '} ${pkg.name}\n`
      );
    }

    report(
      new Map([...failures.entries()].sort(([a], [b]) => a.localeCompare(b))),
      packages.size
    );
  } finally {
    // `fs.rm` unlinks symlinks rather than following them, so this removes the
    // links into the workspace without touching what they point at. Do not
    // replace it with anything that dereferences.
    await fsp.rm(workRoot, {force: true, recursive: true});
  }
}

if (process.argv[2] === '--load') {
  await loadTarget(
    /** @type {'import' | 'require'} */ (process.argv[3]),
    process.argv[4]
  );
} else {
  await main();
}
