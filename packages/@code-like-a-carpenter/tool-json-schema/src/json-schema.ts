import assert from 'node:assert';
import {mkdir} from 'node:fs/promises';
import path from 'node:path';

import {glob} from 'glob';

import type {JsonSchemaTool} from './__generated__/json-schema-types.ts';
import {jsonSchemaToTypescript} from './json-schema-helpers';

export async function handler({
  outDir,
  schemas,
}: JsonSchemaTool): Promise<void> {
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
          outfile: filename.replace(/\.json$/, '.d.ts'),
        });
      }
    })
  );
}

function commonPrefix(a: string, b: string) {
  const length = Math.min(a.length, b.length);
  let i = 0;
  while (i < length && a[i] === b[i]) {
    i++;
  }
  return a.slice(0, i);
}
