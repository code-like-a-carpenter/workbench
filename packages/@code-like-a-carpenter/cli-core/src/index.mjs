import y from 'yargs';
import {hideBin} from 'yargs/helpers';

/** @typedef {import('yargs').Argv} Argv */
/** @typedef {import('./types.mjs').Config} Config */

import {load as loadConfig} from './config.mjs';

/**
 * @callback RegisterPluginFunction
 * @param {Argv} yargs
 * @returns {void | Promise<void>}
 */

/**
 * @param {RegisterPluginFunction} fn
 * @returns {RegisterPluginFunction}
 */
export function definePlugin(fn) {
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

/**
 * @param {string} pluginName
 * @returns {Promise<*>}
 */
async function load(pluginName) {
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

/**
 * @param {Argv} yargs
 * @param {RegisterPluginFunction} fn
 * @returns {Promise<void>}
 */
export async function registerPlugin(yargs, fn) {
  await fn(yargs);
}
