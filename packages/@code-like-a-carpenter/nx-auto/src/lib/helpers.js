'use strict';

const assert = require('assert');
const fs = require('fs');
const path = require('path');

const prettier = require('prettier');

/**
 * @param {string} filename
 * @returns {Promise<any>}
 */
async function readJsonFile(filename) {
  return JSON.parse(await fs.promises.readFile(filename, 'utf-8'));
}
exports.readJsonFile = readJsonFile;

/**
 * @param {string} packageName
 * @returns {Promise<import("@schemastore/package").JSONSchemaForNPMPackageJsonFiles>}
 */
async function readPackageJson(packageName) {
  return await readJsonFile(pathToPackageFile(packageName, 'package.json'));
}
exports.readPackageJson = readPackageJson;

/**
 * @param {string} packageName
 * @returns {Promise<import("@schemastore/tsconfig").JSONSchemaForTheTypeScriptCompilerSConfigurationFile>}
 */
async function readTsConfigJson(packageName) {
  return await readJsonFile(pathToPackageFile(packageName, 'tsconfig.json'));
}
exports.readTsConfigJson = readTsConfigJson;

/**
 * @param {string} packageName
 */
function pathToPackage(packageName) {
  if (packageName.startsWith('@')) {
    return path.resolve(process.cwd(), 'packages', packageName);
  }
  return path.resolve(process.cwd(), 'examples', packageName);
}
exports.pathToPackage = pathToPackage;

/**
 * @param {string} packageName
 * @param {string} filename
 * @returns {string}
 */
function pathToPackageFile(packageName, filename) {
  return path.join(pathToPackage(packageName), filename);
}
exports.pathToPackageFile = pathToPackageFile;

/**
 *
 * @param {string} packageName
 * @param {import("@schemastore/package").JSONSchemaForNPMPackageJsonFiles} pkg
 * @returns {Promise<void>}
 */
async function writePackageJson(packageName, pkg) {
  await writePrettierFile(
    pathToPackageFile(packageName, 'package.json'),
    JSON.stringify(pkg, null, 2)
  );
}
exports.writePackageJson = writePackageJson;

/**
 * @param {string} filename
 * @param {string} content
 */
async function writePrettierFile(filename, content) {
  const config = await prettier.resolveConfig(filename);
  const formatted = prettier.format(content, {
    ...config,
    filepath: filename,
  });
  await fs.promises.writeFile(filename, formatted);
}
exports.writePrettierFile = writePrettierFile;

/**
 * @typedef StructuredPerson
 * @property {string} name
 * @property {string?} email
 * @property {string?} url
 */
/**
 * @param {import("@schemastore/package").Person} person
 * @returns {StructuredPerson}
 */
function extractPersonInfo(person) {
  if (typeof person === 'string') {
    const result = person.match(/^(.+?)(?: <(.+)>)?(?: \((.+)\))?$/);
    assert(result, `Unable to parse person string: ${person}`);
    const [, name, email, url] = result;
    return {email, name, url};
  }

  assert(person.name, 'Person must have a name');

  return {
    email: person.email ?? null,
    name: person.name,
    url: person.url ?? null,
  };
}
exports.extractPersonInfo = extractPersonInfo;
