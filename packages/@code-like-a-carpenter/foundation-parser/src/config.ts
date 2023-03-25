import {z} from 'zod';

export const ParserConfigSchema = z.object({
  conditions: z.record(z.unknown()).default({
    IsProd: {
      'Fn::Equals': ['StageName', 'Production'],
    },
  }),
  tableDefaults: z
    .object({
      enableEncryption: z.union([z.boolean(), z.string()]).default('IsProd'),
      enablePointInTimeRecovery: z
        .union([z.boolean(), z.string()])
        .default('IsProd'),
    })
    .default({
      enableEncryption: 'IsProd',
      enablePointInTimeRecovery: 'IsProd',
    }),
});

export type Config = z.infer<typeof ParserConfigSchema>;
