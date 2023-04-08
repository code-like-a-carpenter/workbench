import {writeFile, mkdir} from 'node:fs/promises';
import path from 'node:path';

import {codegen} from '@graphql-codegen/core';
import * as typescriptPlugin from '@graphql-codegen/typescript';
import type {DocumentNode} from 'graphql';

import type {Config as FoundationCloudformationPluginConfig} from '@code-like-a-carpenter/foundation-plugin-cloudformation';
import * as foundationCloudformationPlugin from '@code-like-a-carpenter/foundation-plugin-cloudformation';
import type {Config as FoundationTypescriptPluginConfig} from '@code-like-a-carpenter/foundation-plugin-typescript';
import * as foundationTypescriptPlugin from '@code-like-a-carpenter/foundation-plugin-typescript';

import type {TypescriptPluginConfig} from './config';
import {loadConfig} from './load-config';
import {loadSchema} from './schema';

export async function generateCode({config}: {config: string}) {
  const relativeRoot = path.dirname(path.resolve(process.cwd(), config));

  const {
    schema: schemaGlob,
    typescriptOutput,
    cloudformationTemplate,
    ...cfg
  } = await loadConfig(config);

  const schema = await loadSchema(relativeRoot, schemaGlob, [
    foundationCloudformationPlugin.addToSchema(),
    foundationTypescriptPlugin.addToSchema(),
  ]);

  const cwd = process.cwd();
  process.chdir(relativeRoot);
  await Promise.all([
    generateCloudformation(
      cfg,
      schema,
      path.resolve(relativeRoot, cloudformationTemplate)
    ),
    generateTypescript(
      cfg,
      cfg.typescriptConfig,
      schema,
      path.resolve(relativeRoot, typescriptOutput)
    ),
  ]);
  process.chdir(cwd);
}

async function generateCloudformation(
  config: FoundationCloudformationPluginConfig,
  schema: DocumentNode,
  filename: string
) {
  const result = await codegen({
    config: {},
    documents: [],
    filename,
    pluginMap: {
      foundationCloudformation: foundationCloudformationPlugin,
    },
    plugins: [{foundationCloudformation: config}],
    schema,
  });

  await mkdir(path.dirname(filename), {recursive: true});
  await writeFile(filename, result);
}

async function generateTypescript(
  config: FoundationTypescriptPluginConfig,
  typescriptConfig: TypescriptPluginConfig,
  schema: DocumentNode,
  filename: string
) {
  const result = await codegen({
    config: {},
    documents: [],
    filename,
    pluginMap: {
      foundationTypescript: foundationTypescriptPlugin,
      typescript: typescriptPlugin,
    },
    plugins: [
      {
        typescript: typescriptConfig,
      },
      {foundationTypescript: config},
    ],
    schema,
  });

  await mkdir(path.dirname(filename), {recursive: true});
  await writeFile(filename, result);
}
