import { join } from "node:path";
import { defineConfig } from "vite-plus";

export default defineConfig({
  // Tests check compiled specs against tla-ts's source, so they don't need tla-ts built first.
  resolve: {
    alias: { "tla-ts": join(import.meta.dirname, "../tla-ts/src/index.ts") },
  },
  test: {
    include: ["tests/**/*.test.ts"],
  },
});
