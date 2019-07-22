'use strict';

function getBundleOutputPaths() {
  return [
    `build/node_modules/mini-react/umd/index.js`,
    `build/dist/mini-react.min.js`,
  ];
}

module.exports = {
  getBundleOutputPaths,
};
