import json from "rollup-plugin-json";
import typescript from "rollup-plugin-typescript2";
import commonjs from "rollup-plugin-commonjs";
import resolve from "rollup-plugin-node-resolve";
import uglify from "@lopatnov/rollup-plugin-uglify";

import pkg from "./package.json";
const globals = {
  "bip32-path": "bip32Path",
  "base-x": "basex",
  "@coinbarn/ergo-ts": "ergoTs"
};

export default [
  {
    input: `src/${pkg.libraryFile}.ts`,
    output: [
      {
        file: pkg.main,
        format: "umd",
        name: pkg.umdName,
        sourcemap: true,
        globals
      },
      {
        file: pkg.module,
        format: "es",
        sourcemap: true,
        globals
      }
    ],
    external: [...Object.keys(pkg.devDependencies || {}), ...Object.keys(pkg.dependencies || {})],
    plugins: [
      json(),
      typescript({
        typescript: require("typescript")
      }),
      resolve(),
      commonjs()
    ]
  },
  {
    input: `src/${pkg.libraryFile}.ts`,
    output: {
      file: `dist/${pkg.libraryFile}.min.js`,
      name: pkg.umdName,
      format: "umd",
      sourcemap: true,
      globals
    },
    external: [...Object.keys(pkg.devDependencies || {}), ...Object.keys(pkg.dependencies || {})],
    plugins: [
      json(),
      typescript({
        typescript: require("typescript")
      }),
      resolve(),
      commonjs(),
      uglify()
    ]
  }
];
