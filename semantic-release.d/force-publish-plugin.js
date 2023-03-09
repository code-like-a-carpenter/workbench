'use strict';

exports.analyzeCommits = (pluginConfig, context) => {
  if (context.commits[0].message === 'chore: patch-release') {
    return 'patch';
  }
};
