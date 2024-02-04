import {register} from '@code-like-a-carpenter/workbench-config';

export const {load, schema} = register((s, z) =>
  s.extend({
    deps: z.object({
      awsSdkVersion: z.string().default('3.188.0'),
      definitelyTyped: z.array(z.string()).default([]),
      devPatterns: z.array(z.string()).default(['*.spec.[jt]sx?']),
      dryRun: z.boolean().default(false),
      ignoreDirs: z
        .array(z.string())
        .default(['.aws-sam', 'dist', 'node_modules', 'build', 'public/build']),
      packageName: z.string(),
    }),
  })
);
