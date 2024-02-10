import {mkdir} from 'node:fs/promises';
import path from 'node:path';

import type {Executor} from '@nx/devkit';
import {glob} from 'glob';

import {jsonSchemaToTypescript} from '@code-like-a-carpenter/tooling-common';

import type {JsonSchemaExecutor} from './schema';

const executor: Executor<JsonSchemaExecutor> = async ({outDir, schemas}) => {
  if (outDir) {
    outDir = outDir.endsWith(path.sep) ? outDir : outDir + path.sep;
  }

  const filenames = await glob(schemas);
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

  return {
    success: true,
  };
};

function commonPrefix(a: string, b: string) {
  const length = Math.min(a.length, b.length);
  let i = 0;
  while (i < length && a[i] === b[i]) {
    i++;
  }
  return a.slice(0, i);
}

export default executor;
