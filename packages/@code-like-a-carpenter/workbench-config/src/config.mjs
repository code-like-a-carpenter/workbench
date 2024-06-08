import {readFile, realpath} from 'node:fs/promises';
import path from 'path';

import {cosmiconfig} from 'cosmiconfig';
import merge from 'lodash.merge';
import {z as zod} from 'zod';

/** @typedef {import('cosmiconfig').Config} Config */

let schema = zod.object({});
/** @typedef {typeof schema} Schema */

/**
 * @template {Schema} T
 * @param {(s: Schema, z: typeof zod) => T} fn
 * @returns {{schema: T; load: (argv?: object) => Promise<zod.infer<T>>}}
 */
export function register(fn) {
  const s = fn(schema, zod);
  schema = s;
  return {load, schema: s};
}

const moduleName = 'code-like-a-carpenter';

/**
 * @param {object} argv
 */
export async function load(argv = {}) {
  const [defaultConfigs, userConfigs] = await Promise.all([
    loadConfigs(await realpath(process.argv[1])),
    loadConfigs(process.cwd()),
  ]);
  const configs = merge({}, ...defaultConfigs, ...userConfigs, argv);

  return schema.parse(configs);
}

/**
 * Search for and loads config from startDir according to standard cosmicconfig
 * rules, but continues searching and loading if the directory contains a
 * non-root package.json file (e.g., a package.json file that does not include a
 * workspaces field).
 *
 * @param {string} startDir
 * @returns {Promise<Config[]>}
 */
async function loadConfigs(startDir) {
  const explorer = cosmiconfig(moduleName);
  const result = await explorer.search(startDir);
  // Unfortunately, there doesn't appear to be a way to determine if !result
  // means we've searched all the way up or if we found a package.json file that
  // doesn't have a config, so we need to keep working our way up from startDir
  // until we can't anymore.
  if (!result) {
    if (startDir === '/') {
      return [];
    }

    return await loadConfigs(path.dirname(startDir));
  }

  // If the directory contains a package.json file and it contains a
  // "workspaces" field, we've reach the root of a mono-repo and should stop.
  const pkgFilename = path.join(path.dirname(result.filepath), 'package.json');
  try {
    const pkg = JSON.parse(await readFile(pkgFilename, 'utf8'));
    if ('workspaces' in pkg) {
      return [result.config];
    }
  } catch (err) {
    if (!(err instanceof Error && 'code' in err && err.code === 'ENOENT')) {
      throw err;
    }
  }

  // otherwise, continue searching and loading.
  return [
    result.config,
    ...(await loadConfigs(path.dirname(path.dirname(result.filepath)))),
  ];
}
