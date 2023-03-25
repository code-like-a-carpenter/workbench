import type {PluginFunction} from '@graphql-codegen/plugin-helpers';
import yml from 'js-yaml';

import {parse} from '@code-like-a-carpenter/foundation-parser';
import {logGraphQLCodegenPluginErrors} from '@code-like-a-carpenter/graphql-codegen-helpers';

import type {Model as ServerlessApplicationModel} from './__generated__/serverless-application-model';
import {combineFragments} from './combine-fragments';
import type {Config} from './config';
import {CloudFormationPluginConfigSchema} from './config';
import {defineTable} from './table';

export const plugin: PluginFunction<Config> = logGraphQLCodegenPluginErrors(
  (schema, documents, config, info) => {
    const configWithDefaults = CloudFormationPluginConfigSchema.parse(config);
    const {tables} = parse(schema, documents, configWithDefaults, info);

    const tpl: ServerlessApplicationModel = combineFragments(
      {
        Conditions: {},
        Globals: {},
        Outputs: {},
        Parameters: {},
        Resources: {},
      },
      combineFragments(
        ...tables.map((table) => defineTable(configWithDefaults, table))
      )
    );

    return yml.dump(tpl, configWithDefaults.outputConfig.yamlConfig);
  }
);
