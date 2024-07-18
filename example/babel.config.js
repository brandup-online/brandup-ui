const plugins = [];

const isModern = process.env.BROWSERS_ENV === 'modern';

module.exports = {
  presets: [
    ["@babel/preset-env", {
        "useBuiltIns": "usage",
        "corejs": "3.37.1",
        "targets": isModern ? { esmodules: true } : undefined,
        // "debug": true
    }],
    "@babel/preset-typescript",
  ],
  plugins,
};