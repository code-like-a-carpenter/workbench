import {readFile, writeFile} from 'node:fs/promises';

import generate from '@babel/generator';
import template from '@babel/template';
import * as t from '@babel/types';
import type {Executor} from '@nx/devkit';

import type {InlinerExecutor} from './schema';

const runExecutor: Executor<InlinerExecutor> = async (
  options: InlinerExecutor
) => {
  const {sourceFile, targetFile, exportName} = options;
  const raw = (await readFile(sourceFile, 'utf-8')).replace(/`/g, '\\`');

  const tpl = template('export const %%exportName%% = %%raw%%');

  const ast = tpl({
    exportName: t.identifier(exportName),
    raw: t.templateLiteral([t.templateElement({raw}, false)], []),
  });

  await writeFile(targetFile, `${generate(ast).code}\n`);

  return {
    success: true,
  };
};

export default runExecutor;
