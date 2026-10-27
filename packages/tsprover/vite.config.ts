import { join } from "node:path";
import { defineConfig } from "vite-plus";
import type { PackUserConfig } from "vite-plus/pack";

export default defineConfig({
  pack: {
    clean: true,
    dts: true,
    entry: {
      index: "./src/index.ts",
      cli: "./src/cli.ts",
    },
    fixedExtension: false,
    format: ["esm"],
    hash: false,
    outDir: "./dist",
    platform: "node",
    target: "node22",
    tsconfig: "./tsconfig.build.json",
  } satisfies PackUserConfig,
  // Tests check compiled specs against tla-ts's source, so they don't need tla-ts built first.
  resolve: {
    alias: { "tla-ts": join(import.meta.dirname, "../tla-ts/src/index.ts") },
  },
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
