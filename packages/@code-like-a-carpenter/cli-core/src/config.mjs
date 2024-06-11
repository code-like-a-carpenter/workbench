import {z} from 'zod';

import {register} from '@code-like-a-carpenter/workbench-config';

export const {schema, load} = register((s) =>
  s.extend({plugins: z.array(z.string()).default([])})
);
