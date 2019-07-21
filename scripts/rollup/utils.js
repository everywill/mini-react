'use strict';

const path = require('path');
const rimraf = require('rimraf');

function resolvePath(filepath) {
  if (filepath[0] === '~') {
    return path.join(process.env.HOME, filepath.slice(1));
  } else {
    return path.resolve(filepath);
  }
}

function asyncRimRaf(filepath) {
  return new Promise((resolve, reject) => {
    rimraf(filepath, error => {
      if (error) {
        reject(error);
        return;
      }
      resolve();
    })
  });
}

module.exports = {
  asyncRimRaf,
};
