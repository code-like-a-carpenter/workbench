import assert from 'node:assert';
import {existsSync} from 'node:fs';
import {readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';

import {parseAsync, traverse} from '@babel/core';
import {glob} from 'glob';

/** @typedef {import('@babel/traverse').NodePath} NodePath */
/** @typedef {import('@babel/core').ExportAllDeclaration} ExportAllDeclaration */

/** @typedef {import('@babel/core').ExportDeclaration} ExportDeclaration */
/** @typedef {import('@babel/core').ImportDeclaration} ImportDeclaration */

// trick babel into thinking we're in test mode because of the "never use
// this except for tests" thing I put in the config
process.env.NODE_ENV = 'test';

async function main() {
  const files = await glob(
    [
      'examples/**/src/**/*.ts',
      'examples/*/*.ts',
      'examples/*/__generated__/**/*.ts',
      'packages/**/executors/**/*.ts',
      'packages/**/src/**/*.ts',
    ],
    {
      ignore: ['**/dist/**', '**/node_modules/**'],
    }
  );

  await Promise.all(
    files.map(async (f) => {
      const fullPathToFile = path.resolve(f);
      const file = await readFile(fullPathToFile, 'utf-8');

      const ast = await parseAsync(file, {
        babelrc: false,
        compact: false,
        filename: fullPathToFile,
      });

      const paths = new Map();

      /**
       * @param p {NodePath<ExportAllDeclaration> | NodePath<ImportDeclaration> | NodePath<ExportDeclaration>}
       */
      function cb(p) {
        const currentPath = p.node.source.value;
        if (currentPath.startsWith('.') && path.extname(currentPath) === '') {
          const fullPath = path.resolve(
            path.dirname(fullPathToFile),
            currentPath
          );
          let newPath = fullPath;
          if (existsSync(`${fullPath}.ts`)) {
            newPath = `${fullPath}.ts`;
          } else if (existsSync(`${fullPath}/index.ts`)) {
            newPath = `${fullPath}/index.ts`;
          } else if (fullPath.includes('@clc/nx') && currentPath === '../..') {
            newPath = `${fullPath}/src/index.ts`;
          } else if (
            fullPath.includes('@clc/nx') &&
            currentPath === './schema'
          ) {
            newPath = `${fullPath}.json`;
          } else {
            assert.fail(
              `Could not find real path for ${currentPath} in file ${fullPathToFile}`
            );
          }

          let rel = path.relative(path.dirname(fullPathToFile), newPath);
          if (!rel.startsWith('.')) {
            rel = `./${rel}`;
          }
          paths.set(currentPath, rel);
        }
      }

      traverse(ast, {
        ExportAllDeclaration: (p) => cb(p),
        ExportDeclaration: (p) => p.node.source && cb(p),
        ImportDeclaration: (p) => cb(p),
      });

      let out = file;

      for (const [currentPath, newPath] of paths) {
        const target = `'${currentPath}'`;
        const replacement = `'${newPath}'`;
        // yes, this is very goofy. string-based replace only works for the
        // first hit. I tried regex, but there are too many regex special
        // characters in paths, so this is easier than doing the escaping.
        const count = file.split(target).length - 1;
        assert(count > 0);
        for (let i = 0; i < count; i++) {
          out = out.replace(target, replacement);
        }
      }

      await writeFile(fullPathToFile, out);
    })
  );
}

await main();
