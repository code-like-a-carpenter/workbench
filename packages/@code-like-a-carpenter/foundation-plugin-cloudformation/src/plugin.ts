import assert from 'assert';
import fs, {readFileSync} from 'fs';
import path from 'path';

import type {
  AddToSchemaResult,
  PluginFunction,
} from '@graphql-codegen/plugin-helpers';
import yml from 'js-yaml';
import {CLOUDFORMATION_SCHEMA} from 'js-yaml-cloudformation-schema';

import {parse} from '@code-like-a-carpenter/foundation-parser';
import {makePlugin} from '@code-like-a-carpenter/graphql-codegen-helpers';

import {defineTableCdc, defineModelEnricher, defineTriggerCdc} from './cdc';
import type {Config} from './config';
import {ConfigSchema} from './config';
import {combineFragments} from './fragments/combine-fragments';
import {filterNull} from './helpers';
import {defineTable} from './table';
import type {ServerlessApplicationModel} from './types';

/** @override */
export function addToSchema(): AddToSchemaResult {
  return readFileSync(
    path.resolve(__dirname, '../../../../../schema.graphqls'),
    'utf8'
  );
}

/**
 * Loads an existing consumer-generated CF template or returns a basic template
 */
function getInitialTemplate({
  sourceTemplate,
}: Config): ServerlessApplicationModel {
  if (sourceTemplate) {
    const raw = fs.readFileSync(sourceTemplate, 'utf8');
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
  (schema, documents, config, info) => {
    const outputFile = info?.outputFile;
    assert(outputFile, 'outputFile is required');

    const {models, tables} = parse(schema, documents, config, info);

    const allResources = combineFragments(
      ...tables.map((table) =>
        combineFragments(defineTableCdc(table, config), defineTable(table))
      ),
      ...models.flatMap((model) =>
        model.changeDataCaptureConfig
          .map((cdcConfig) =>
            cdcConfig.type === 'ENRICHER'
              ? defineModelEnricher(config, model, cdcConfig)
              : null
          )
          .filter(filterNull)
      ),
      ...models.flatMap((model) =>
        model.changeDataCaptureConfig
          .map((cdcConfig) =>
            cdcConfig.type === 'TRIGGER'
              ? defineTriggerCdc(config, model, cdcConfig)
              : null
          )
          .filter(filterNull)
      )
    );

    const initialTemplate = getInitialTemplate(config);

    const tpl = {
      ...initialTemplate,

      Conditions: {
        ...initialTemplate.Conditions,
        ...allResources.Conditions,
      },
      Globals: {
        Function: {
          Handler: 'index.handler',
          MemorySize: 256,
          Runtime: 'nodejs18.x',
          Timeout: 30,
          Tracing: 'Active',
          ...initialTemplate?.Globals?.Function,
          Environment: {
            // @ts-expect-error - typedef treats `Environment` as `unknown`
            ...initialTemplate?.Globals?.Function?.Environment,
            Variables: {
              // @ts-expect-error - typedef treats `Environment` as `unknown`
              ...initialTemplate?.Globals?.Function?.Environment?.Variables,
              // @ts-expect-error - typedef treats `Environment` as `unknown`
              ...allResources?.Globals?.Function?.Environment?.Variables,
            },
          },
        },
      },
      Outputs: {
        ...initialTemplate.Outputs,
        ...allResources.Outputs,
      },
      Parameters: {
        ...initialTemplate.Parameters,
        ...allResources.Parameters,
        StageName: {
          AllowedValues: ['development', 'production', 'test'],
          Default: 'development',
          Description: 'The name of the stage',
          Type: 'String',
        },
      },
      Resources: {
        ...initialTemplate.Resources,
        ...allResources.Resources,
      },
    };

    const {format} = config.outputConfig;
    if (format === 'json') {
      return JSON.stringify(tpl, null, 2);
    }

    return yml.dump(tpl, config.outputConfig.yamlConfig);
  }
);
