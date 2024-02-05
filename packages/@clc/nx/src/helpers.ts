import assert from 'node:assert';
import {readFile, writeFile} from 'node:fs/promises';

import type {ExecutorContext} from '@nx/devkit';
import type {JSONSchemaForNPMPackageJsonFiles} from '@schemastore/package';
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
