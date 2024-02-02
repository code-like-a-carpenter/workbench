import type {Argv} from 'yargs';
import y from 'yargs';
import {hideBin} from 'yargs/helpers';

import {getConfig} from './config';
export type RegisterPluginFunction = (yargs: Argv) => void | Promise<void>;

export type {Config} from './config';
export {configSchema, getConfig} from './config';

export function definePlugin(
  fn: RegisterPluginFunction
): RegisterPluginFunction {
  return fn;
}

export async function main() {
  const cfg = await getConfig();

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
  try {
    const {default: plugin} = await import(pluginName);
    return plugin;
  } catch (err) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const {default: plugin} = require(pluginName);
    return plugin;
  }
}

export async function registerPlugin(yargs: Argv, fn: RegisterPluginFunction) {
  await fn(yargs);
}
