import {randomUUID} from 'node:crypto';
import {chmod, readFile, rename, rm, stat, writeFile} from 'node:fs/promises';
import path from 'node:path';

import prettier from 'prettier';

/** @typedef {import('@schemastore/package').JSONSchemaForNPMPackageJsonFiles} JSONSchemaForNPMPackageJsonFiles */

/**
 * Write a file with prettier formatting
 *
 * The content goes to a sibling temp file that is then renamed over the
 * destination. Rename is atomic within a directory, so a concurrent reader
 * sees either the old file or the new one, never a half-written one. Tasks
 * across the workspace run in parallel and read each other's generated files,
 * so a torn read here silently poisons whatever the reader writes back.
 *
 * @param {string} filename
 * @param {string} content
 */
export async function writePrettierFile(filename, content) {
  const config = await prettier.resolveConfig(filename);
  const formatted = await prettier.format(content, {
    ...config,
    filepath: filename,
  });

  // The temp file is hidden and does not start with the destination's name, so
  // that an NX output glob such as `schema.d.json.*` cannot pick up one left
  // behind by a killed process.
  const tmpFilename = path.join(
    path.dirname(filename),
    `.${randomUUID()}.${path.basename(filename)}.tmp`
  );
  try {
    await writeFile(tmpFilename, formatted);
    // rename() replaces the destination wholesale, so the mode has to be
    // carried over rather than inherited from the umask.
    const mode = await modeOf(filename);
    if (mode !== null) {
      await chmod(tmpFilename, mode);
    }
    await rename(tmpFilename, filename);
  } catch (err) {
    await rm(tmpFilename, {force: true});
    throw err;
  }
}

/**
 * @param {string} filename
 * @returns {Promise<number | null>} The file's mode, or null if it does not exist
 */
async function modeOf(filename) {
  try {
    return (await stat(filename)).mode;
  } catch (err) {
    if (/** @type {NodeJS.ErrnoException} */ (err).code === 'ENOENT') {
      return null;
    }
    throw err;
  }
}

/**
 * Read a package.json file
 *
 * @param {string} filename
 * @returns {Promise<JSONSchemaForNPMPackageJsonFiles>}
 */
export async function readPackageJson(filename) {
  return JSON.parse(await readFile(filename, 'utf-8'));
}
