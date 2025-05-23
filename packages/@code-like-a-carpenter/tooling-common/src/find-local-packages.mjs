import assert from 'node:assert';
import {readFile} from 'node:fs/promises';

import findUp from 'find-up';
import {glob} from 'glob';

import {readPackageJson} from './filesystem.mjs';

/**
 * @returns {Promise<Map<string, string>>} A map of package names to their package.json file paths
 */
export async function findLocalPackages() {
  const packagePath = await findUp('package.json');
  assert(packagePath, 'Could not find package.json');
  assert(
    packagePath.endsWith('package.json'),
    `packagePath must end with package.json, got ${packagePath}`
  );

  const pkg = await readPackageJson(packagePath);
  const workspaces = pkg.workspaces ?? [];
  assert(
    Array.isArray(workspaces),
    'This project currently only supports the Array form of workspaces'
  );
  const packageFiles = await glob(
    workspaces.map((w) => `${w}/package.json`),
    {ignore: '**/node_modules/**'}
  );

  return new Map(
    await Promise.all(
      packageFiles.map(async (packageFile) => {
        const p = JSON.parse(await readFile(packageFile, 'utf-8'));
        const {name} = p;
        assert(name, `${packageFile} is missing its name field`);
        assert(
          typeof name === 'string',
          `${packageFile} has an invalid name field`
        );
        /** @type {[string, string]} */
        const ret = [name, packageFile];
        return ret;
      })
    )
  );
}
