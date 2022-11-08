const webpack = require('webpack');

module.exports = function override(config) {
  config.resolve.fallback = {
    "assert": require.resolve('assert'),
    "buffer": require.resolve('buffer'),
    "path": require.resolve("path-browserify"),
    "os": require.resolve("os-browserify/browser"),
    "constants": require.resolve("constants-browserify"),
    "crypto": require.resolve("crypto-browserify"),
    "stream": require.resolve("stream-browserify"),
    "fs": false,
    "process": false,
    "readline": false,
  };
  config.plugins.push(
    new webpack.ProvidePlugin({
      process: 'process/browser',
      Buffer: ['buffer', 'Buffer'],
    })
  );

  return config;
};