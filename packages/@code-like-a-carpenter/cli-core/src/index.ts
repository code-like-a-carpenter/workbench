import type {Argv} from 'yargs';
import y from 'yargs';
import {hideBin} from 'yargs/helpers';

import {load as loadConfig} from './config';

export type RegisterPluginFunction = (yargs: Argv) => void | Promise<void>;

export type {Config} from './config';

export function definePlugin(
  fn: RegisterPluginFunction
): RegisterPluginFunction {
  return fn;
}

export async function main() {
  const cfg = await loadConfig();

  const yargs = y(hideBin(process.argv));

  await Promise.all(
    cfg.plugins.map(async (pluginName) => {
      const plugin = await load(pluginName);
      await registerPlugin(yargs, plugin);
    })
  );

  yargs.demandCommand().help().argv;
}

async function load(pluginName: string) {
  const mod = await import(pluginName);
  if (mod.default) {
    return mod.default;
  }

  return mod;
}

export async function registerPlugin(yargs: Argv, fn: RegisterPluginFunction) {
  await fn(yargs);
}