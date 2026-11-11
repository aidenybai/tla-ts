import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite-plus";

const TYPESCRIPT_LIBRARIES = "virtual:typescript-libraries";

// The editor compiles TypeScript in the browser, which has no file system to read TypeScript's
// declaration files from, so this module bundles the ones the compiler loads.
const typescriptLibraries = (): Plugin => ({
  name: "typescript-libraries",
  resolveId: (id) => (id === TYPESCRIPT_LIBRARIES ? `\0${TYPESCRIPT_LIBRARIES}` : undefined),
  load: (id) => {
    if (id !== `\0${TYPESCRIPT_LIBRARIES}`) return undefined;
    const typescript: { getDefaultLibFilePath: (options: object) => string } = createRequire(
      new URL("../tla-ts/package.json", import.meta.url),
    )("@typescript/typescript6");
    const directory = dirname(typescript.getDefaultLibFilePath({}));
    const getLibraries = (fileName: string, libraries: Map<string, string>) => {
      if (libraries.has(fileName)) return libraries;
      const text = readFileSync(join(directory, fileName), "utf8");
      libraries.set(fileName, text);
      for (const match of text.matchAll(/<reference lib="([^"]+)"/g)) {
        getLibraries(`lib.${match[1]}.d.ts`, libraries);
      }
      return libraries;
    };
    const libraries = getLibraries("lib.esnext.d.ts", new Map());
    return `export default new Map(${JSON.stringify([...libraries])});`;
  },
});

export default defineConfig({
  plugins: [
    // The editor's components come from Realize, which memoizes through the React Compiler.
    react({
      babel: {
        plugins: [
          [
            "babel-plugin-react-compiler",
            {
              sources: (fileName: string) =>
                /\/src\/(components\/(ui|viewer)|hooks|lib|store)\/|\/src\/editor\.tsx$/.test(
                  fileName,
                ),
            },
          ],
        ],
      },
    }),
    tailwindcss(),
    typescriptLibraries(),
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
  worker: { format: "es", plugins: () => [typescriptLibraries()] },
});
