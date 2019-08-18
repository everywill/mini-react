'use strict';

const babelOptions = {
  plugins: [
    require.resolve('babel-plugin-transform-es2015-modules-commonjs'),
    require.resolve('babel-plugin-transform-react-jsx-source'),
  ],
  retainLines: true,
};

module.exports = {
  process(src, filePath) {},
  getCacheKey() {},
};
