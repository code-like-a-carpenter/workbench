'use strict';

const {sync: glob} = require('glob');

const examples = glob('*/', {cwd: 'examples'}).map((pathName) =>
  pathName.replace(/\/$/, '')
);

const parserConfig = {
  dependenciesModuleId: './examples/shared-dependencies',
};

const typescriptConfig = {
  declarationKind: 'interface',
  enumsAsTypes: true,
  scalars: {
    Date: 'Date',
    JSONObject: 'Record<string, unknown>',
  },
  strictScalars: true,
};

/** @type {Record<string, import("graphql-config").IGraphQLProject>} */
const init = {};

/** @type {import("graphql-config").IGraphQLConfig } */
const config = {
  projects: examples.reduce((acc, example) => {
    acc[example] = {
      extensions: {
        codegen: {
          generates: {
            [`examples/${example}/__generated__/graphql.ts`]: {
              config: {
                ...parserConfig,
                ...typescriptConfig,
              },
              plugins: [
                'typescript',
                '@code-like-a-carpenter/foundation-plugin-typescript',
              ],
            },
            [`examples/${example}/__generated__/template.yml`]: {
              config: {
                ...parserConfig,
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
