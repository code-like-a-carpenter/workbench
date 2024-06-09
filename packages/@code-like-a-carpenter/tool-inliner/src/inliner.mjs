import {mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';

import generateImport from '@babel/generator';
import templateImport from '@babel/template';
import * as t from '@babel/types';

import {assert} from '@code-like-a-carpenter/assert';

/**
 * @template T
 * @typedef {import('@babel/template').TemplateBuilder<T>} TemplateBuilder
 */
/** @typedef {import('@babel/types').Statement} Statement t */
/** @typedef {import('./__generated__/inliner-types.mjs').InlinerExecutor} InlinerExecutor */

const generate = generateImport.default ?? generateImport;
/** @type {TemplateBuilder<Statement | Statement[]>}} */
const template = templateImport.default ?? templateImport;

/**
 * @param {InlinerExecutor} args
 */
export async function handler(args) {
  const {sourceFile, targetFile, exportName} = args;
  const raw = (await readFile(sourceFile, 'utf-8')).replace(/`/g, '\\`');

  const tpl = template('export const %%exportName%% = %%raw%%');

  const ast = tpl({
    exportName: t.identifier(exportName),
    raw: t.templateLiteral([t.templateElement({raw}, false)], []),
  });

  assert(!Array.isArray(ast), 'Expected ast to not be an array');

  await mkdir(path.dirname(targetFile), {recursive: true});
  await writeFile(targetFile, `${generate(ast).code}\n`);
}
