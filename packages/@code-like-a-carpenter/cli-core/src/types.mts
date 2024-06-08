import type {z} from 'zod';

import type {schema} from './config.mjs';

export type Config = z.infer<typeof schema>;
