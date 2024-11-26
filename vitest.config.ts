import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      thresholds: {
        "100": true
      },
      all: true,
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "**/*.spec.ts",
        "**/*.d.ts",
        "**/*.bench.ts",
        "**/*.test-d.ts",
        "**/*.test.ts",
        "*.config.ts",
        "dist/**",
        "coverage/**",
        "node_modules/**"
      ]
    }
  }
});
