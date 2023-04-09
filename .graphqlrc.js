'use strict';

const {sync: glob} = require('glob');

const examples = glob('*/', {cwd: 'examples'}).map((pathName) =>
  pathName.replace(/\/$/, '')
);

/** @type {Record<string, import("graphql-config").IGraphQLProject>} */
const init = {};

/** @type {import("graphql-config").IGraphQLConfig } */
const config = {
  projects: examples.reduce((acc, example) => {
    acc[example] = {
      schema: [
        `examples/${example}/schema/**/*.graphqls`,
        // This line loads types necessary for the collective schema to be valid.
        'examples/common.graphqls',
        // I haven't come up with a better way to get the core schema other than
        // specifying it directly out of node_modules
        'node_modules/@code-like-a-carpenter/foundation-intermediate-representation/schema.graphqls',
      ],
    };
    return acc;
  }, init),
};

module.exports = config;
