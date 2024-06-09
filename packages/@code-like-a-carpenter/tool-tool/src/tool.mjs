import {existsSync} from 'node:fs';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
import path from 'node:path';

import findUp from 'find-up';
import kebabCase from 'lodash.kebabcase';

import {assert} from '@code-like-a-carpenter/assert';
import {jsonSchemaToTypescript} from '@code-like-a-carpenter/tool-json-schema';
import {
  readPackageJson,
  writePrettierFile,
} from '@code-like-a-carpenter/tooling-common';

import {
  addExecutorsToJson,
  addExecutorsToPackageJson,
  generateExecutors,
} from './executors.mjs';
import {generatePluginFile} from './generate-plugin.mjs';
import {loadToolMetadata} from './metadata.mjs';

/** @typedef {import('@schemastore/package').JSONSchemaForNPMPackageJsonFiles} JSONSchemaForNPMPackageJsonFiles */
/** @typedef {import('./__generated__/tool-types.mts').ToolTool} ToolTool */
/** @typedef {import('./metadata.mts').ToolMetadata} ToolMetadata */

/**
 * @param {ToolTool} args
 * @return {Promise<void>}
 */
export async function handler(args) {
  const metadata = await loadToolMetadata(args);
  for (const {schemaPath, typesPath} of metadata.metadata) {
    await mkdir(path.dirname(typesPath), {recursive: true});

    await jsonSchemaToTypescript({
      infile: schemaPath,
      outfile: typesPath,
    });
  }

  await generatePluginFile(metadata);
  await addExecutorsToJson(metadata);
  await addExecutorsToPackageJson(metadata);
  await generateExecutors(metadata);
  await addAsCliPlugin(metadata);
  await generateHandlers(metadata);
}

/**
 * @param {ToolMetadata} metadata
 */
async function addAsCliPlugin(metadata) {
  const pkg = await readPackageJson(metadata.packageJson);
  assert(pkg.name, `Package name is missing from ${metadata.packageJson}`);
  const rootPkgPath = await findUp('package.json', {
    cwd: path.dirname(metadata.root),
  });

  if (rootPkgPath) {
    const rootPkg = await readPackageJson(rootPkgPath);
    if (rootPkg.name === '@code-like-a-carpenter/workbench') {
      const require = createRequire(import.meta.url);
      // Need to put this in a variable so deps doesn't add it to package.json
      const cliPackageName = '@code-like-a-carpenter/cli';
      const cliPkgPathResolvePath = require.resolve(cliPackageName);
      const cliPkgPath = await findUp('package.json', {
        cwd: path.dirname(cliPkgPathResolvePath),
      });
      assert(cliPkgPath, 'Could not locate directory containing package.json');
      const cliPkg = await readPackageJson(cliPkgPath);
      await addToPackageJson(cliPkg, cliPkgPath, pkg.name);
      return;
    }

    await addToPackageJson(rootPkg, rootPkgPath, pkg.name);
    return;
  }

  await addToPackageJson(pkg, metadata.packageJson, pkg.name);
}

/**
 * @param {JSONSchemaForNPMPackageJsonFiles} pkg
 * @param {string} packagePath
 * @param {string} toolPackageName
 */
async function addToPackageJson(pkg, packagePath, toolPackageName) {
  const plugins = new Set(pkg['code-like-a-carpenter']?.plugins || []);
  plugins.add(toolPackageName);
  pkg['code-like-a-carpenter'] = pkg['code-like-a-carpenter'] || {};
  pkg['code-like-a-carpenter'].plugins = Array.from(plugins).sort();
  await writeFile(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);
}

/**
 * @param {ToolMetadata} metadata}
 * @return {Promise<void>}
 */
async function generateHandlers(metadata) {
  await Promise.all(
    metadata.metadata.map(async (item) => {
      const handlerPath = path.join(
        metadata.root,
        'src',
        `${kebabCase(item.toolName)}.${metadata.built ? 'ts' : 'mjs'}`
      );

      if (!existsSync(handlerPath)) {
        await writePrettierFile(
          handlerPath,
          `
import type {${item.typesImportName}} from './${path.relative(path.dirname(handlerPath), item.typesPath)}';

export async function handler(args: ${item.typesImportName}): Promise<void> {}`
        );
      }
    })
  );

  const indexFile = path.join(
    metadata.root,
    'src',
    `index.${metadata.built ? 'ts' : 'mjs'}`
  );

  const pluginFile = `./${path.join(
    '__generated__',
    `plugin.${metadata.built ? 'ts' : 'mjs'}`
  )}`;

  const importLine = `export {plugin as default} from '${pluginFile}';`;

  try {
    const indexContent = await readFile(indexFile, 'utf-8');

    if (!indexContent.includes(importLine)) {
      await writePrettierFile(
        indexFile,
        `${importLine}\n${indexContent.trim()}`
      );
    }
  } catch (err) {
    if (err instanceof Error && 'code' in err && err.code === 'ENOENT') {
      await writePrettierFile(indexFile, `${importLine}\n`);
      return;
    }
    throw err;
  }
}
