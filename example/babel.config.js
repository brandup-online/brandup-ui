const plugins = [];

module.exports = {
  presets: [
    ["@babel/preset-env", {
        "useBuiltIns": "usage",
        "corejs": "3.37.1",
        "debug": true
    }],
    "@babel/preset-typescript",
  ],
  plugins,
};