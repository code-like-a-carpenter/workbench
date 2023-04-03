'use strict';

const {sync: glob} = require('glob');

const examples = glob('*/', {cwd: 'examples'}).map((pathName) =>
  pathName.replace(/\/$/, '')
);

/** @type {Record<string, import("graphql-config").IGraphQLProject>} */
const init = {};

const graphqlCodegenTypeScriptPluginConfig = {
  enumsAsTypes: true,
  scalars: {
    Date: 'Date',
    JSONObject: 'Record<string, unknown>',
  },
  strictScalars: true,
};

/** @type {import("@code-like-a-carpenter/foundation-parser").InputConfig} */
const foundationPluginsConfig = {
  actionsModuleId: 'PLACEHOLDER',
  dependenciesModuleId: './examples/dependencies',
  // Note that there's shared state between the CloudFormation and TypeScript
  // plugins, so config that's read be the parser needs to be the same.
  dispatcherDefaults: {
    memorySize: 384,
    timeout: 60,
  },
  handlerDefaults: {
    memorySize: 256,
    timeout: 90,
  },
};

/** @type {import("@code-like-a-carpenter/foundation-plugin-cloudformation").InputConfig} */
const foundationPluginCloudformationConfig = {
  ...foundationPluginsConfig,
  actionsModuleId: 'PLACEHOLDER',
  outputConfig: {
    format: 'yaml',
    yamlConfig: {
      // This is turned off to minimize a diff while working on a migration. If
      // you're seeing it, it's because I forgot to turn it back on. You
      // probably don't want to turn this off.
      forceQuotes: false,
    },
  },
};

/** @type {import("@code-like-a-carpenter/foundation-plugin-typescript").InputConfig} */
const foundationPluginTypescriptConfig = {
  ...foundationPluginsConfig,
};

/** @type {import("graphql-config").IGraphQLConfig } */
const config = {
  projects: examples.reduce((acc, example) => {
    acc[example] = {
      extensions: {
        codegen: {
          generates: {
            [`examples/${example}/__generated__/graphql.ts`]: {
              config: {
                ...graphqlCodegenTypeScriptPluginConfig,
                ...foundationPluginTypescriptConfig,
                actionsModuleId: `./examples/${example}/__generated__/graphql`,
              },
              plugins: [
                'typescript',
                '@code-like-a-carpenter/foundation-plugin-typescript',
              ],
            },
            [`examples/${example}/__generated__/template.yml`]: {
              config: {
                ...foundationPluginCloudformationConfig,
                actionsModuleId: `./examples/${example}/__generated__/graphql`,
              },
              plugins: [
                '@code-like-a-carpenter/foundation-plugin-cloudformation',
              ],
            },
          },
          hooks: {
            afterAllFileWrite: [`./scripts/after-codegen ${example}`],
          },
        },
      },
      schema: [
        `examples/${example}/schema/**/*.graphqls`,
        // This line loads types necessary for the collective schema to be valid.
        'examples/common.graphqls',
        // This line is temporary and should be removed once the schema is
        // supplied via addToSchema
        'schema.graphqls',
      ],
    };
    return acc;
  }, init),
};

module.exports = config;
