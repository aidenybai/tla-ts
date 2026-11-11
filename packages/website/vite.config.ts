import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, type Plugin } from "vite-plus";
import { printModule } from "../tla-ts/src/printer";
import { compile } from "../tla-ts/src/typescript/compile";
import { LOGO_PATH } from "./src/logo";
import type { Benchmark, CompiledExample } from "./src/site-data";

const SITE_DATA = "virtual:site-data";
const README_URL = new URL("../../README.md", import.meta.url);
const EXAMPLE_PATHS = [
  "./src/examples/counter.ts",
  "../tla-ts/tests/fixtures/typescript/cli/failing/overdraft.ts",
  "../tla-ts/tests/fixtures/typescript/examples/hour-clock/hour-clock.ts",
];
const GENERATED_NAMES = new Set(["vars", "Init", "Next", "Spec"]);
const BENCHMARK_ROW =
  /^\| (?:\[(?<linked>[^\]]+)\]\([^)]*\)|(?<plain>[^|[]+?)) +\|[^|]*\| +(?<tlc>[\d.]+) s \| +(?<tlaTs>[\d.]+) s \| +(?<speedup>[\d.]+×) \|$/;

const getExample = (path: string): CompiledExample => {
  const typescript = readFileSync(path, "utf8").trim();
  const fileName = path.slice(path.lastIndexOf("/") + 1);
  const compiled = compile(typescript, fileName);
  return {
    fileName,
    typescript,
    name: compiled.name,
    tla: printModule(compiled.source).trim(),
    config: compiled.config,
    highlightNames: [...compiled.source.variables, ...compiled.source.definitions]
      .map((declared) => declared.name)
      .filter((name) => !GENERATED_NAMES.has(name)),
  };
};

const getBenchmarks = (): Benchmark[] => {
  const readme = readFileSync(README_URL, "utf8");
  const table = readme.slice(readme.indexOf("## Benchmarks")).split("\n\n")[2];
  return table.split("\n").flatMap((row) => {
    const groups = BENCHMARK_ROW.exec(row)?.groups;
    return groups
      ? [
          {
            name: groups.linked ?? groups.plain,
            tlcSeconds: Number(groups.tlc),
            tlaTsSeconds: Number(groups.tlaTs),
            speedup: groups.speedup,
          },
        ]
      : [];
  });
};

const siteData = (): Plugin => ({
  name: "site-data",
  resolveId: (id) => (id === SITE_DATA ? `\0${SITE_DATA}` : undefined),
  load(id) {
    if (id !== `\0${SITE_DATA}`) return undefined;
    const paths = EXAMPLE_PATHS.map((path) => fileURLToPath(new URL(path, import.meta.url)));
    for (const path of [...paths, fileURLToPath(README_URL)]) this.addWatchFile(path);
    return [
      `export const examples = ${JSON.stringify(paths.map(getExample))};`,
      `export const benchmarks = ${JSON.stringify(getBenchmarks())};`,
    ].join("\n");
  },
});

const LOGO_FILES = {
  "favicon.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1 -1 11 11" shape-rendering="crispEdges"><style>path{fill:#21201c}@media(prefers-color-scheme:dark){path{fill:#eeeeec}}</style><path d="${LOGO_PATH}"/></svg>\n`,
  "logo-light.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 11" shape-rendering="crispEdges"><path fill="#21201c" d="${LOGO_PATH}"/></svg>\n`,
  "logo-dark.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 11" shape-rendering="crispEdges"><path fill="#eeeeec" d="${LOGO_PATH}"/></svg>\n`,
};

const logoFiles = (): Plugin => ({
  name: "logo-files",
  buildStart() {
    for (const [fileName, contents] of Object.entries(LOGO_FILES)) {
      writeFileSync(new URL(`./public/${fileName}`, import.meta.url), contents);
    }
  },
});

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    siteData(),
    logoFiles(),
    {
      name: "readme-markdown",
      generateBundle() {
        const source = readFileSync(README_URL, "utf8");
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
