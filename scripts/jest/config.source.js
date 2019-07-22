'use strict';

const baseConfig = require('./config.base');

module.exports = Object.assign({}, baseConfig, {
  setupFiles: [
    require.resolve('./setupHostConfig'),
  ],
});
