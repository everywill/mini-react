'use strict';

const runESLint = require('../eslint');

console.log('Linting all files...');
// https://circleci.com/docs/2.0/env-vars/#circleci-environment-variable-descriptions
if (!process.env.CI) {
  console.log('Hint: run `yarn linc` to only lint changed files.');
}

if (runESLint({onlyChanged: false})) {
  console.log('Lint passed.');
} else {
  console.log('Lint failed.');
  process.exit(1);
}
