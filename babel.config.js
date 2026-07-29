// Used only by jest (babel-jest). Tests run on Node, so no core-js injection here —
// Babel 8 dropped preset-env's `useBuiltIns`, and the browser bundle polyfills itself
// (see npm/brandup-ui-example/babel.config.js).
const plugins = ['@babel/plugin-transform-runtime'];

module.exports = {
  presets: [
    [
		"@babel/preset-env", {
			debug: false,
			modules: "commonjs",
    	}
	],
	"@babel/preset-typescript"
  ],
  plugins: plugins
};
