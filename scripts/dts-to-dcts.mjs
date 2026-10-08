#!/usr/bin/env node

/**
 * Produces `dist/cjs-types` from `dist/types`.
 *
 * Every package is `"type": "module"`, so a `.d.ts` under it is read as ESM no
 * matter what `exports` says. The CommonJS half of `exports` therefore needs
 * declarations whose extension forces CJS: `.d.cts`, whose relative specifiers
 * resolve to sibling `.d.cts` files (a `.cjs` specifier resolves to `.d.cts`
 * under node16).
 */

import {cp, mkdir, readdir, readFile, rm, writeFile} from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const SPECIFIER_EXTENSIONS = [
  '.mts',
  '.mjs',
  '.cts',
  '.cjs',
  '.tsx',
  '.jsx',
  '.ts',
  '.js',
];

const DECLARATION_SUFFIXES = [
  '.d.mts.map',
  '.d.cts.map',
  '.d.ts.map',
  '.d.mts',
  '.d.cts',
  '.d.ts',
];

/**
 * Extensions TypeScript resolves without help from this script: JSON keeps
 * resolving as JSON, and the file itself is copied through unchanged.
 */
const PASSTHROUGH_EXTENSIONS = ['.json'];

/**
 * Treats every quoted string starting with `./` or `../` as a module
 * specifier, which covers `from`, bare `import`, `import()` types, `require()`,
 * and `declare module` alike. Any other quoted relative path gets the same
 * treatment — a string literal type, a template literal type, or a doc comment
 * — and an extensionless one throws. No declaration in this repo has one, and
 * the alternative is parsing TypeScript here.
 */
const RELATIVE_SPECIFIER = /(['"])(\.\.?\/[^'"\n]*)\1/g;

/**
 * Reference paths need their own pass because, unlike a module specifier, one
 * may name a sibling without a leading `./`.
 */
const REFERENCE_PATH = /(<reference\s+path\s*=\s*(['"]))([^'"\n]*)(\2)/g;

const SOURCE_MAPPING_URL = /(\/\/#\s*sourceMappingURL=)(\S+)/g;

/**
 * @param {string} name
 * @returns {string | undefined}
 */
function declarationSuffix(name) {
  return DECLARATION_SUFFIXES.find((suffix) => name.endsWith(suffix));
}

/**
 * A specifier that already names a declaration file points at the sibling
 * `.d.cts` rather than at a `.cjs` implementation.
 *
 * An extensionless or directory specifier has no rewrite that works: node16
 * CommonJS resolution finds neither `./x.d.cts` through `./x` nor
 * `./dir/index.d.cts` through `./dir`, so the declaration would resolve to
 * nothing. Fail rather than emit output that type-checks as an unresolved
 * module.
 *
 * @param {string} specifier
 * @param {string} source the declaration being converted, for the error
 * @returns {string}
 */
function toCjsSpecifier(specifier, source) {
  if (declarationSuffix(specifier)) {
    return toCjsFilename(specifier);
  }
  for (const extension of SPECIFIER_EXTENSIONS) {
    if (specifier.endsWith(extension)) {
      return `${specifier.slice(0, -extension.length)}.cjs`;
    }
  }
  if (
    PASSTHROUGH_EXTENSIONS.some((extension) => specifier.endsWith(extension))
  ) {
    return specifier;
  }
  throw new Error(
    `${source}: relative specifier "${specifier}" has no extension to rewrite; ` +
      `CommonJS declarations cannot resolve it. Give the import an explicit extension.`
  );
}

/**
 * @param {string} filename
 * @returns {string}
 */
function toCjsFilename(filename) {
  const suffix = declarationSuffix(filename);
  if (suffix) {
    const replacement = suffix.endsWith('.map') ? '.d.cts.map' : '.d.cts';
    return `${filename.slice(0, -suffix.length)}${replacement}`;
  }
  return filename;
}

/**
 * @param {string} filename
 * @returns {boolean}
 */
function isDeclaration(filename) {
  return (
    filename.endsWith('.d.ts') ||
    filename.endsWith('.d.mts') ||
    filename.endsWith('.d.cts')
  );
}

/**
 * @param {string} filename
 * @returns {boolean}
 */
function isDeclarationMap(filename) {
  return (
    filename.endsWith('.d.ts.map') ||
    filename.endsWith('.d.mts.map') ||
    filename.endsWith('.d.cts.map')
  );
}

/**
 * @param {string} contents
 * @param {string} source the declaration being converted, for error messages
 * @returns {string}
 */
function convertDeclaration(contents, source) {
  return contents
    .replace(
      REFERENCE_PATH,
      (_match, prefix, _quote, target, suffix) =>
        `${prefix}${toCjsFilename(target)}${suffix}`
    )
    .replace(
      RELATIVE_SPECIFIER,
      (_match, quote, specifier) =>
        `${quote}${toCjsSpecifier(specifier, source)}${quote}`
    )
    .replace(
      SOURCE_MAPPING_URL,
      (_match, prefix, url) => `${prefix}${toCjsFilename(url)}`
    );
}

/**
 * `sources` stay correct because `dist/cjs-types` sits at the same depth as
 * `dist/types`; only the name of the declaration the map describes changes.
 *
 * `mappings` are left alone. Rewriting `.ts` to `.cjs` lengthens a specifier by
 * one character, so columns after it on that line are off by one; that is
 * cheaper to live with than re-emitting the map.
 *
 * @param {string} contents
 * @returns {string}
 */
function convertDeclarationMap(contents) {
  const map = JSON.parse(contents);
  if (typeof map.file === 'string') {
    map.file = toCjsFilename(map.file);
  }
  return `${JSON.stringify(map)}\n`;
}

/**
 * @param {string} dir
 * @returns {Promise<string[]>} paths relative to `dir`
 */
async function walk(dir) {
  const entries = await readdir(dir, {recursive: true, withFileTypes: true});
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) =>
      path.relative(dir, path.join(entry.parentPath, entry.name))
    );
}

/**
 * @param {string} projectRoot
 */
async function main(projectRoot) {
  const typesDir = path.join(projectRoot, 'dist', 'types');
  const cjsTypesDir = path.join(projectRoot, 'dist', 'cjs-types');

  const relativePaths = await walk(typesDir);
  if (relativePaths.length === 0) {
    throw new Error(
      `${typesDir} is empty; every package's require condition points at dist/cjs-types/index.d.cts`
    );
  }

  // Anything left in `dist/cjs-types` from a previous run would otherwise
  // survive a rename or deletion in `dist/types`.
  await rm(cjsTypesDir, {force: true, recursive: true});

  /** @type {Map<string, string>} */
  const claimed = new Map();

  for (const relativePath of relativePaths) {
    const from = path.join(typesDir, relativePath);
    const to = path.join(
      cjsTypesDir,
      path.join(
        path.dirname(relativePath),
        toCjsFilename(path.basename(relativePath))
      )
    );

    const previous = claimed.get(to);
    if (previous) {
      throw new Error(
        `${previous} and ${relativePath} both convert to ${path.relative(projectRoot, to)}`
      );
    }
    claimed.set(to, relativePath);

    await mkdir(path.dirname(to), {recursive: true});

    const filename = path.basename(relativePath);
    if (isDeclaration(filename)) {
      await writeFile(
        to,
        convertDeclaration(await readFile(from, 'utf8'), relativePath)
      );
    } else if (isDeclarationMap(filename)) {
      await writeFile(to, convertDeclarationMap(await readFile(from, 'utf8')));
    } else {
      await cp(from, to);
    }
  }
}

const [projectRoot] = process.argv.slice(2);
if (!projectRoot) {
  process.stderr.write(
    `usage: ${path.basename(process.argv[1])} <projectRoot>\n`
  );
  process.exit(1);
}

await main(projectRoot);
