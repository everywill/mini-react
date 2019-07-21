'use strict';

const gzip = require('gzip-size');

module.exports = function sizes(options) {
  return {
    name: 'scripts/rollup/plugins/sizes-plugin',
    ongenerate(outputOptions, bundle) {
      Object.keys(bundle).forEach(fileName => {
        const code = bundle[fileName].code;
        const size = Buffer.byteLength(code);
        const gzipSize = gzip.sync(code);

        options.getSize(size, gzipSize);
      })
    },
  };
};
