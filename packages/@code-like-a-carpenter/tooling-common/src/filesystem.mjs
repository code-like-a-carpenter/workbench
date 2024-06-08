import {readFile, writeFile} from 'node:fs/promises';

import prettier from 'prettier';

/** @typedef {import('@schemastore/package').JSONSchemaForNPMPackageJsonFiles} JSONSchemaForNPMPackageJsonFiles */

/**
 * Write a file with prettier formatting
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
  await writeFile(filename, formatted);
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
