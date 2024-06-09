import assert from 'node:assert';

import {writePrettierFile} from '@code-like-a-carpenter/tooling-common';

/** @typedef {import('@nx/devkit').ExecutorContext} ExecutorContext */

/** @typedef {import('@schemastore/package')} JSONSchemaForNPMPackageJsonFiles */

/**
 * @param {ExecutorContext} context
 * @returns {string}
 */
export function extractProjectName(context) {
  const {projectName} = context;
  assert(projectName, 'Expected a projectName to be set in the context');
  return projectName;
}

/**
 * @param {ExecutorContext} context
 * @returns {string}
 */
export function extractProjectRoot(context) {
  const projectName = extractProjectName(context);
  const project = context.projectsConfigurations?.projects[projectName];
  assert(project, `Expected a project configuration for ${projectName}`);
  const {root} = project;
  return root;
}

/**
 * @param {string} filename
 * @param {JSONSchemaForNPMPackageJsonFiles} pkg
 */
export async function writePackageJson(filename, pkg) {
  await writePrettierFile(filename, JSON.stringify(pkg, null, 2));
}
