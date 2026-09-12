import { defineConfig, type UserConfig } from "tsdown";

const mainFile = "source/index.ts";
const polyfillFile = "source/polyfill.ts";
// The barrel plus any standalone entry points. `polyfill` is a side-effect-only module
// (see package.json "sideEffects") consumers opt into via "@brandup/ui-helpers/polyfill".
const entries = [mainFile, polyfillFile];

// One build per format. unbundle keeps the source file structure so a webpack
// consumer can tree-shake unused modules (combined with package.json "sideEffects").
// Both formats keep the .js extension, so each one needs its own directory.
const jsBuild = (outDir: string, format: "cjs" | "es"): UserConfig => ({
	entry: entries,
	format,
	outDir,
	unbundle: true,
	platform: "neutral",
	target: "esnext",
	sourcemap: true,
	dts: false,
	// Rolldown does not emit the directive prologue; ESM sources are strict, so CJS must be too.
	banner: format === "cjs" ? "'use strict';" : undefined,
	outExtensions: () => ({ js: ".js" })
});

export default defineConfig([
	jsBuild("dist/cjs", "cjs"),
	jsBuild("dist/mjs", "es"),
	{
		// Each entry key becomes the output file name: dist/types.d.ts, dist/polyfill.d.ts.
		entry: { types: mainFile, polyfill: polyfillFile },
		outDir: "dist",
		platform: "neutral",
		outExtensions: () => ({ dts: ".d.ts" }),
		dts: { emitDtsOnly: true },
		clean: false
	}
]);
