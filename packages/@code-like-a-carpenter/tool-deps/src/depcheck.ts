import {readFile} from 'node:fs/promises';
import path from 'node:path';

import depcheck from 'depcheck';
import {minimatch} from 'minimatch';

export async function runDepcheck(
  packagePath: string,
  packageName: string,
  ignoreDirs: readonly string[],
  definitelyTyped: readonly string[]
) {
  const results = await depcheck(packagePath, {
    detectors: [
      ...Object.values(depcheck.detector),
      (node) => {
        if (node.type === 'CommentBlock' && node.value.includes('import')) {
          return Array.from(
            (node.value as string).matchAll(/import\(['"](.*?)['"]\)/g)
          ).map(([, match]) => match);
        }

        return [];
      },
    ],
    ignoreDirs,
    specials: [
      ...Object.values(depcheck.special),
      (filePath) => {
        if (filePath.endsWith('.tsx')) {
          return ['react', 'react-dom', '@types/react', '@types/react-dom'];
        }

        if (filePath.endsWith('remix.config.js')) {
          return ['@remix-run/dev', '@remix-run/serve'];
        }
        return [];
      },
      // Alias lambda to its types package (need to delete the lambda key from
      // the results below)
      async (filePath) => {
        const raw = await readFile(filePath);
        if (raw.includes('aws-lambda')) {
          return ['@types/aws-lambda'];
        }
        return [];
      },
      // Auto install the types packages for the specified implementation packages
      async (filePath, deps) =>
        deps
          .filter((dep) => definitelyTyped.some((dt) => minimatch(dep, dt)))
          .map((dep) => `@types/${dep}`),
      // Include support for the code-like-a-carpenter plugin system
      async (filePath) => {
        if (path.basename(filePath) === 'package.json') {
          const pkg = JSON.parse(await readFile(filePath, 'utf-8'));
          if (Array.isArray(pkg['code-like-a-carpenter']?.plugins)) {
            return pkg['code-like-a-carpenter'].plugins;
          }
        }

        return [];
      },
    ],
  });

  for (const obj of Object.values(results)) {
    const lambda = obj['aws-lambda'];
    if (lambda) {
      delete obj['aws-lambda'];
    }
  }

  delete results.missing[packageName];

  return results;
}
