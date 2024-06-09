import {lstat, readdir} from 'node:fs/promises';
import path from 'node:path';

import findUp from 'find-up';
import camelCase from 'lodash.camelcase';
import kebabCase from 'lodash.kebabcase';
import upperFirst from 'lodash.upperfirst';

import {assert} from '@code-like-a-carpenter/assert';
import {readPackageJson} from '@code-like-a-carpenter/tooling-common';

/** @typedef {import('./types.mts').CommonToolMetadataItem} CommonToolMetadataItem */
/** @typedef {import('./types.mts').ToolMetadata} ToolMetadata */
/** @typedef {import('./__generated__/tool-types.mts').ToolTool} ToolTool */

/**
 * @param {ToolTool} args
 * @return {Promise<ToolMetadata>}
 */
export async function loadToolMetadata({buildBeforeRun = true, schemaDir}) {
  const stats = await lstat(schemaDir);
  /** @type {string[]} */
  const schemaFiles = [];
  assert(stats.isDirectory(), `schema ${schemaDir} must be a directory`);
  const files = await readdir(schemaDir);
  for (const file of files) {
    if (file.endsWith('.json')) {
      schemaFiles.push(path.join(schemaDir, file));
    }
  }

  const [first] = schemaFiles;
  const pkgPath = await findUp('package.json', {cwd: first});
  assert(pkgPath, 'Could not locate directory containing package.json');
  const pkg = await readPackageJson(pkgPath);

  const rootPkg = await findUp('package.json', {cwd: path.dirname(first)});
  assert(rootPkg, 'Could not locate root directory containing package.json');
  assert(
    rootPkg.endsWith('package.json'),
    `Expected to find a package.json file, got ${rootPkg}`
  );
  const root = path.dirname(rootPkg);
  const generatedDir = path.join(root, 'src', '__generated__');

  if (buildBeforeRun) {
    return {
      built: true,
      executorsJson: path.join(root, 'executors.json'),
      generatedDir,
      metadata: await Promise.all(
        schemaFiles.map(async (schemaPath) => {
          const toolName = path.basename(schemaPath, path.extname(schemaPath));

          return {
            ...(await collectCommonToolMetadataItem({
              buildBeforeRun,
              generatedDir,
              pkg,
              schemaFiles,
              schemaPath,
              toolName,
            })),

            buildDirExecutorPath: path.join(
              root,
              'dist',
              'cjs',
              '__generated__',
              `${toolName}-executor.cjs`
            ),
            built: true,
            executorPath: path.join(
              generatedDir,
              `${kebabCase(toolName)}-executor.ts`
            ),
          };
        })
      ),
      packageJson: path.join(root, 'package.json'),
      root,
    };
  }

  return {
    built: false,
    executorsJson: path.join(root, 'executors.json'),
    generatedDir,
    metadata: await Promise.all(
      schemaFiles.map(async (schemaPath) => {
        const toolName = path.basename(schemaPath, path.extname(schemaPath));

        return {
          ...(await collectCommonToolMetadataItem({
            buildBeforeRun,
            generatedDir,
            pkg,
            schemaFiles,
            schemaPath,
            toolName,
          })),

          built: false,
          executorShimPath: path.join(
            generatedDir,
            `${kebabCase(toolName)}-executor.shim.cjs`
          ),
        };
      })
    ),
    packageJson: path.join(root, 'package.json'),
    root,
  };
}

/**
 * @param {Object} options
 * @param {boolean} options.buildBeforeRun
 * @param {string} options.generatedDir
 * @param {import('@schemastore/package').JSONSchemaForNPMPackageJsonFiles} options.pkg
 * @param {string[]} options.schemaFiles
 * @param {string} options.schemaPath
 * @param {string} options.toolName
 * @returns {Promise<CommonToolMetadataItem>}
 */
async function collectCommonToolMetadataItem({
  buildBeforeRun,
  generatedDir,
  pkg,
  schemaFiles,
  schemaPath,
  toolName,
}) {
  const jsonSchema = await readPackageJson(schemaPath);
  assert(
    'title' in jsonSchema,
    `json schema at ${schemaPath} must have a title`
  );
  assert(
    typeof jsonSchema.title === 'string',
    'json schema title must be a string'
  );
  const typesImportName = upperFirst(camelCase(jsonSchema.title));

  return {
    commandName:
      schemaFiles.length === 1
        ? toolName
        : `${pkg.name
            ?.split('/')
            ?.pop()
            ?.replace(/^tool-/, '')}:${toolName}`,
    // note, using || instead of ?? in case there's an empty string.
    description: jsonSchema.description || 'No description provided',
    executorPath: path.join(
      generatedDir,
      `${kebabCase(toolName)}-executor.mjs`
    ),
    schema: jsonSchema,
    schemaPath,
    toolName,
    typesImportName,
    typesPath: path.join(
      generatedDir,
      `${kebabCase(toolName)}-types.${buildBeforeRun ? 'ts' : 'mts'}`
    ),
  };
}
