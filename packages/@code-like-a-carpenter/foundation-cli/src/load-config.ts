import path from 'node:path';

import type {Config} from './config';
import {ConfigSchema} from './config';

export async function loadConfig(pathToConfig: string): Promise<Config> {
  const raw = await import(path.resolve(process.cwd(), pathToConfig));

  return ConfigSchema.parse('default' in raw ? raw.default : raw);
}
