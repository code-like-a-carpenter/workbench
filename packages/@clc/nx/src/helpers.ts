import assert from 'node:assert';
import {readFile, writeFile} from 'node:fs/promises';

import type {ExecutorContext} from '@nx/devkit';
import type {JSONSchemaForNPMPackageJsonFiles} from '@schemastore/package';
import findUp from 'find-up';
import {glob} from 'glob';
import prettier from 'prettier';

export function extractProjectName(context: ExecutorContext): string {
  const {projectName} = context;
  assert(projectName, 'Expected a projectName to be set in the context');
  return projectName;
}

export function extractProjectRoot(context: ExecutorContext): string {
  const projectName = extractProjectName(context);
  const project = context.projectsConfigurations?.projects[projectName];
  assert(project, `Expected a project configuration for ${projectName}`);
  const {root} = project;
  return root;
}

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

export async function readPackageJson(
  filename: string
): Promise<JSONSchemaForNPMPackageJsonFiles> {
  return JSON.parse(await readFile(filename, 'utf-8'));
}

export async function writePackageJson(
  filename: string,
  pkg: JSONSchemaForNPMPackageJsonFiles
) {
  await writePrettierFile(filename, JSON.stringify(pkg, null, 2));
}

export async function writePrettierFile(filename: string, content: string) {
  const config = await prettier.resolveConfig(filename);
  const formatted = await prettier.format(content, {
    ...config,
    filepath: filename,
  });
  await writeFile(filename, formatted);
}
