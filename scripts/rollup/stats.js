'use strict';

const Table = require('cli-table');
const filesize = require('filesize');
const chalk = require('chalk');
const fs = require('fs');
const mkdirp = require('mkdirp');
const join = require('path').join;

const BUNDLE_SIZES_FILE_NAME = join(__dirname, '../../build/bundle-sizes.json');
const prevBuildResults = fs.existsSync(BUNDLE_SIZES_FILE_NAME)
  ? require(BUNDLE_SIZES_FILE_NAME)
  : { bundleSizes: [] };

const currentBuildResults = {
  bundleSizes: [],
};

function saveResults() {
  fs.writeFileSync(
    BUNDLE_SIZES_FILE_NAME,
    JSON.stringify(currentBuildResults, null, 2)
  );
}

const resultsHeaders = [
  'Bundle',
  'Prev Size',
  'Current Size',
  'Diff',
  'Prev Gzip',
  'Current Gzip',
  'Diff',
];

function fractionalChange(prev, current) {
  return (current - prev) / prev;
}

function generateResultsArray(current, prevResults) {
  return current.bundleSizes
    .map(result => {
      const prev = prevResults.bundleSizes.filter(
        res =>
          res.filename === result.filename &&
          res.bundleType === result.bundleType
      )[0];

      const size = result.size;
      const gzip = result.gzip;
      let prevSize = prev ? prev.size : 0;
      let prevGzip = prev ? prev.gzip : 0;

      return {
        filename: result.filename,
        bundleType: result.bundleType,
        prevSize: filesize(prevSize),
        currentSize: filesize(size),
        fileSizeChange: fractionalChange(prevSize, size),
        prevGzip: filesize(prevGzip),
        currentGzip: filesize(gzip),
        gzipSizeChange: fractionalChange(prevGzip, gzip),
      };
    })
    .filter(f => f);
}

function percentChangeString(change) {
  if (!isFinite(change)) {
    return 'n/a';
  }
  const formatted = (change * 100).toFixed(1);
  if (/^-|^0(?:\.0+)$/.test(formatted)) {
    return `${formatted}%`;
  } else {
    return `+${formatted}%`;
  }
}

function printResults() {
  const table = new Table({
    head: resultsHeaders.map(label => chalk.gray.yellow(label)),
  });

  const results = generateResultsArray(currentBuildResults, prevBuildResults);
  results.forEach(result => {
    table.push([
      chalk.white.bold(`${result.filename} (${result.bundleType})`),
      chalk.gray.bold(result.prevSize),
      chalk.white.bold(result.currentSize),
      percentChangeString(result.fileSizeChange),
      chalk.gray.bold(result.prevGzip),
      chalk.white.bold(result.currentGzip),
      percentChangeString(result.gzipSizeChange),
    ]);
  });

  return table.toString();
}

module.exports = {
  saveResults,
  printResults,
};
