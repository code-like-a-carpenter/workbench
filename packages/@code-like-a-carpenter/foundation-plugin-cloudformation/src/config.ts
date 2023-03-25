import {z} from 'zod';

import {ParserConfigSchema} from '@code-like-a-carpenter/foundation-parser';

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

export const CloudFormationPluginConfigSchema = ParserConfigSchema.extend({
  outputConfig: z
    .object({
      format: z.enum(['json', 'yaml']).default('yaml'),
      yamlConfig: DumpOptions,
    })
    .default({format: 'yaml', yamlConfig: DumpOptions.parse({})}),
});

export type Config = z.infer<typeof CloudFormationPluginConfigSchema>;
