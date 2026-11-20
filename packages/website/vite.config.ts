import { existsSync, globSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import typescript from "@typescript/typescript6";
import react from "@vitejs/plugin-react";
import { createServer, defineConfig, type Plugin } from "vite-plus";
import { printModule } from "../tla-ts/src/printer";
import { compile } from "../tla-ts/src/typescript/compile";
import { printRegions } from "../tla-ts/src/typescript/regions";
import { getCompilation, type Precompiled } from "./src/compilation";
import { createHighlighter } from "./src/highlighter";
import { LOGO_PATH } from "./src/logo";
import type { Benchmark, CompiledExample, ReferenceBlock, ReferenceSection } from "./src/site-data";

const SITE_DATA = "virtual:site-data";
const README_URL = new URL("../../README.md", import.meta.url);
const EXAMPLE_PATHS = [
  "./src/examples/search-box.ts",
  "./src/examples/likes.ts",
  "../tla-ts/tests/fixtures/typescript/examples/hour-clock/hour-clock.ts",
];
const getFixedPath = (path: string) => path.replace(/\.ts$/, "-fixed.ts");
const PLAYGROUND_PATHS = [
  "./src/examples/!(*-fixed).ts",
  "../tla-ts/tests/fixtures/typescript/examples/two-phase/*.ts",
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
  const highlightNames = [...compiled.source.variables, ...compiled.source.definitions]
    .map((declared) => declared.name)
    .filter((name) => !GENERATED_NAMES.has(name));
  const fixedPath = getFixedPath(path);
  return {
    fileName,
    name: compiled.name,
    config: compiled.config,
    modules: Object.fromEntries(
      compiled.source.extends.flatMap((name) => {
        const text = compiled.loadModule(name);
        return text === undefined ? [] : [[name, text]];
      }),
    ),
    typescript: highlight(typescript, "typescript"),
    tla: highlight(printModule(compiled.source).trim(), "tlaplus"),
    highlightNames,
    lines: Object.fromEntries(
      highlightNames.flatMap((name) => {
        const index = typescript
          .split("\n")
          .findIndex((line) => new RegExp(`\\b(?:const|let|var|function) ${name}\\b`).test(line));
        return index < 0 ? [] : [[name, index + 1]];
      }),
    ),
    fixed: existsSync(fixedPath) ? getExample(fixedPath, highlight) : undefined,
  };
};

// The shape of the TLA+ a file compiles to: its tokens, split by tabs, with their letters, digits,
// and symbols masked. The playground draws it while its compiler loads, so the real text lands
// where the outline was.
const getOutline = (path: string, highlight: Awaited<ReturnType<typeof createHighlighter>>) =>
  highlight(
    printRegions(
      compile(readFileSync(path, "utf8").trim(), path.slice(path.lastIndexOf("/") + 1)),
    ).text.trimEnd(),
    "tlaplus",
  )
    .lines.map((tokens) =>
      tokens
        .map((token) =>
          token.content
            .replace(/[A-Za-z_]/g, "a")
            .replace(/\d/g, "0")
            .replace(/[^\sa0]/g, "."),
        )
        .join("\t"),
    )
    .join("\n");

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

const PROMPT = /```text\n(?<prompt>[\s\S]*?)\n```/;

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
    for (const path of [
      ...paths.flatMap((path) => [path, getFixedPath(path)].filter((found) => existsSync(found))),
      fileURLToPath(README_URL),
    ])
      this.addWatchFile(path);
    const highlight = await createHighlighter();
    return [
      `export const examples = ${JSON.stringify(paths.map((path) => getExample(path, highlight)))};`,
      `export const benchmarks = ${JSON.stringify(getBenchmarks())};`,
      `export const prompt = ${JSON.stringify(PROMPT.exec(readFileSync(README_URL, "utf8"))?.groups?.prompt)};`,
      `export const install = ${JSON.stringify(highlight("npm install tla-ts", "shellscript"))};`,
      `export const reference = ${JSON.stringify(getReference(highlight))};`,
    ].join("\n");
  },
});

const OUTLINES = "virtual:outlines";

const outlines = (): Plugin => ({
  name: "outlines",
  resolveId: (id) => (id === OUTLINES ? `\0${OUTLINES}` : undefined),
  async load(id) {
    if (id !== `\0${OUTLINES}`) return undefined;
    const highlight = await createHighlighter();
    const paths = globSync([...EXAMPLE_PATHS, ...PLAYGROUND_PATHS], {
      cwd: fileURLToPath(new URL(".", import.meta.url)),
    }).map((path) => fileURLToPath(new URL(path, import.meta.url)));
    for (const path of paths) this.addWatchFile(path);
    return `export default ${JSON.stringify(
      Object.fromEntries(
        paths.map((path) => [path.slice(path.lastIndexOf("/") + 1), getOutline(path, highlight)]),
      ),
    )};`;
  },
});

const COMPILATIONS = "virtual:compilations";
const COMPILATION = "virtual:compilation/";
const INITIAL_FILE_NAME = "likes.ts";

// Every example compiled ahead of time. The playground's first file ships with the page, and
// each other file is a chunk of its own, fetched when it is opened.
const compilations = (): Plugin => ({
  name: "compilations",
  resolveId: (id) => (id === COMPILATIONS || id.startsWith(COMPILATION) ? `\0${id}` : undefined),
  async load(id) {
    if (!id.startsWith("\0virtual:compilation")) return undefined;
    const paths = globSync([...EXAMPLE_PATHS, ...PLAYGROUND_PATHS], {
      cwd: fileURLToPath(new URL(".", import.meta.url)),
    }).map((path) => fileURLToPath(new URL(path, import.meta.url)));
    const getFileName = (path: string) => path.slice(path.lastIndexOf("/") + 1);
    if (id === `\0${COMPILATIONS}`) {
      return [
        `import initial from ${JSON.stringify(COMPILATION + INITIAL_FILE_NAME)};`,
        "export { initial };",
        `export const compilations = {${paths
          .map(getFileName)
          .map((fileName) =>
            fileName === INITIAL_FILE_NAME
              ? `${JSON.stringify(fileName)}: () => Promise.resolve(initial)`
              : `${JSON.stringify(fileName)}: () => import(${JSON.stringify(COMPILATION + fileName)}).then((loaded) => loaded.default)`,
          )
          .join(",")}};`,
      ].join("\n");
    }
    const path = paths.find((found) => getFileName(found) === id.slice(COMPILATION.length + 1));
    if (path === undefined) return undefined;
    this.addWatchFile(path);
    const highlight = await createHighlighter();
    const source = readFileSync(path, "utf8").trim();
    const compilation = getCompilation(source, getFileName(path));
    return `export default ${JSON.stringify({
      fileName: getFileName(path),
      source,
      typescript: highlight(source, "typescript").lines,
      compilation,
      tla: highlight(compilation.tla, "tlaplus"),
    } satisfies Precompiled)};`;
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
const STYLESHEET = /<link rel="stylesheet"[^>]*href="\/([^"]+\.css)"[^>]*>/;

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
      if (context.server) return html;
      // Its own cache, so a build does not overwrite the modules a running dev server serves.
      const server = await createServer({
        server: { middlewareMode: true },
        appType: "custom",
        cacheDir: "node_modules/.vite-prerender",
      });
      const prerender = await server.ssrLoadModule("/src/prerender.tsx");
      await server.close();
      const content = context.filename.endsWith("/playground.html")
        ? prerender.getPlaygroundHtml()
        : prerender.getAppHtml();
      return html
        .replace(STYLESHEET, (link, fileName) => {
          const styles = context.bundle?.[fileName];
          // The styles ride in the HTML, so the first paint does not wait on a second request.
          return styles?.type === "asset" ? `<style>${styles.source}</style>` : link;
        })
        .replace(EMPTY_ROOT, `<div id="root">${content}</div>`);
    },
  },
});

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    siteData(),
    outlines(),
    compilations(),
    typescriptLibraries(),
    logoFiles(),
    pages(),
  ],
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
