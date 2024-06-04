import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';

import {
  readPackageJson,
  writePrettierFile,
} from '@code-like-a-carpenter/tooling-common';

import type {ToolMetadata} from './metadata.ts';

export async function addExecutorsToJson(
  metadata: ToolMetadata
): Promise<void> {
  let json;
  try {
    json = JSON.parse(await readFile(metadata.executorsJson, 'utf-8'));
  } catch {
    json = {executors: {}};
  }

  for (const item of metadata.metadata) {
    json.executors[item.toolName] = {
      description: item.description,
      implementation: `./${path.relative(metadata.root, item.executorPath)}`,
      schema: `./${path.relative(metadata.root, item.schemaPath)}`,
    };
  }

  await writeFile(
    metadata.executorsJson,
    `${JSON.stringify(
      Object.fromEntries(
        Object.entries(json).sort(([a], [b]) => a.localeCompare(b))
      ),
      null,
      2
    )}\n`
  );
}

export async function addExecutorsToPackageJson(
  metadata: ToolMetadata
): Promise<void> {
  const pkg = await readPackageJson(metadata.packageJson);

  pkg.executors = `./${path.relative(metadata.root, metadata.executorsJson)}`;

  await writeFile(metadata.packageJson, `${JSON.stringify(pkg, null, 2)}\n`);
}

export async function generateExecutors(metadata: ToolMetadata): Promise<void> {
  await Promise.all(
    metadata.metadata.map(async (item) => {
      let typesImportPath = path.relative(
        path.dirname(item.executorPath),
        item.typesPath
      );
      typesImportPath = path.join(
        path.dirname(typesImportPath),
        path.basename(typesImportPath, path.extname(typesImportPath))
      );

      await writePrettierFile(
        item.executorPath,
        `
import type {Executor} from '@nx/devkit';

import {handler} from '../${item.toolName}';

import type {${item.typesImportName}} from './${typesImportPath}';

const executor: Executor<${item.typesImportName}> = async (args) => {
  await handler(args);

  return {success: true};
};

export default executor;
    `
      );
    })
  );
}
