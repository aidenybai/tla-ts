import { defineConfig } from "vite-plus";
import type { PackUserConfig } from "vite-plus/pack";

const licenseBanner = `/**
 * @license tla-ts
 *
 * Copyright (c) Aiden Bai
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */`;

export default defineConfig({
  pack: {
    banner: licenseBanner,
    clean: true,
    dts: true,
    entry: {
      index: "./src/index.ts",
      cli: "./src/cli.ts",
      "parallel-worker": "./src/parallel-worker.ts",
    },
    format: ["esm", "cjs"],
    hash: false,
    minify: process.env.NODE_ENV === "production",
    outDir: "./dist",
    platform: "neutral",
    target: "esnext",
    treeshake: true,
    tsconfig: "./tsconfig.build.json",
  } satisfies PackUserConfig,
  test: {
    include: ["tests/unit/**/*.test.ts"],
    passWithNoTests: true,
  },
});
