import { spawnSync } from "node:child_process";
import { globSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import tailwindcss from "@tailwindcss/vite";
import typescript from "@typescript/typescript6";
import react from "@vitejs/plugin-react";
import { createServer, defineConfig, type Plugin } from "vite-plus";
import { type JsTlaRuntime, prepareHostRuntime } from "../tla-ts/src/typescript/spec/prepare";
import { BUILT_OUTPUT_LINES, getSourceLanguage, type Precompiled } from "./src/lib/compilation";
import { getLineMarks } from "./src/lib/line-marks";
import { getOutputRows } from "./src/lib/output-rows";
import { getJsTlaCompilation } from "./src/lib/js-tla";
import { compileJsTla } from "../tla-ts/src/typescript/spec/api";
import { createMemorySystem, type ProgramSystem } from "../tla-ts/src/typescript/system";
import { createHighlighter } from "./src/lib/highlighter";
import { LOGO_PATH } from "./src/lib/logo";
import { getPageFile } from "./src/router";
import type {
  Benchmark,
  CompiledExample,
  ContentBlock,
  ContentSection,
  Source,
} from "./src/lib/site-data";

const SITE_DATA = "virtual:site-data";
const README_URL = new URL("../../README.md", import.meta.url);
const EXAMPLE_PATHS = ["./src/examples/maze.ts"];
const PLAYGROUND_PATHS = [
  "./src/examples/*.{ts,tsx}",
  "../tla-ts/tests/fixtures/typescript/examples/two-phase/*.ts",
];
const BENCHMARK_ROW =
  /^\| (?:\[(?<linked>[^\]]+)\]\([^)]*\)|(?<plain>[^|[]+?)) +\|[^|]*\| +(?<tlc>[\d.]+) s \| +(?<tlaTs>[\d.]+) s \| +(?<speedup>[\d.]+×) \|$/;

const getFileName = (path: string) => path.slice(path.lastIndexOf("/") + 1);

// The site's programs, the examples and the playground's files, by absolute path.
const getProgramPaths = () =>
  globSync([...EXAMPLE_PATHS, ...PLAYGROUND_PATHS], {
    cwd: fileURLToPath(new URL(".", import.meta.url)),
  }).map((path) => fileURLToPath(new URL(path, import.meta.url)));

// JS.tla's runtime, which the build prepares once, from the host it records, for the files it
// compiles ahead of time.
let jsTlaRuntime: JsTlaRuntime | undefined;
const getJsTlaRuntime = () => (jsTlaRuntime ??= prepareHostRuntime(JSON.parse(getJsTlaHost())));

const compileOnJsTla = (source: string, fileName: string) =>
  getJsTlaCompilation(source, fileName, getJsTlaRuntime(), getPackageFiles());

// The code that builds a source, from the code of an expression of its text: each distinct style
// once, and each run of tokens of one style as its text with the style's number. JS.tla's code of
// a program runs to a thousand lines, whose tokens each with its own style would be most of what a
// page loads.
const packSource = (source: Source, code: string) => {
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

// An example as the home page shows it before it runs, whose TLA+ the page loads with the
// playground's compilation of the file, as the TLA+ of a program on React runs to megabytes.
const getExample = (
  path: string,
  highlight: Awaited<ReturnType<typeof createHighlighter>>,
): CompiledExample => {
  const typescript = readFileSync(path, "utf8").trim();
  const fileName = getFileName(path);
  return {
    fileName,
    typescript: highlight(typescript, getSourceLanguage(fileName)),
    sourceMarks: compileOnJsTla(typescript, fileName).sourceMarks,
  };
};

const maskText = (text: string) =>
  text
    .replace(/[A-Za-z_]/g, "a")
    .replace(/\d/g, "0")
    .replace(/[^\sa0]/g, ".");

// The shape of the rows that the playground shows of a file's TLA+, with their text masked: a
// line as its number and tokens, split by tabs, a comment after an empty cell, and a fold's count
// of lines after a plus. The playground draws it while its compiler loads.
const getOutline = (path: string, highlight: Awaited<ReturnType<typeof createHighlighter>>) => {
  const compiled = compileOnJsTla(readFileSync(path, "utf8").trim(), getFileName(path));
  return getOutputRows({
    lines: highlight(compiled.tla, "tlaplus").lines,
    lineMarks: getLineMarks(compiled.tla.split("\n"), compiled.outputMarks),
    source: compiled.source,
    sourceMarks: compiled.sourceMarks,
    openFolds: new Set(),
    pinnedLines: new Set(),
  })
    .slice(0, BUILT_OUTPUT_LINES)
    .map((row) =>
      row.kind === "line"
        ? [row.number, ...row.tokens.map((token) => maskText(token.content))].join("\t")
        : row.kind === "comment"
          ? `\t${maskText(row.text)}`
          : `+\t${row.lineCount}`,
    )
    .join("\n");
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
    const paths = getProgramPaths();
    for (const path of paths) this.addWatchFile(path);
    return `export default ${JSON.stringify(
      Object.fromEntries(paths.map((path) => [getFileName(path), getOutline(path, highlight)])),
    )};`;
  },
});

const JS_TLA_DIRECTORY = fileURLToPath(new URL("../tla-ts/ecmascript", import.meta.url));

const JS_TLA_HOST = "js-tla-host.json";

// The host that the page prepares JS.tla's runtime from, as JSON, which Node records, with a stack
// deep enough to start JS.tla's realm, from a bundle of tla-ts's script, as tla-ts's scripts run.
const recordJsTlaHost = () => {
  const directory = fileURLToPath(new URL("./node_modules/.js-tla-host/", import.meta.url));
  const steps = [
    [
      "bun",
      "build",
      fileURLToPath(new URL("../tla-ts/scripts/js-tla-host.ts", import.meta.url)),
      "--target=node",
      "--packages=external",
      "--outfile",
      join(directory, "js-tla-host.js"),
    ],
    [
      "node",
      "--stack-size=4000",
      join(directory, "js-tla-host.js"),
      JS_TLA_DIRECTORY,
      join(directory, JS_TLA_HOST),
    ],
  ];
  for (const step of steps) {
    const result = spawnSync(step[0], step.slice(1), { stdio: "inherit" });
    if (result.status !== 0) throw new Error(`${step.join(" ")} exited with ${result.status}`);
  }
  process.env[RECORDED_HOST] = join(directory, JS_TLA_HOST);
  return readFileSync(join(directory, JS_TLA_HOST), "utf8");
};

// The file of the host that this process recorded, which the build's prerender servers, which
// load this config again, read rather than record it again.
const RECORDED_HOST = "TLA_TS_JS_TLA_HOST";

// The host, recorded once a process.
let jsTlaHost: string | undefined;
const getJsTlaHost = () => {
  const recorded = process.env[RECORDED_HOST];
  jsTlaHost ??= recorded === undefined ? recordJsTlaHost() : readFileSync(recorded, "utf8");
  return jsTlaHost;
};

// The page fetches the host beside its scripts: a build writes it, and a dev server records it
// when the page first asks.
const hostFile = (): Plugin => ({
  name: "js-tla-host",
  configureServer(server) {
    server.middlewares.use(`/${JS_TLA_HOST}`, (_request, response) => {
      response.setHeader("Content-Type", "application/json");
      response.end(getJsTlaHost());
    });
  },
  generateBundle() {
    this.emitFile({ type: "asset", fileName: JS_TLA_HOST, source: getJsTlaHost() });
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
    const paths = getProgramPaths();
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
    const compilation = compileOnJsTla(source, getFileName(path));
    const built: Omit<Precompiled, "tla"> = {
      fileName: getFileName(path),
      source,
      typescript: highlight(source, getSourceLanguage(getFileName(path))).lines,
      compilation,
    };
    return `const built = ${JSON.stringify(built)};\nexport default { ...built, tla: ${packSource(highlight(compilation.tla, "tlaplus"), "built.compilation.tla")} };`;
  },
});

// The packages that the site's programs import, from the root's node_modules.
const PACKAGES = ["react", "react-dom"];

const PACKAGE_FILES = "virtual:package-files";

// Every file of the packages, by its path from the root.
const getEveryPackageFile = () =>
  new Map(
    PACKAGES.flatMap((name) => {
      const directory = fileURLToPath(new URL(`./node_modules/${name}/`, import.meta.url));
      return globSync("**/*", { cwd: directory, withFileTypes: true })
        .filter((entry) => entry.isFile())
        .map((entry) => {
          const path = join(entry.parentPath, entry.name);
          return [
            `/node_modules/${name}/${path.slice(directory.length)}`,
            readFileSync(path, "utf8"),
          ] as const;
        });
    }),
  );

// The files of the packages that compiling the site's programs reads, which the page passes as the
// files that a program runs on, as a browser has no file system: the files that JS.tla loads as
// Node's resolution finds them, and those that their resolution and the names of their exports
// read. The rest, such as React's development builds and react-dom's client, no program loads.
// Each program compiles on these as on every file of the packages, which the build checks.
const readPackageFiles = () => {
  const files = getEveryPackageFile();
  const read = new Set<string>();
  const programs = getProgramPaths().map((path) => ({
    source: readFileSync(path, "utf8").trim(),
    fileName: getFileName(path),
  }));
  const getCode = (
    program: (typeof programs)[number],
    passed: ReadonlyMap<string, string>,
    system?: ProgramSystem,
  ) => {
    const compiled = compileJsTla(
      { ...program, files: passed },
      getJsTlaRuntime(),
      undefined,
      system,
    );
    return `${compiled.config}\n${compiled.loadModule("ProgramCode")}`;
  };
  const codes = programs.map((program) => {
    const system = createMemorySystem(files, program);
    return getCode(program, files, {
      ...system,
      readFile: (path) => {
        const text = system.readFile(path);
        if (text !== undefined) read.add(system.resolvePath(path));
        return text;
      },
      fileExists: (path) => {
        const isFound = system.fileExists(path);
        if (isFound) read.add(system.resolvePath(path));
        return isFound;
      },
    });
  });
  const loaded = new Map([...files].filter((file) => read.has(file[0])));
  programs.forEach((program, index) => {
    if (getCode(program, loaded) !== codes[index]) {
      throw new Error(`${program.fileName} compiles otherwise on the package files that it reads`);
    }
  });
  return loaded;
};

// The files, read once a process.
let packageFileMap: Map<string, string> | undefined;
const getPackageFiles = () => (packageFileMap ??= readPackageFiles());

const packageFiles = (): Plugin => ({
  name: "package-files",
  resolveId: (id) => (id === PACKAGE_FILES ? `\0${PACKAGE_FILES}` : undefined),
  load: (id) =>
    id === `\0${PACKAGE_FILES}`
      ? `export default new Map(${JSON.stringify([...getPackageFiles()])});`
      : undefined,
});

const TYPESCRIPT_LIBRARIES = "virtual:typescript-libraries";

// Every declaration file of TypeScript's library, as a project's options may name any of them, as its
// target's default library does.
const getLibraries = (directory: string) =>
  new Map(
    readdirSync(directory)
      .filter((fileName) => /^lib\..*\.d\.ts$/.test(fileName))
      .sort()
      .map((fileName) => [fileName, readFileSync(join(directory, fileName), "utf8")]),
  );

const typescriptLibraries = (): Plugin => ({
  name: "typescript-libraries",
  resolveId: (id) => (id === TYPESCRIPT_LIBRARIES ? `\0${TYPESCRIPT_LIBRARIES}` : undefined),
  load: (id) =>
    id === `\0${TYPESCRIPT_LIBRARIES}`
      ? `export default new Map(${JSON.stringify([
          ...getLibraries(dirname(typescript.getDefaultLibFilePath({}))),
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
const ROUTES = ["/playground"];
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
    outlines(),
    compilations(),
    typescriptLibraries(),
    packageFiles(),
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
  worker: { format: "es", plugins: () => [typescriptLibraries(), packageFiles()] },
});
