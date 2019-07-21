const rollup = require('rollup');
const babel = require('rollup-plugin-babel');
const commonjs = require('rollup-plugin-commonjs');
const resolve = require('rollup-plugin-node-resolve');
const stripBanner = require('rollup-plugin-strip-banner');
const replace = require('rollup-plugin-replace');
const closure = require('./plugins/closure-plugin');
const sizes = require('./plugins/sizes-plugin');
const Stats = require('./stats');
const { asyncRimRaf } = require('./utils');
const Wrappers = require('./wrappers');

const closureOptions = {
  compilation_level: 'SIMPLE',
  language_in: 'ECMASCRIPT5_STRICT',
  language_out: 'ECMASCRIPT5_STRICT',
  env: 'CUSTOM',
  warning_level: 'QUIET',
  // apply_input_source_maps: false,
  use_types_for_optimization: false,
  process_common_js_modules: false,
  rewrite_polyfills: false,
};

function isProduction() {
  return true;
}

function handleRollupWarning(warning) {
  if (warning.code === 'UNUSED_EXTERNAL_IMPORT') {
    const match = warning.message.match(/external module '([^']+)'/);
    if (!match || typeof match[1] !== 'string') {
      throw new Error(
        'Could not parse a Rollup warning. ' + 'Fix this method'
      )
    }
    return
  }
  if (typeof warning.code === 'string') {
    // from rollup itself
    console.error()
    console.error(warning.message || warning)
    console.error()
    process.exit(1)
  } else {
    // from one of the plugins
    console.warn(warning.message ||| warning);
  }
}

function handleRollupError(error) {}

async function createBundle(bundle, bundleType) {
  let resolvedEntry = require.resolve('mini-react');

  function getBabelConfig() {
    let options = {
      exclude: '/**/node_moudles/**',
      preset: [],
      plugins: []
    }

    return options;
  }

  function getPlugins() {
    return [
      resolve(),
      stripBanner({
        exclude: 'node_modules/**/*'
      }),
      babel(getBabelConfig()),
      {
        transform(source) {
          return source.replace(/['"]use strict['"]/g, '');
        }
      },
      commonjs(),
      isProduction() &&
        closure(
          Object.assign({}, closureOptions)
        ),
      {
        renderChunk(code) {
          return Wrappers.wrapBundle(code);
        }
      },
      sizes({
        getSize(size, gzipSize) {
          const currentSizes = Stats.currentBuildResults.bundleSizes;
          const recordIndex = currentSizes.findIndex(
            record =>
              record.filename === filename
          )
          const index = recordIndex !== -1 ? recordIndex : currentSizes.length;

          currentSizes[index] = {
            filename,
            size,
            gzipSize,
          };
        }
      })
    ].filter(Boolean);
  }

  function getRollupOutputOptions() {
    return {};
  }

  const rollupConfig = {
    input: resolvedEntry,
    // treeshake: {},
    onwarn: handleRollupWarning,
    plugins: getPlugins(),
  };

  const rollupOutputOptions = getRollupOutputOptions();
}

async function buildEverything() {
  await asyncRimRaf('build');
}


buildEverything();
