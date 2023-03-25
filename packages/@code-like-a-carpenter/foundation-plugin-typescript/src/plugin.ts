import type {PluginFunction} from '@graphql-codegen/plugin-helpers';

import {parse} from '@code-like-a-carpenter/foundation-parser';
import {logGraphQLCodegenPluginErrors} from '@code-like-a-carpenter/graphql-codegen-helpers';

import type {Config} from './config';
import {TypescriptPluginConfigSchema} from './config';
import {createItemTpl} from './templates/create-item';

export const plugin: PluginFunction<Config> = logGraphQLCodegenPluginErrors(
  (schema, documents, config, info) => {
    const configWithDefaults = TypescriptPluginConfigSchema.parse(config);
    const {models} = parse(schema, documents, configWithDefaults, info);

    return models.map((model) => createItemTpl(config, model)).join('\n');
  }
);
