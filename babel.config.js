const plugins = [
	[
		'@babel/plugin-transform-runtime', {
			absoluteRuntime: false,
			corejs: false,
			helpers: true,
			useESModules: true
		}
	]
];

module.exports = {
  presets: [
    [
		"@babel/preset-env", {
			corejs: "3.37.1",
			debug: false,
			modules: "commonjs",
			targets: { node: 'current'}
    	}
	],
	"@babel/preset-typescript"
  ],
  plugins: []
};