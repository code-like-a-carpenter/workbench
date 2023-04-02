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
      schema: [`examples/${example}/schema/**/*.graphqls`],
    };
    return acc;
  }, init),
};

module.exports = config;
