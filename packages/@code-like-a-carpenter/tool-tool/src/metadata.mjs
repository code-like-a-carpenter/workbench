import {lstat, readdir} from 'node:fs/promises';
import path from 'node:path';

import findUp from 'find-up';
import camelCase from 'lodash.camelcase';
import kebabCase from 'lodash.kebabcase';
import upperFirst from 'lodash.upperfirst';

import {assert} from '@code-like-a-carpenter/assert';
import {readPackageJson} from '@code-like-a-carpenter/tooling-common';

/** @typedef {import('./types.mts').ToolMetadata} ToolMetadata */

/**
 * @param {string} schemaDir
 * @return {Promise<ToolMetadata>}
 */
export async function loadToolMetadata(schemaDir) {
  const stats = await lstat(schemaDir);
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

  return {
    executorsJson: path.join(root, 'executors.json'),
    generatedDir,
    metadata: await Promise.all(
      schemaFiles.map(async (schemaPath) => {
        const toolName = path.basename(schemaPath, path.extname(schemaPath));

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
          executorShimPath: path.join(
            generatedDir,
            `${kebabCase(toolName)}-executor.shim.cjs`
          ),
          schema: jsonSchema,
          schemaPath,
          toolName,
          typesImportName,
          typesPath: path.join(
            generatedDir,
            `${kebabCase(toolName)}-types.mts`
          ),
        };
      })
    ),
    packageJson: path.join(root, 'package.json'),
    root,
  };
}
