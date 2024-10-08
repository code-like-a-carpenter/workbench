import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';

import {
  readPackageJson,
  writePrettierFile,
} from '@code-like-a-carpenter/tooling-common';

/** @typedef {import('./types.mjs').ToolMetadata} ToolMetadata */

/**
 * @param {ToolMetadata} metadata
 */
export async function addExecutorsToJson(metadata) {
  let json;
  try {
    json = JSON.parse(await readFile(metadata.executorsJson, 'utf-8'));
  } catch {
    json = {executors: {}};
  }

  for (const item of metadata.metadata) {
    json.executors[item.toolName] = {
      description: item.description,
      implementation: `./${path.relative(metadata.root, item.built ? item.buildDirExecutorPath : item.executorShimPath)}`,
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

/**
 * @param {ToolMetadata} metadata
 */
export async function addExecutorsToPackageJson(metadata) {
  const pkg = await readPackageJson(metadata.packageJson);

  pkg.executors = `./${path.relative(metadata.root, metadata.executorsJson)}`;

  await writeFile(metadata.packageJson, `${JSON.stringify(pkg, null, 2)}\n`);
}

/**
 * @param {ToolMetadata} metadata
 */
export async function generateExecutors(metadata) {
  await Promise.all(
    metadata.metadata.map(async (item) => {
      let typesImportPath = path.relative(
        path.dirname(item.executorPath),
        item.typesPath
      );
      typesImportPath = path.join(
        path.dirname(typesImportPath),
        path.basename(typesImportPath)
      );

      if (item.built) {
        await writePrettierFile(
          item.executorPath,
          `
import type {Executor} from '@nx/devkit';

import {handler} from '../${item.toolName}.ts';

import type {${item.typesImportName}} from './${typesImportPath}';

const executor: Executor<${item.typesImportName}> = async (args) => {
  await handler(args);

  return {success: true};
}

export default executor;
`
        );
      } else {
        await writePrettierFile(
          item.executorPath,
          `
/**
 * @template T
 * @typedef {import('@nx/devkit').PromiseExecutor<T>} PromiseExecutor
 */
/** @typedef {import('./${typesImportPath}').${item.typesImportName}} ${item.typesImportName} */

/** @type {PromiseExecutor<${item.typesImportName}>} */
export const executor = async (args) => {
  const {handler} = await import('../${item.toolName}.mjs');
  await handler(args);

  return {success: true};
}
`
        );

        await writePrettierFile(
          item.executorShimPath,
          `
// @ts-expect-error
async function exec(...args) {
  const {executor} = await import('./${path.basename(item.executorPath)}');
  // @ts-expect-error
  return executor(...args);
}
module.exports = exec;
`
        );
      }
    })
  );
}
