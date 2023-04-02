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
  dependenciesModuleId: z.string(),
  dispatcherDefaults: DispatcherConfigSchema.default({}),
  handlerDefaults: HandlerConfigSchema.default({}),
  lambdaDefaults: LambdaConfigSchema.default({}),
});

export type Config = z.infer<typeof ParserConfigSchema>;
export type InputConfig = z.input<typeof ParserConfigSchema>;
