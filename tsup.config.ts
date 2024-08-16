import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/erg.ts"],
  outDir: "./dist",
  splitting: false,
  treeshake: true,
  sourcemap: true,
  clean: true,
  dts: { resolve: false },
  format: ["esm", "cjs"]
});
