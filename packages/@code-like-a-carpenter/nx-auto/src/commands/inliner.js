'use strict';

const {readFile, writeFile} = require('node:fs/promises');

const {default: generate} = require('@babel/generator');
const {default: template} = require('@babel/template');
const t = require('@babel/types');

/** @type import('yargs').CommandModule */
const command = {
  builder(yargs) {
    return yargs.options({
      exportName: {
        demandOption: true,
        type: 'string',
      },
      sourceFile: {
        demandOption: true,
        type: 'string',
      },
      targetFile: {
        demandOption: true,
        type: 'string',
      },
    });
  },
  command: 'readme',
  async handler({exportName, sourceFile, targetFile}) {
    const raw = (await readFile(sourceFile, 'utf-8')).replace(/`/g, '\\`');

    const tpl = template('export const %%exportName%% = %%raw%%');

    const ast = tpl({
      exportName: t.identifier(exportName),
      raw: t.templateLiteral([t.templateElement({raw}, false)], []),
    });

    // @ts-expect-error
    await writeFile(targetFile, `${generate(ast).code}\n`);
  },
};

module.exports = command;
