import assert from 'node:assert';

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
  // This needs to be late-imported because nx doesn't do its dotenv loading
  // early enough, so --conditions=carpentry isn't yet set.
  const {writePrettierFile} = await import(
    '@code-like-a-carpenter/tooling-common'
  );
  await writePrettierFile(filename, JSON.stringify(pkg, null, 2));
}
