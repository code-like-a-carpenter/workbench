import {readFile, writeFile} from 'node:fs/promises';

import type {JSONSchemaForNPMPackageJsonFiles} from '@schemastore/package';
import prettier from 'prettier';

export async function writePrettierFile(filename: string, content: string) {
  const config = await prettier.resolveConfig(filename);
  const formatted = await prettier.format(content, {
    ...config,
    filepath: filename,
  });
  await writeFile(filename, formatted);
}

export async function readPackageJson(
  filename: string
): Promise<JSONSchemaForNPMPackageJsonFiles> {
  return JSON.parse(await readFile(filename, 'utf-8'));
}
