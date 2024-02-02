import {realpath} from 'node:fs/promises';
import * as path from 'path';

import {cosmiconfig} from 'cosmiconfig';
import {z} from 'zod';

export const configSchema = z.object({
  plugins: z.array(z.string()).default([]),
});

export type Config = z.infer<typeof configSchema>;

export async function getConfig(): Promise<Config> {
  let [, searchFrom] = process.argv;

  while (searchFrom !== '/') {
    searchFrom = path.dirname(await realpath(searchFrom));
    const result = await cosmiconfig('code-like-a-carpenter').search(
      searchFrom
    );
    if (result) {
      return configSchema.parse(result.config);
    }
  }

  return configSchema.parse({});
}
