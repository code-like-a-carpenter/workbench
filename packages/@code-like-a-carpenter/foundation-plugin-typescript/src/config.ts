import {z} from 'zod';

import {ParserConfigSchema} from '@code-like-a-carpenter/foundation-parser';

export const ConfigSchema = ParserConfigSchema.extend({
  /**
   * When true, reads and writes `skFields: []` as `${skPrefix}#0` instead of
   * `${skPrefix}`. This is a workaround for behavior in a piece of internal
   * tooling and should never be used otherwise,
   */
  legacyEmptySortFieldBehavior: z.boolean().default(false),
});

export type Config = z.infer<typeof ConfigSchema>;
export type InputConfig = z.input<typeof ConfigSchema>;
