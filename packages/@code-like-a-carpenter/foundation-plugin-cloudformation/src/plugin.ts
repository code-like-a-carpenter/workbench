import type {PluginFunction} from '@graphql-codegen/plugin-helpers';

import type {Config} from './config';

export const plugin: PluginFunction<Config> = (
  schema,
  documents,
  config,
  info
) => {
  return '';
};
