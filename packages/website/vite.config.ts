import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import typescript from "@typescript/typescript6";
import react from "@vitejs/plugin-react";
import { createServer, defineConfig, type Plugin } from "vite-plus";
import { printModule } from "../tla-ts/src/printer";
import { compile } from "../tla-ts/src/typescript/compile";
import { createHighlighter } from "./src/highlighter";
import { LOGO_PATH } from "./src/logo";
import type { Benchmark, CompiledExample, ReferenceBlock, ReferenceSection } from "./src/site-data";

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

const getExample = (
  path: string,
  highlight: Awaited<ReturnType<typeof createHighlighter>>,
): CompiledExample => {
  const typescript = readFileSync(path, "utf8").trim();
  const fileName = path.slice(path.lastIndexOf("/") + 1);
  const compiled = compile(typescript, fileName);
  return {
    fileName,
    name: compiled.name,
    config: compiled.config,
    typescript: highlight(typescript, "typescript"),
    tla: highlight(printModule(compiled.source).trim(), "tlaplus"),
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

const REFERENCE_TITLES = ["CLI", "API"];
const REFERENCE_BLOCK =
  /^```(?<language>\w+)\n(?<code>[\s\S]*?)\n```$|^### (?<heading>.+)$|(?<table>(?:^\|.*\n?)+)|^(?<paragraph>[^#\n].*)$/gm;

const getCells = (row: string) =>
  row
    .split("|")
    .slice(1, -1)
    .map((cell) => cell.trim());

const getReference = (
  highlight: Awaited<ReturnType<typeof createHighlighter>>,
): ReferenceSection[] => {
  const readme = readFileSync(README_URL, "utf8");
  return REFERENCE_TITLES.map((title) => {
    const start = readme.indexOf(`## ${title}\n`);
    const body = readme.slice(readme.indexOf("\n", start), readme.indexOf("\n## ", start));
    return {
      title,
      blocks: [...body.matchAll(REFERENCE_BLOCK)].map((match): ReferenceBlock => {
        const groups = match.groups ?? {};
        if (groups.code !== undefined) {
          return {
            kind: "code",
            source: highlight(groups.code, groups.language === "ts" ? "typescript" : "shellscript"),
          };
        }
        if (groups.heading !== undefined) return { kind: "heading", text: groups.heading };
        if (groups.table === undefined) return { kind: "paragraph", text: groups.paragraph };
        const rows = groups.table.trim().split("\n").map(getCells);
        return { kind: "table", header: rows[0], rows: rows.slice(2) };
      }),
    };
  });
};

const siteData = (): Plugin => ({
  name: "site-data",
  resolveId: (id) => (id === SITE_DATA ? `\0${SITE_DATA}` : undefined),
  async load(id) {
    if (id !== `\0${SITE_DATA}`) return undefined;
    const paths = EXAMPLE_PATHS.map((path) => fileURLToPath(new URL(path, import.meta.url)));
    for (const path of [...paths, fileURLToPath(README_URL)]) this.addWatchFile(path);
    const highlight = await createHighlighter();
    return [
      `export const examples = ${JSON.stringify(paths.map((path) => getExample(path, highlight)))};`,
      `export const benchmarks = ${JSON.stringify(getBenchmarks())};`,
      `export const install = ${JSON.stringify(highlight("npm install tla-ts", "shellscript"))};`,
      `export const reference = ${JSON.stringify(getReference(highlight))};`,
    ].join("\n");
  },
});

const TYPESCRIPT_LIBRARIES = "virtual:typescript-libraries";

const getLibraries = (directory: string, fileName: string, libraries: Map<string, string>) => {
  if (libraries.has(fileName)) return libraries;
  const text = readFileSync(join(directory, fileName), "utf8");
  libraries.set(fileName, text);
  for (const match of text.matchAll(/<reference lib="([^"]+)"/g)) {
    getLibraries(directory, `lib.${match[1]}.d.ts`, libraries);
  }
  return libraries;
};

const typescriptLibraries = (): Plugin => ({
  name: "typescript-libraries",
  resolveId: (id) => (id === TYPESCRIPT_LIBRARIES ? `\0${TYPESCRIPT_LIBRARIES}` : undefined),
  load: (id) =>
    id === `\0${TYPESCRIPT_LIBRARIES}`
      ? `export default new Map(${JSON.stringify([
          ...getLibraries(
            dirname(typescript.getDefaultLibFilePath({})),
            "lib.esnext.d.ts",
            new Map(),
          ),
        ])});`
      : undefined,
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

const EMPTY_ROOT = '<div id="root"></div>';

const pages = (): Plugin => ({
  name: "pages",
  configureServer(server) {
    server.middlewares.use((request, _response, next) => {
      if (request.url?.replace(/\/$/, "") === "/playground") request.url = "/playground.html";
      next();
    });
  },
  transformIndexHtml: {
    order: "post",
    async handler(html, context) {
      if (context.server || !context.filename.endsWith("/index.html")) return html;
      const server = await createServer({ server: { middlewareMode: true }, appType: "custom" });
      const prerender = await server.ssrLoadModule("/src/prerender.tsx");
      await server.close();
      return html.replace(EMPTY_ROOT, `<div id="root">${prerender.getAppHtml()}</div>`);
    },
  },
});

export default defineConfig({
  plugins: [react(), tailwindcss(), siteData(), typescriptLibraries(), logoFiles(), pages()],
  build: {
    rollupOptions: {
      input: [
        fileURLToPath(new URL("./index.html", import.meta.url)),
        fileURLToPath(new URL("./playground.html", import.meta.url)),
      ],
    },
  },
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "tla-ts": fileURLToPath(new URL("../tla-ts/src/index.ts", import.meta.url)),
    },
  },
  worker: { format: "es", plugins: () => [typescriptLibraries()] },
});
