import assert from 'node:assert';
import {mkdir} from 'node:fs/promises';
import path from 'node:path';

import {glob} from 'glob';

import {jsonSchemaToTypescript} from './json-schema-helpers.mjs';

/** @typedef {import('./__generated__/json-schema-types.mts').JsonSchemaTool} JsonSchemaTool */

/**
 * @param {JsonSchemaTool} param0
 */
export async function handler({includeExtension, outDir, schemas}) {
  if (outDir) {
    outDir = outDir.endsWith(path.sep) ? outDir : outDir + path.sep;
  }

  const strings = schemas.map((s) => {
    assert(typeof s === 'string', 'schema must be a string');
    return s;
  });

  const filenames = await glob(strings);
  await Promise.all(
    filenames.map(async (filename) => {
      if (outDir) {
        const sharedBased = commonPrefix(filename, outDir);
        const outFilename = filename
          .replace(sharedBased, outDir)
          .replace(/\.json$/, '.ts');

        await mkdir(path.dirname(outFilename), {recursive: true});
        await jsonSchemaToTypescript({infile: filename, outfile: outFilename});
      } else {
        await jsonSchemaToTypescript({
          infile: filename,
          outfile: includeExtension
            ? filename.replace(/\.json$/, '.d.json.ts')
            : filename.replace(/\.json$/, '.d.ts'),
        });
      }
    })
  );
}

/**
 * @param {string} a
 * @param {string} b
 */
function commonPrefix(a, b) {
  const length = Math.min(a.length, b.length);
  let i = 0;
  while (i < length && a[i] === b[i]) {
    i++;
  }
  return a.slice(0, i);
}
