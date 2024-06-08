import {existsSync} from 'node:fs';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import path from 'node:path';

import type {JSONSchemaForNPMPackageJsonFiles} from '@schemastore/package';
import findUp from 'find-up';
import kebabCase from 'lodash.kebabcase';

import {assert} from '@code-like-a-carpenter/assert';
import {jsonSchemaToTypescript} from '@code-like-a-carpenter/tool-json-schema';
import {
  readPackageJson,
  writePrettierFile,
} from '@code-like-a-carpenter/tooling-common';

import type {ToolTool} from './__generated__/tool-types.ts';
import {
  addExecutorsToJson,
  addExecutorsToPackageJson,
  generateExecutors,
} from './executors.ts';
import {generatePluginFile} from './generate-plugin.ts';
import type {ToolMetadata} from './metadata.ts';
import {loadToolMetadata} from './metadata.ts';

export async function handler({schemaDir}: ToolTool) {
  const metadata = await loadToolMetadata(schemaDir);
  for (const {schemaPath, typesPath} of metadata.metadata) {
    await mkdir(path.dirname(typesPath), {recursive: true});

    await jsonSchemaToTypescript({
      infile: schemaPath,
      outfile: typesPath,
    });
  }

  await generatePluginFile(metadata);
  await addExecutorsToJson(metadata);
  await addExecutorsToPackageJson(metadata);
  await generateExecutors(metadata);
  await addAsCliPlugin(metadata);
  await generateHandlers(metadata);
}

async function addAsCliPlugin(metadata: ToolMetadata) {
  const pkg = await readPackageJson(metadata.packageJson);
  assert(pkg.name, `Package name is missing from ${metadata.packageJson}`);
  const rootPkgPath = await findUp('package.json', {
    cwd: path.dirname(metadata.root),
  });

  if (rootPkgPath) {
    const rootPkg = await readPackageJson(rootPkgPath);
    if (rootPkg.name === '@code-like-a-carpenter/workbench') {
      // Need to put this in a variable so deps doesn't add it to package.json
      const cliPackageName = '@code-like-a-carpenter/cli';
      const cliPkgPathResolvePath = require.resolve(cliPackageName);
      const cliPkgPath = await findUp('package.json', {
        cwd: path.dirname(cliPkgPathResolvePath),
      });
      assert(cliPkgPath, 'Could not locate directory containing package.json');
      const cliPkg = await readPackageJson(cliPkgPath);
      await addToPackageJson(cliPkg, cliPkgPath, pkg.name);
      return;
    }

    await addToPackageJson(rootPkg, rootPkgPath, pkg.name);
    return;
  }

  await addToPackageJson(pkg, metadata.packageJson, pkg.name);
}

async function addToPackageJson(
  pkg: JSONSchemaForNPMPackageJsonFiles,
  packagePath: string,
  toolPackageName: string
) {
  const plugins = new Set(pkg['code-like-a-carpenter']?.plugins || []);
  plugins.add(toolPackageName);
  pkg['code-like-a-carpenter'] = pkg['code-like-a-carpenter'] || {};
  pkg['code-like-a-carpenter'].plugins = Array.from(plugins).sort();
  await writeFile(packagePath, `${JSON.stringify(pkg, null, 2)}\n`);
}

async function generateHandlers(metadata: ToolMetadata) {
  await Promise.all(
    metadata.metadata.map(async (item) => {
      const handlerPath = path.join(
        metadata.root,
        'src',
        `${kebabCase(item.toolName)}.ts`
      );

      if (!existsSync(handlerPath)) {
        await writePrettierFile(
          handlerPath,
          `
import type {${item.typesImportName}} from './${path.relative(path.dirname(handlerPath), item.typesPath)}';

export async function handler(args: ${item.typesImportName}): Promise<void> {}`
        );
      }
    })
  );

  try {
    const indexContent = await readFile(
      path.join(metadata.root, 'src', 'index.ts'),
      'utf-8'
    );

    if (
      !indexContent.includes(
        `export {plugin as default} from './__generated__/plugin.ts';`
      )
    ) {
      await writePrettierFile(
        path.join(metadata.root, 'src', 'index.ts'),
        `export {plugin as default} from './__generated__/plugin.ts';\n${indexContent.trim()}`
      );
    }
  } catch (err) {
    if (err instanceof Error && 'code' in err && err.code === 'ENOENT') {
      await writePrettierFile(
        path.join(metadata.root, 'src', 'index.ts'),
        `export {plugin as default} from './__generated__/plugin';\n`
      );
      return;
    }
    throw err;
  }
}
