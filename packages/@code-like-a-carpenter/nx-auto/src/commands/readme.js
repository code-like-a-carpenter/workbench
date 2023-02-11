'use strict';

const fs = require('fs');
const path = require('path');

const {readPackageJson, writePrettierFile} = require('../lib/helpers');
const {ensureSections} = require('../readme');

/** @type import('yargs').CommandModule */
const command = {
  builder(yargs) {
    return yargs.options({
      packageName: {
        description: 'The name of the package to generate a README for',
        required: true,
        type: 'string',
      },
    });
  },
  command: 'readme',
  async handler({packageName}) {
    const {remark} = await import('remark');
    const remarkStringify = await import('remark-stringify');
    const remarkToc = await import('remark-toc');

    const {ensureHeader} = require('../readme');

    const readmePath = path.join('packages', packageName, 'README.md');
    const readme = await safeReadFile(readmePath);

    const pkg = await readPackageJson(packageName);

    const result = await remark()
      .use(ensureHeader, {pkg})
      .use(ensureSections, {pkg})
      .use(remarkToc.default ?? remarkToc, {
        heading: 'Table of Contents',
        tight: true,
      })
      .use(remarkStringify.default ?? remarkStringify)
      .process(readme);

    if (result.messages.length) {
      for (const message of result.messages) {
        console.error(message);
      }

      throw new Error('Encountered errors while transforming README.md');
    }

    await writePrettierFile(readmePath, result.toString());
  },
};

module.exports = command;

/**
 * @param {string} filename
 * @returns {Promise<string>}
 */
async function safeReadFile(filename) {
  try {
    return await fs.promises.readFile(filename, 'utf-8');
  } catch {
    return '';
  }
}
