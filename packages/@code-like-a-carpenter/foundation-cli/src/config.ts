import {z} from 'zod';

import {ConfigSchema as FoundationCloudformationPluginConfigSchema} from '@code-like-a-carpenter/foundation-plugin-cloudformation';
import {ConfigSchema as FoundationTypescriptPluginConfigSchema} from '@code-like-a-carpenter/foundation-plugin-typescript';

export const TypescriptPluginConfigSchema = z.any().default({
  enumsAsTypes: true,
  scalars: {
    Date: 'Date',
    JSONObject: 'Record<string, unknown>',
  },
  strictScalars: true,
});

export type TypescriptPluginConfig = z.infer<
  typeof TypescriptPluginConfigSchema
>;
export type TypescriptPluginInputConfig = z.input<
  typeof TypescriptPluginConfigSchema
>;

export const ConfigSchema = z
  .object({
    cloudformationTemplate: z.string(),
    schema: z.union([z.string(), z.array(z.string())]),
    typescriptConfig: TypescriptPluginConfigSchema,
    typescriptOutput: z.string(),
  })
  .merge(FoundationCloudformationPluginConfigSchema)
  .merge(FoundationTypescriptPluginConfigSchema);

export type Config = z.infer<typeof ConfigSchema>;
export type InputConfig = z.input<typeof ConfigSchema>;
