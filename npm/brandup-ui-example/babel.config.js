const plugins = [
	// Babel 8: helpers injection is the plugin's only job, the `helpers` option is gone.
	'@babel/plugin-transform-runtime',
	// Babel 8 removed preset-env's `useBuiltIns`; core-js injection moved to this plugin.
	// `noRuntimeName` keeps helpers resolving to @babel/runtime — globals come from core-js itself.
	[
		'polyfill-corejs3', {
			method: "usage-global",
			version: "3.49",
			noRuntimeName: true
		}
	]
]; // '@babel/plugin-transform-runtime'

module.exports = {
  presets: [
    [
		"@babel/preset-env", {
			debug: false
    	}
	],
    "@babel/preset-typescript"
  ],
  plugins: plugins
};