'use strict';

module.exports = {
  transform: {
    '.*': require.resolve('./preprocessor.js'),
  },
  rootDir: process.cwd(),
  roots: ['<rootDir>/packages', '<rootDir>/scripts'],
};
