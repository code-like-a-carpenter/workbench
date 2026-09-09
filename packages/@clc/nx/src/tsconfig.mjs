import assert from 'node:assert';
import {readFile} from 'node:fs/promises';

import ts from 'typescript';

/**
 * Read a tsconfig.json so its contents can be edited and written back.
 *
 * Every failure throws — an unreadable file, a missing file, invalid JSON, an
 * empty file. Callers merge their output into whatever comes back here, so a
 * value invented from a failed read silently drops every field the file
 * already had.
 *
 * @param {string} tsconfigPath
 * @returns {Promise<Record<string, unknown>>}
 */
export async function readTsConfig(tsconfigPath) {
  const text = await readFile(tsconfigPath, 'utf-8');

  assert(text.trim().length > 0, `${tsconfigPath} is empty`);

  const {config, error} = ts.parseConfigFileTextToJson(tsconfigPath, text);
  assert(
    !error,
    `${tsconfigPath} is not valid JSON: ${
      error && ts.flattenDiagnosticMessageText(error.messageText, ' ')
    }`
  );
  assert(
    config && typeof config === 'object' && !Array.isArray(config),
    `${tsconfigPath} did not parse to an object`
  );

  return config;
}

/**
 * Read a package's tsconfig.json, or produce the one a package gets the first
 * time its references are generated.
 *
 * Only a missing file falls back to the default. See {@link readTsConfig} for
 * why nothing else may.
 *
 * @param {string} tsconfigPath
 * @returns {Promise<Record<string, unknown>>}
 */
export async function loadTsConfig(tsconfigPath) {
  try {
    return await readTsConfig(tsconfigPath);
  } catch (err) {
    if (/** @type {NodeJS.ErrnoException} */ (err).code !== 'ENOENT') {
      throw err;
    }
  }

  return {
    compilerOptions: {
      outDir: './dist/types',
      rootDir: './src',
    },
    extends: '../../../tsconfig.references.json',
    include: ['src'],
  };
}
