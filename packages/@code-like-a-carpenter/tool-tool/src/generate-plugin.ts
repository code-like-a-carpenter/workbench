import path from 'node:path';

import camelCase from 'lodash.camelcase';
import kebabCase from 'lodash.kebabcase';

import {assert} from '@code-like-a-carpenter/assert';
import {writePrettierFile} from '@code-like-a-carpenter/tooling-common';

import type {ToolMetadata} from './metadata.ts';

export async function generatePluginFile({
  generatedDir,
  metadata,
}: ToolMetadata) {
  const pluginPath = path.join(generatedDir, 'plugin.ts');

  // @ts-ignore
  await writePrettierFile(
    pluginPath,
    `
import {definePlugin} from '@code-like-a-carpenter/cli-core';

${metadata
  .map(
    (m) =>
      `import {handler as ${camelCase(m.toolName)}Handler} from '../${m.toolName}';`
  )
  .join('\n')}


export const plugin = definePlugin((yargs) => {
${metadata
  .map((m) => {
    assert(typeof m.schema === 'object', 'schema must be an object');
    assert(m.schema !== null, 'schema must not be null');

    if ('properties' in m.schema) {
      const options = propsToOptions(m.schema);
      if (options.length) {
        return `yargs.command('${m.commandName}', '${m.description}', (y) => y${options.join('\n')}, async (args) => {await ${camelCase(m.toolName)}Handler(args)})`;
      }
    } else if ('oneOf' in m.schema) {
      assert(Array.isArray(m.schema.oneOf), 'oneOf must be an array');
      const conflictLists = m.schema.oneOf.map((subschema) => {
        assert(
          'properties' in subschema,
          'properties must be in schema. anyOf, oneOf, and allOf are too complex to support at this time'
        );
        assert(
          typeof subschema.properties === 'object',
          'properties must be an object'
        );
        assert(subschema.properties !== null, 'properties must not be null');
        return Object.keys(subschema.properties);
      });

      const options = m.schema.oneOf
        .map((subschema, index) =>
          propsToOptions(
            subschema,
            conflictLists.filter((list, i) => i !== index).flat()
          )
        )
        .flat();

      return `yargs.command('${m.commandName}', '${m.description}', (y) => y${options.join('\n')}, async (args) => {await ${camelCase(m.toolName)}Handler(args)})`;
    } else if ('anyOf' in m.schema) {
      assert(Array.isArray(m.schema.anyOf), 'anyOf must be an array');

      const options = m.schema.anyOf
        .map((subschema) => propsToOptions(subschema))
        .flat();

      return `yargs.command('${m.commandName}', '${m.description}', (y) => y${options}, async (args) => {await ${camelCase(m.toolName)}Handler(args)})`;
    } else if ('allOf' in m.schema) {
      assert(Array.isArray(m.schema.allOf), 'allOf must be an array');

      const options = m.schema.allOf
        .map((subschema) => propsToOptions(subschema))
        .flat();

      return `yargs.command('${m.commandName}', '${m.description}', (y) => y${options}, async (args) => {await ${camelCase(m.toolName)}Handler(args)})`;
    }

    return `yargs.command('${m.commandName}', '${m.description}', async (args) => {await ${camelCase(m.toolName)}Handler(args)})`;
  })
  .join('\n')}
});

  `
  );
}

interface OptionTemplateOptions {
  conflicts?: readonly string[];
  defaultValue?: unknown;
  propName: string;
  required: readonly string[];
  type: string;
}

function optionTemplate({
  conflicts = [],
  defaultValue,
  propName,
  required,
  type,
}: OptionTemplateOptions) {
  return `.option('${kebabCase(propName)}', {
    conflicts: [${conflicts.map((c) => `'${c}'`).join(',')}],${
      typeof defaultValue !== 'undefined'
        ? `default: ${JSON.stringify(defaultValue)},`
        : ''
    }
    demandOption: ${required.includes(propName)},
    type: '${type}'
  })`;
}

function propsToOptions(subschema: object, conflicts?: readonly string[]) {
  assert('properties' in subschema, 'properties must be in schema');
  assert(
    typeof subschema.properties === 'object',
    'properties must be an object'
  );
  assert(subschema.properties !== null, 'properties must not be null');

  const required =
    'required' in subschema && Array.isArray(subschema.required)
      ? subschema.required
      : [];

  const entries = Object.entries(subschema.properties);
  if (entries.length) {
    return entries.map(([propName, {default: defaultValue, type}]) =>
      optionTemplate({
        conflicts,
        defaultValue,
        propName,
        required: conflicts ? [] : required,
        type,
      })
    );
  }
  return [];
}
