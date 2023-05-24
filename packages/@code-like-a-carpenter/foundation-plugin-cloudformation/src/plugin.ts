import assert from 'assert';
import {readFile, mkdir, writeFile} from 'node:fs/promises';
import path from 'node:path';

import type {PluginFunction} from '@graphql-codegen/plugin-helpers';
import yml from 'js-yaml';
import {CLOUDFORMATION_SCHEMA} from 'js-yaml-cloudformation-schema';

import {parse} from '@code-like-a-carpenter/foundation-parser';
import {makePlugin} from '@code-like-a-carpenter/graphql-codegen-helpers';

import {defineEnricher, defineReactor, defineTableCdc} from './cdc';
import {defineReducer} from './cdc/reducer';
import type {Config} from './config';
import {ConfigSchema} from './config';
import {combineFragments} from './fragments/combine-fragments';
import {defineTable} from './table';
import {applyTransforms} from './transforms';
import type {ServerlessApplicationModel} from './types';

export {schema as addToSchema} from '@code-like-a-carpenter/foundation-intermediate-representation';

/**
 * Loads an existing consumer-generated CF template or returns a basic template
 */
async function getInitialTemplate({
  sourceTemplate,
}: Config): Promise<ServerlessApplicationModel> {
  if (sourceTemplate) {
    const raw = await readFile(sourceTemplate, 'utf8');
    try {
      return JSON.parse(raw);
    } catch {
      return yml.load(raw, {
        schema: CLOUDFORMATION_SCHEMA,
      }) as ServerlessApplicationModel;
    }
  }

  return {
    AWSTemplateFormatVersion: '2010-09-09',
    Resources: {},
    Transform: 'AWS::Serverless-2016-10-31',
  };
}

/** @override */
export const plugin: PluginFunction<Config> = makePlugin(
  ConfigSchema,
  async (schema, documents, config, info) => {
    const outputFile = info?.outputFile;
    assert(outputFile, 'outputFile is required');

    const ir = parse(schema, documents, config, info);
    const {models, tables} = ir;

    const stacks = new Map<string, ServerlessApplicationModel>();

    const allResources = combineFragments(
      ...tables.map((table) => {
        if (table.hasCdc) {
          const {fragment, stack} = defineTableCdc(table, config);
          stacks.set('dispatcher.yml', stack);
          return combineFragments(fragment, defineTable(table));
        }
        return defineTable(table);
      }),
      ...models.flatMap((model) =>
        model.changeDataCaptureConfig.map((cdc) => {
          const {type} = cdc;
          if (type === 'ENRICHER') {
            const {fragment, stack} = defineEnricher(config, model, cdc);
            stacks.set('cdc.yml', stack);
            return fragment;
          } else if (type === 'REACTOR') {
            const {fragment, stack} = defineReactor(config, model, cdc);
            stacks.set('cdc.yml', stack);
            return fragment;
          } else if (type === 'REDUCER') {
            const {fragment, stack} = defineReducer(config, model, cdc);
            stacks.set('cdc.yml', stack);
            return fragment;
          }
          throw new Error(`Unexpected CDC type ${type}`);
        })
      )
    );

    const initialTemplate = await getInitialTemplate(config);

    const tpl: ServerlessApplicationModel = combineFragments(
      initialTemplate,
      allResources,
      {
        Globals: {
          Function: {
            Handler: 'index.handler',
            MemorySize: 256,
            Runtime: 'nodejs18.x',
            Timeout: 30,
            Tracing: 'Active',
          },
        },
        Parameters: {
          StageName: {
            AllowedValues: ['development', 'production', 'test'],
            Default: 'development',
            Description: 'The name of the stage',
            Type: 'String',
          },
        },
        Resources: {},
        // Transform: 'AWS::LanguageExtensions',
      }
    );

    await applyTransforms(config, ir, tpl, stacks);

    const outDir = path.dirname(outputFile);
    for (const [filename, stack] of stacks) {
      await writeNestedTemplate(config, path.join(outDir, filename), stack);
    }

    return formatTemplate(config, tpl);
  }
);

function formatTemplate(config: Config, tpl: ServerlessApplicationModel) {
  const {format} = config.outputConfig;
  if (format === 'json') {
    return JSON.stringify(tpl, null, 2);
  }

  return yml.dump(tpl, config.outputConfig.yamlConfig);
}

async function writeNestedTemplate(
  config: Config,
  outputFile: string,
  tpl: ServerlessApplicationModel
) {
  await mkdir(path.dirname(outputFile), {recursive: true});
  await writeFile(outputFile, formatTemplate(config, tpl));
}
