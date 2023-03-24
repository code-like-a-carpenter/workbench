import type {PluginFunction} from '@graphql-codegen/plugin-helpers';
import yml from 'js-yaml';

import {applyDefaults, parse} from '@code-like-a-carpenter/foundation-parser';

import type {Model as ServerlessApplicationModel} from './__generated__/serverless-application-model';
import {combineFragments} from './combine-fragments';
import type {Config} from './config';
import {defineTable} from './table';

export const plugin: PluginFunction<Config> = logGraphQLCodegenPluginErrors(
  (schema, documents, config, info) => {
    const configWithDefaults = applyDefaults(config);
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

    return yml.dump(tpl, {
      noRefs: true,
      sortKeys: true,
      ...configWithDefaults.outputConfig?.yamlConfig,
    });
  }
);

/**
 * graphql-codegen suppresses most useful error output when something goes
 * wrong. This makes sure it gets logged to stderr before it gets swallowed.
 */
function logGraphQLCodegenPluginErrors<T extends unknown[], R>(
  fn: (...args: T) => R
): (...args: T) => R {
  return (...args) => {
    try {
      return fn(...args);
    } catch (error) {
      console.error(error);
      throw error;
    }
  };
}
