import {mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';

import generateImport from '@babel/generator';
import type {TemplateBuilder} from '@babel/template';
import templateImport from '@babel/template';
import * as t from '@babel/types';
import type {Statement} from '@babel/types';

import {assert} from '@code-like-a-carpenter/assert';

import type {InlinerExecutor} from './__generated__/inliner-types.ts';

const template: TemplateBuilder<Statement | Statement[]> =
  templateImport.default ?? templateImport;
const generate = generateImport.default ?? generateImport;

export async function handler(args: InlinerExecutor): Promise<void> {
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
