'use strict';

module.exports = {
  plugins: [
    '@semantic-release/commit-analyzer',
    './semantic-release.d/force-publish-plugin.js',
    '@semantic-release/release-notes-generator',
    '@semantic-release/npm',
    '@semantic-release/github',
  ],
};
