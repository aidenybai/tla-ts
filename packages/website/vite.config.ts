import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite-plus";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "readme-markdown",
      generateBundle() {
        const source = readFileSync(new URL("../../README.md", import.meta.url), "utf8");
        this.emitFile({ type: "asset", fileName: "index.md", source });
        this.emitFile({ type: "asset", fileName: "llms.txt", source });
      },
    },
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "tla-ts": fileURLToPath(new URL("../tla-ts/src/index.ts", import.meta.url)),
    },
  },
  worker: { format: "es" },
});
