import {createRequire} from 'node:module';
import path from 'node:path';

import {build} from 'esbuild';
import {globSync} from 'glob';
import {minimatch} from 'minimatch';

/** @typedef {import('@nx/devkit').Executor} Executor */
/** @typedef {import('./schema.d.json').EsbuildExecutor} EsbuildExecutor */

/** @type {Executor<EsbuildExecutor>} */
const runExecutor = async (options) => {
  const {entryPoints: patterns, format, outDir} = options;

  const eps = patterns.reduce((acc, pattern) => {
    if (pattern.startsWith('!')) {
      return acc.filter((match) => minimatch(match, pattern));
    }
    return [...acc, ...globSync(pattern)];
  }, []);

  await build({
    // if bundle is false, esbuild won't crawl the dependency tree. In order to
    // avoid bundling, we need to mark everything as external.
    // `packages:'external'` should cover node modules and the return value in
    // the 'rewrite-extensions' plugin should cover everything else.
    bundle: true,
    entryPoints: eps,
    format,
    outExtension: {'.js': format === 'cjs' ? '.cjs' : '.mjs'},
    outdir: outDir,
    packages: 'external',
    platform: 'node',
    plugins: [
      {
        // Borrowed from https://github.com/favware/esbuild-plugin-file-path-extensions
        name: 'rewrite-extensions',
        setup: (ctx) => {
          ctx.onResolve({filter: /.*/, namespace: 'file'}, (args) => {
            if (
              args.kind === 'import-statement' &&
              args.importer &&
              args.path.startsWith('.')
            ) {
              const require = createRequire(import.meta.url);
              const fullPath = require.resolve(
                path.join(args.resolveDir, args.path)
              );

              let relPath = path.relative(
                // args.importer is a filename, so we need to get the directory
                path.dirname(args.importer),
                fullPath
              );
              // for same-dir relative paths, we need to add the './' prefix
              // back
              if (!relPath.startsWith('.')) {
                relPath = `./${relPath}`;
              }

              // And we need to remove the extension so that we can add it with
              // to the return value down below.
              const ext = path.extname(fullPath);
              relPath = relPath.replace(new RegExp(`${ext}$`), '');

              return {
                external: true,
                path: `${relPath}.${format === 'cjs' ? 'cjs' : 'mjs'}`,
              };
            }

            return undefined;
          });
        },
      },
    ],
    sourcemap: 'linked',
  });

  return {
    success: true,
  };
};

export default runExecutor;
