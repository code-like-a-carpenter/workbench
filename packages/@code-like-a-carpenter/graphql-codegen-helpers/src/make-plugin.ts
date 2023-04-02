import type {PluginFunction} from '@graphql-codegen/plugin-helpers';
import type {z} from 'zod';

export function makePlugin<T extends z.ZodTypeAny>(
  Schema: T,
  fn: PluginFunction<z.infer<T>>
): PluginFunction<unknown> {
  return (schema, documents, config, info) => {
    try {
      return fn(schema, documents, Schema.parse(config), info);
    } catch (err) {
      console.error(err);
      throw err;
    }
  };
}
