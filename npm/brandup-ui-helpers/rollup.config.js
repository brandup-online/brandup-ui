import nodeResolve from "@rollup/plugin-node-resolve";
import typescript from '@rollup/plugin-typescript';
import dts from "rollup-plugin-dts";

const pkg = require("./package.json");
const mainFile = "source/index.ts";
const polyfillFile = "source/polyfill.ts";
// The barrel plus any standalone entry points. `polyfill` is a side-effect-only module
// (see package.json "sideEffects") consumers opt into via "@brandup/ui-helpers/polyfill".
const entries = [mainFile, polyfillFile];

const externals = [
	...Object.keys( pkg.dependencies || {} ),
	...Object.keys( pkg.peerDependencies || {} )
];
const external = id => externals.some(name => id.startsWith(name));

// One build per format. preserveModules keeps the source file structure so a
// webpack consumer can tree-shake unused modules (combined with package.json
// "sideEffects"). outDir matches the rollup dir as @rollup/plugin-typescript requires.
const jsBuild = (dir, format) => ({
	input: entries,
	output: {
		dir,
		format,
		exports: "named",
		preserveModules: true,
		preserveModulesRoot: "source",
		entryFileNames: "[name].js",
		assetFileNames: '[name][extname]',
		sourcemap: true
	},
	external,
	plugins: [
		nodeResolve({
			extensions: ['.mjs', '.js', '.json', '.node', '.ts', '.mts'],
			preferBuiltins: true
		}),
		typescript({ tsconfig: "./tsconfig.json", exclude: ["**/*.test.ts", "test/**"], rootDir: "source", outDir: dir })
	]
});

export default [
	jsBuild("dist/cjs", "cjs"),
	jsBuild("dist/mjs", "esm"),
	{
		input: mainFile,
		output: [{ file: pkg.types, format: "es" }],
		plugins: [dts.default()]
	},
	{
		input: polyfillFile,
		output: [{ file: "dist/polyfill.d.ts", format: "es" }],
		plugins: [dts.default()]
	}
];
