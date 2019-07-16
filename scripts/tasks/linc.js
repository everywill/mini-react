'use strict';

const runESLint = require('../eslint');

console.log('Linting changed files...');

if (runESLint({onlyChanged: true})) {
  console.log('Lint passed for changed files.');
} else {
  console.log('Lint failed for changed files.');
  process.exit(1);
}
