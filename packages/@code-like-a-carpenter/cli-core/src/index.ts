import type {Argv} from 'yargs';
import y from 'yargs';
import {hideBin} from 'yargs/helpers';

import {load as loadConfig} from './config.ts';

export type RegisterPluginFunction = (yargs: Argv) => void | Promise<void>;

export type {Config} from './config.ts';

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
  // This is a little goofy, but given the garbage state of js tooling, we may
  // end up with multiple runtime wrappers and, therefore, mutiple layers of
  // default exports. This code will walk down the chain of default exports
  // until it finds the actual plugin.
  const mod = await import(pluginName);
  let d = mod;
  while ('default' in d) {
    d = d.default;
  }

  return d;
}

export async function registerPlugin(yargs: Argv, fn: RegisterPluginFunction) {
  await fn(yargs);
}
