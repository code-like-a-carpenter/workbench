'use strict';

const assert = require('node:assert');
// @ts-expect-error
module.exports = function (api) {
  api.cache(true);

  const config = {
    comments: true,
    overrides: [
      {
        presets: [
          '@babel/preset-typescript',
          [
            '@babel/preset-env',
            {
              loose: false,
              targets: {node: true},
            },
          ],
        ],
      },
    ],
    sourceMaps: process.env.IDEA ? 'inline' : true,
  };

  assert.equal(
    process.env.NODE_ENV,
    'test',
    'Babel should _only_ be used for jest. Please us esbuild for everything else.'
  );

  return config;
};
