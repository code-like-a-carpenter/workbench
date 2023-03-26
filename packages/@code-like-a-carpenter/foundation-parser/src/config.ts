import {z} from 'zod';

export const LambdaConfigSchema = z.object({
  memorySize: z.number().default(256),
  timeout: z.number().default(30),
});

export const DispatcherConfigSchema = LambdaConfigSchema.extend({
  batchSize: z.number().default(10),
  maximumRetryAttempts: z.number().default(3),
});

export const HandlerConfigSchema = LambdaConfigSchema.extend({});

export const ParserConfigSchema = z.object({
  actionsModuleId: z
    .string()
    .describe(
      'Relative path to the output location of the foundation typescript plugin from the graphql config file.'
    ),
  conditions: z.record(z.unknown()).default({
    IsProd: {
      'Fn::Equals': ['StageName', 'Production'],
    },
  }),
  dependenciesModuleId: z
    .string()
    .describe('Relative path to dependencies from the graphql config file.'),
  dispatcherDefaults: DispatcherConfigSchema.default(
    DispatcherConfigSchema.parse({})
  ),
  handlerDefaults: HandlerConfigSchema.default(HandlerConfigSchema.parse({})),
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
