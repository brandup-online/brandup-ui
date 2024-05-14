import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";
import typescript from "rollup-plugin-typescript2";
import dts from "rollup-plugin-dts";
import terser from "@rollup/plugin-terser";
import peerDepsExternal from "rollup-plugin-peer-deps-external";
import image from '@rollup/plugin-image';
import less from 'rollup-plugin-less';

const packageJson = require("./package.json");

export default [
  {
    input: "source/index.ts",
    output: [
      {
        file: packageJson.main,
        format: "cjs",
        sourcemap: true,
      },
      {
        file: packageJson.module,
        format: "esm",
        sourcemap: true,
      },
    ],
    plugins: [
      peerDepsExternal(), // исключает лишние зависимости
      resolve(), // работа с node_modules
      commonjs(), // поддержка CommonJS
      typescript({ tsconfig: "./tsconfig.json" }), // поддержка typescript
      terser(), // минификация сборки
      image(),
      less(),
    ],
  },
  {
    input: "source/index.ts",
    output: [{ file: packageJson.types, format: "es" }],
    plugins: [dts.default(),less()],
  },
];