import {z} from 'zod';

import {ParserConfigSchema} from '@code-like-a-carpenter/foundation-parser';

export const TypescriptPluginConfigSchema = ParserConfigSchema.extend({
  legacyEmptySortFieldBehavior: z.boolean().default(false),
});

export type Config = z.infer<typeof TypescriptPluginConfigSchema>;
