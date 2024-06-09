import path from 'node:path';

import {glob} from 'glob';

import {assert} from '@code-like-a-carpenter/assert';
import {
  getStackName,
  readPackageJson,
} from '@code-like-a-carpenter/tooling-common';

/** @typedef {import('./__generated__/list-types.mts').StackListSchema} StackListSchema */

/**
 * @param {StackListSchema} args
 */
export async function handler(args) {
  const files =
    args.test ?? (await glob(['**/template.yml', '**/template.json']));
  const strings = files.map((f) => {
    assert(typeof f === 'string', 'file must be a string');
    return f;
  });

  const packages = Array.from(
    new Set(
      await Promise.all(
        strings
          .filter((template) => !template.includes('node_modules'))
          .map((template) =>
            template.includes('__generated__')
              ? path.dirname(path.dirname(template))
              : path.dirname(template)
          )
          .map((templateDir) => path.join(templateDir, 'package.json'))
          .map(async (pkgPath) => {
            const pkg = await readPackageJson(pkgPath);
            assert(pkg.name, `package.json "${pkgPath}" must have a name`);
            return pkg.name;
          })
      )
    )
  );

  if (args.asProjects) {
    console.log(packages.join('\n'));
    return;
  }

  packages
    .map((pkg) => getStackName(pkg))
    .forEach((stackName) => console.log(stackName));
}
