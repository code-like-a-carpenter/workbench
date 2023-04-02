import type {PluginFunction} from '@graphql-codegen/plugin-helpers';

export function makePlugin<T>(fn: PluginFunction<T>): PluginFunction<T> {
  return (schema, documents, config, info) => {
    try {
      return fn(schema, documents, config, info);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };
}
