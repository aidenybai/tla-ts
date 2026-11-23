import { spawnSync } from "node:child_process";
import { globSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import typescript from "@typescript/typescript6";
import react from "@vitejs/plugin-react";
import { createServer, defineConfig, type Plugin } from "vite-plus";
import { parseModule } from "../tla-ts/src/parser";
import { type EscoreRuntime, prepareHostRuntime } from "../tla-ts/src/typescript/spec/prepare";
import { BUILT_OUTPUT_LINES, type Precompiled } from "./src/lib/compilation";
import { getEscoreCompilation } from "./src/lib/escore";
import { createHighlighter } from "./src/lib/highlighter";
import { LOGO_PATH } from "./src/lib/logo";
import { getPageFile } from "./src/router";
import { LESSONS } from "./src/lib/tutorial";
import type {
  Benchmark,
  CompiledExample,
  ContentBlock,
  ContentSection,
  Source,
} from "./src/lib/site-data";

const SITE_DATA = "virtual:site-data";
const README_URL = new URL("../../README.md", import.meta.url);
const EXAMPLE_PATHS = [
  "./src/examples/likes.ts",
  "./src/examples/search-box.ts",
  "../tla-ts/tests/fixtures/typescript/examples/hour-clock/hour-clock.ts",
];
const PLAYGROUND_PATHS = [
  "./src/examples/*.ts",
  "../tla-ts/tests/fixtures/typescript/examples/two-phase/*.ts",
];
const GENERATED_NAMES = new Set(["vars", "Init", "Next", "Spec"]);
const BENCHMARK_ROW =
  /^\| (?:\[(?<linked>[^\]]+)\]\([^)]*\)|(?<plain>[^|[]+?)) +\|[^|]*\| +(?<tlc>[\d.]+) s \| +(?<tlaTs>[\d.]+) s \| +(?<speedup>[\d.]+×) \|$/;

// ESCore's runtime, which the build prepares once, from the host it records, for the files it
// compiles ahead of time.
let escoreRuntime: EscoreRuntime | undefined;
const getEscoreRuntime = () => (escoreRuntime ??= prepareHostRuntime(JSON.parse(getEscoreHost())));

const compileOnEscore = (source: string, fileName: string) =>
  getEscoreCompilation(source, fileName, getEscoreRuntime());

// The code that builds a source: each distinct style once, and each run of tokens of one style as
// its text with the style's number. ESCore's code of a program runs to a thousand lines, whose
// tokens each with its own style would be most of what a page loads.
const packSource = (source: Source, code = JSON.stringify(source.code)) => {
  const styles: string[] = [];
  const lines = source.lines.map((tokens) => {
    const runs: [string, number][] = [];
    for (const token of tokens) {
      const style = JSON.stringify(token.style);
      const number = styles.includes(style) ? styles.indexOf(style) : styles.push(style) - 1;
      const last = runs.at(-1);
      if (last?.[1] === number) last[0] += token.content;
      else runs.push([token.content, number]);
    }
    return runs;
  });
  return `((styles) => ({ code: ${code}, lines: ${JSON.stringify(lines)}.map((line) => line.map((run) => ({ content: run[0], style: styles[run[1]] }))) }))([${styles.join(",")}])`;
};

const getExample = (
  path: string,
  highlight: Awaited<ReturnType<typeof createHighlighter>>,
): CompiledExample => {
  const typescript = readFileSync(path, "utf8").trim();
  const fileName = path.slice(path.lastIndexOf("/") + 1);
  const compiled = compileOnEscore(typescript, fileName);
  const module = parseModule(compiled.tla);
  // The names of the program's code that its TypeScript names too.
  const words = new Set(typescript.match(/\w+/g));
  return {
    fileName,
    name: compiled.name,
    config: compiled.config,
    modules: compiled.modules,
    typescript: highlight(typescript, "typescript"),
    tla: highlight(compiled.tla, "tlaplus"),
    highlightNames: [...module.variables, ...module.definitions]
      .map((declared) => declared.name)
      .filter((name) => words.has(name) && !GENERATED_NAMES.has(name)),
  };
};

// The shape of the TLA+ a file compiles to: its tokens, split by tabs, with their letters, digits,
// and symbols masked. The playground draws it while its compiler loads, so the real text lands
// where the outline was.
const getOutline = (path: string, highlight: Awaited<ReturnType<typeof createHighlighter>>) =>
  highlight(
    compileOnEscore(readFileSync(path, "utf8").trim(), path.slice(path.lastIndexOf("/") + 1)).tla,
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
    .slice(0, BUILT_OUTPUT_LINES)
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
): ContentSection[] => {
  const readme = readFileSync(README_URL, "utf8");
  return REFERENCE_TITLES.map((title) => {
    const start = readme.indexOf(`## ${title}\n`);
    const body = readme.slice(readme.indexOf("\n", start), readme.indexOf("\n## ", start));
    return {
      title,
      blocks: [...body.matchAll(REFERENCE_BLOCK)].map((match): ContentBlock => {
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
      `export const examples = [${paths
        .map((path) => getExample(path, highlight))
        .map(
          (example) =>
            `{ ...${JSON.stringify({ ...example, tla: undefined })}, tla: ${packSource(example.tla)} }`,
        )
        .join(",")}];`,
      `export const benchmarks = ${JSON.stringify(getBenchmarks())};`,
      `export const prompt = ${JSON.stringify(PROMPT.exec(readFileSync(README_URL, "utf8"))?.groups?.prompt)};`,
      `export const install = ${JSON.stringify(highlight("npm install tla-ts", "shellscript"))};`,
      `export const reference = ${JSON.stringify(getReference(highlight))};`,
    ].join("\n");
  },
});

const TUTORIAL = "virtual:tutorial";

const tutorial = (): Plugin => ({
  name: "tutorial",
  resolveId: (id) => (id === TUTORIAL ? `\0${TUTORIAL}` : undefined),
  async load(id) {
    if (id !== `\0${TUTORIAL}`) return undefined;
    this.addWatchFile(fileURLToPath(new URL("./src/lib/tutorial.ts", import.meta.url)));
    const highlight = await createHighlighter();
    return `export default ${JSON.stringify(
      LESSONS.map((lesson): ContentSection => ({
        title: lesson.title,
        blocks: lesson.blocks.map((block): ContentBlock => {
          if (typeof block === "string") return { kind: "paragraph", text: block };
          if ("heading" in block) return { kind: "heading", text: block.heading };
          if ("tla" in block) {
            return {
              kind: "comparison",
              typescript: highlight(block.typescript, "typescript"),
              tla: highlight(block.tla, "tlaplus"),
            };
          }
          return { kind: "code", source: highlight(block.code, block.language) };
        }),
      })),
    )};`;
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

const ESCORE_DIRECTORY = fileURLToPath(new URL("../tla-ts/ecmascript", import.meta.url));

const ESCORE_HOST = "escore-host.json";

// The host that the page prepares ESCore's runtime from, as JSON, which Node records, with a stack
// deep enough to start ESCore's realm, from a bundle of tla-ts's script, as tla-ts's scripts run.
const recordEscoreHost = () => {
  const directory = fileURLToPath(new URL("./node_modules/.escore-host/", import.meta.url));
  const steps = [
    [
      "bun",
      "build",
      fileURLToPath(new URL("../tla-ts/scripts/escore-host.ts", import.meta.url)),
      "--target=node",
      "--packages=external",
      "--outfile",
      join(directory, "escore-host.js"),
    ],
    [
      "node",
      "--stack-size=4000",
      join(directory, "escore-host.js"),
      ESCORE_DIRECTORY,
      join(directory, ESCORE_HOST),
    ],
  ];
  for (const step of steps) {
    const result = spawnSync(step[0], step.slice(1), { stdio: "inherit" });
    if (result.status !== 0) throw new Error(`${step.join(" ")} exited with ${result.status}`);
  }
  process.env[RECORDED_HOST] = join(directory, ESCORE_HOST);
  return readFileSync(join(directory, ESCORE_HOST), "utf8");
};

// The file of the host that this process recorded, which the build's prerender servers, which
// load this config again, read rather than record it again.
const RECORDED_HOST = "TLA_TS_ESCORE_HOST";

// The host, recorded once a process.
let escoreHost: string | undefined;
const getEscoreHost = () => {
  const recorded = process.env[RECORDED_HOST];
  escoreHost ??= recorded === undefined ? recordEscoreHost() : readFileSync(recorded, "utf8");
  return escoreHost;
};

// The page fetches the host beside its scripts: a build writes it, and a dev server records it
// when the page first asks.
const hostFile = (): Plugin => ({
  name: "escore-host",
  configureServer(server) {
    server.middlewares.use(`/${ESCORE_HOST}`, (_request, response) => {
      response.setHeader("Content-Type", "application/json");
      response.end(getEscoreHost());
    });
  },
  generateBundle() {
    this.emitFile({ type: "asset", fileName: ESCORE_HOST, source: getEscoreHost() });
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
    const compilation = compileOnEscore(source, getFileName(path));
    const built: Omit<Precompiled, "tla"> = {
      fileName: getFileName(path),
      source,
      typescript: highlight(source, "typescript").lines,
      compilation,
    };
    return `const built = ${JSON.stringify(built)};\nexport default { ...built, tla: ${packSource(highlight(compilation.tla, "tlaplus"), "built.compilation.tla")} };`;
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

// Each route but / is built from the HTML file of its name.
const ROUTES = ["/playground", "/tla-for-ts-developers"];
const ORIGIN = "https://tla-ts.com";
const EMPTY_ROOT = '<div id="root"></div>';
const STYLESHEET = /<link rel="stylesheet"[^>]*href="\/([^"]+\.css)"[^>]*>/;

const pages = (): Plugin => ({
  name: "pages",
  generateBundle() {
    this.emitFile({
      type: "asset",
      fileName: "sitemap.xml",
      source: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${["/", ...ROUTES].map((route) => `  <url><loc>${ORIGIN}${route}</loc></url>`).join("\n")}\n</urlset>\n`,
    });
  },
  configureServer(server) {
    server.middlewares.use((request, _response, next) => {
      const route = request.url?.replace(/\/$/, "");
      if (route !== undefined && ROUTES.includes(route)) request.url = `${route}.html`;
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
      const route = context.path.replace(/(?:index)?\.html$/, "");
      const pageFile = getPageFile(route).slice(1);
      const page = Object.values(context.bundle ?? {}).find(
        (chunk) => chunk.type === "chunk" && chunk.facadeModuleId?.endsWith(pageFile),
      );
      // The entry imports the route's page by its path, so the page's chunks are named here to
      // load beside the entry, not after it.
      const preloads = (page?.type === "chunk" ? [page.fileName, ...page.imports] : [])
        .map((fileName) => `<link rel="modulepreload" crossorigin href="/${fileName}">`)
        .join("");
      return html
        .replace("</head>", `${preloads}</head>`)
        .replace(STYLESHEET, (link, fileName) => {
          const styles = context.bundle?.[fileName];
          // The styles ride in the HTML, so the first paint does not wait on a second request.
          return styles?.type === "asset" ? `<style>${styles.source}</style>` : link;
        })
        .replace(EMPTY_ROOT, `<div id="root">${prerender.getHtml(route)}</div>`);
    },
  },
});

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    siteData(),
    tutorial(),
    outlines(),
    compilations(),
    typescriptLibraries(),
    logoFiles(),
    hostFile(),
    pages(),
  ],
  build: {
    rollupOptions: {
      input: ["/index", ...ROUTES].map((route) =>
        fileURLToPath(new URL(`.${route}.html`, import.meta.url)),
      ),
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
