import assert from 'node:assert';
import {readFile} from 'node:fs/promises';

import findUp from 'find-up';
import {glob} from 'glob';

/**
 * @returns A map of package names to their package.json file paths
 */
export async function findLocalPackages(): Promise<Map<string, string>> {
  const packagePath = await findUp('package.json');
  assert(packagePath, 'Could not find package.json');
  assert(
    packagePath.endsWith('package.json'),
    `packagePath must end with package.json, got ${packagePath}`
  );

  const pkg = JSON.parse(await readFile(packagePath, 'utf-8'));
  const {workspaces} = pkg;
  const packageFiles = await glob(
    workspaces.map((w: string) => `${w}/package.json`)
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
        return [name, packageFile] as const;
      })
    )
  );
}
