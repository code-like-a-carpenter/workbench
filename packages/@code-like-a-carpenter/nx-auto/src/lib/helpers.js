'use strict';

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
  return path.resolve(process.cwd(), 'packages', packageName);
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
