/** @type {import('@code-like-a-carpenter/foundation-cli').InputConfig} */
const config = {
  dependenciesModuleId: '../dependencies',
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
  schema: './schema/**/*.graphqls',
  cloudformationTemplate: './__generated__/template.yml',
  typescriptOutput: './__generated__/graphql.ts',
  actionsModuleId: './__generated__/graphql',
  outputConfig: {format: 'yaml'},
};

module.exports = config;
