import type {PluginFunction} from '@graphql-codegen/plugin-helpers';
import yml from 'js-yaml';

import {parse} from '@code-like-a-carpenter/foundation-parser';
import {logGraphQLCodegenPluginErrors} from '@code-like-a-carpenter/graphql-codegen-helpers';

import type {Model as ServerlessApplicationModel} from './__generated__/serverless-application-model';
import {defineEnricher} from './cdc/fragments/enricher';
import {defineReactor} from './cdc/fragments/reactor';
import {combineFragments} from './combine-fragments';
import type {Config} from './config';
import {CloudFormationPluginConfigSchema} from './config';
import {defineTable} from './table';

export const plugin: PluginFunction<Config> = logGraphQLCodegenPluginErrors(
  (schema, documents, config, info) => {
    const configWithDefaults = CloudFormationPluginConfigSchema.parse(config);
    const {models, tables} = parse(schema, documents, configWithDefaults, info);

    const tpl: ServerlessApplicationModel = combineFragments(
      {
        Conditions: {},
        Globals: {},
        Outputs: {},
        Parameters: {},
        Resources: {},
      },
      combineFragments(
        ...tables.map((table) => defineTable(configWithDefaults, table)),
        ...models.flatMap((model) =>
          model.changeDataCaptureConfig.map((cdc) => {
            const {type} = cdc;
            switch (type) {
              case 'ENRICHER':
                return defineEnricher(configWithDefaults, model, cdc);
              case 'REACTOR':
                return defineReactor(configWithDefaults, model, cdc);
              default:
                throw new Error(`Unexpected CDC type ${type}`);
            }
          })
        )
      )
    );

    return yml.dump(tpl, configWithDefaults.outputConfig.yamlConfig);
  }
);
