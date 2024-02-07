import {register} from '@code-like-a-carpenter/workbench-config';

export const schema = register((s, z) =>
  s.extend({
    cliMain: z.boolean().default(false),
    commandLine: z.boolean().default(false),
    default: z.boolean().default(true),
    root: z.boolean().default(false),
  })
);
