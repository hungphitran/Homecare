module.exports = {
  resolve: {
    fallback: {
      "path": require.resolve("path-browserify"),
      "fs": false,
      "crypto": false
    }
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        resolve: {
          fullySpecified: false
        }
      }
    ]
  }
};
