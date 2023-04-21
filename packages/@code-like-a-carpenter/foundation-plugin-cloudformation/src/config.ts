import {z} from 'zod';

import {ParserConfigSchema} from '@code-like-a-carpenter/foundation-parser';

const BuildPropertiesSchema = z.object({
  external: z.array(z.string()).default(['@aws-sdk/*']),
  minify: z.boolean().default(false),
  sourcemap: z.boolean().default(true),
  target: z.string().default('es2022'),
});

const DumpOptions = z.object({
  condenseFlow: z.boolean().optional(),
  flowLevel: z.number().optional(),
  forceQuotes: z.boolean().default(true),
  indent: z.number().optional(),
  lineWidth: z.number().optional(),
  noArrayIndent: z.boolean().optional(),
  noCompatMode: z.boolean().optional(),
  noRefs: z.boolean().default(true),
  quotingType: z.enum([`'`, `"`]).default(`'`),
  skipInvalid: z.boolean().optional(),
  sortKeys: z.boolean().default(true),
});

export const ConfigSchema = ParserConfigSchema.extend({
  actionsModuleId: z.string(),
  buildProperties: BuildPropertiesSchema.default({}),
  cloudformationTransforms: z
    .array(z.string())
    .default([
      '@code-like-a-carpenter/foundation-transform-environment',
      '@code-like-a-carpenter/foundation-transform-table-names',
    ]),
  outputConfig: z
    .object({
      format: z.enum(['json', 'yaml']).default('json'),
      yamlConfig: DumpOptions.default({}),
    })
    .default({}),
  sourceTemplate: z.string().optional(),
});

export type Config = z.infer<typeof ConfigSchema>;
export type InputConfig = z.input<typeof ConfigSchema>;
