'use strict';

exports.analyzeCommits = (pluginConfig, context) => {
  console.info('checking for patch-release commit message');
  console.info(require(`util`).inspect({context}, {depth: null}));
  if (context.commits.any(({message}) => message === 'chore: patch-release')) {
    console.info('patch-release commit message found');
    return 'patch';
  }
  console.info('no patch-release commit message found');
};
