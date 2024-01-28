import path from 'node:path';

import type {Executor} from '@nx/devkit';
import {build} from 'esbuild';
import {globSync} from 'glob';
import {minimatch} from 'minimatch';

import type {EsbuildExecutor} from './schema';

const runExecutor: Executor<EsbuildExecutor> = async (options) => {
  const {entryPoints: patterns, format, outDir} = options;

  const eps = patterns.reduce<string[]>((acc, pattern) => {
    if (pattern.startsWith('!')) {
      return acc.filter((match) => minimatch(match, pattern));
    }
    return [...acc, ...globSync(pattern)];
  }, []);

  await build({
    bundle: false,
    entryPoints: eps,
    format,
    outdir: outDir,
    platform: 'node',
    sourcemap: true,
  });

  return {
    success: true,
  };
};

export default runExecutor;
