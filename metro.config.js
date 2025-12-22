const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

config.transformer = {
  ...config.transformer,
  minifierPath: "metro-minify-terser",
  minifierConfig: {
    compress: {
      drop_console: true,
      drop_debugger: true,
      dead_code: true,
      unused: true,
      passes: 3,
    },
    mangle: {
      toplevel: true,
      keep_fnames: false,
      keep_classnames: false,
    },
    output: {
      comments: false,
    },
  },
};

module.exports = config;
