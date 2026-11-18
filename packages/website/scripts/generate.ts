import { globSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import typescript from "@typescript/typescript6";
import { printModule } from "../../tla-ts/src/printer";
import { compile } from "../../tla-ts/src/typescript/compile";
import { printRegions } from "../../tla-ts/src/typescript/regions";
import { createHighlighter } from "../src/highlighter";
import { LOGO_PATH } from "../src/logo";
import type {
  Benchmark,
  CompiledExample,
  ReferenceBlock,
  ReferenceSection,
} from "../src/site-data";

// Writes the modules under src/generated that the site imports: the compiled examples, the
// README's tables and code, the playground's files and outlines, and TypeScript's libraries.

const PACKAGE_DIRECTORY = join(import.meta.dirname, "..");
const GENERATED_DIRECTORY = join(PACKAGE_DIRECTORY, "src/generated");
const README_PATH = join(PACKAGE_DIRECTORY, "../../README.md");
const EXAMPLE_PATHS = [
  "./src/examples/likes.ts",
  "../tla-ts/tests/fixtures/typescript/cli/failing/overdraft.ts",
  "../tla-ts/tests/fixtures/typescript/examples/hour-clock/hour-clock.ts",
];
const PLAYGROUND_PATHS = [
  "./src/examples/counter.ts",
  "../tla-ts/tests/fixtures/typescript/examples/*/*.ts",
  "../tla-ts/tests/fixtures/typescript/cli/failing/overdraft.ts",
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
    modules: Object.fromEntries(
      compiled.source.extends.flatMap((name) => {
        const text = compiled.loadModule(name);
        return text === undefined ? [] : [[name, text]];
      }),
    ),
    typescript: highlight(typescript, "typescript"),
    tla: highlight(printModule(compiled.source).trim(), "tlaplus"),
    highlightNames: [...compiled.source.variables, ...compiled.source.definitions]
      .map((declared) => declared.name)
      .filter((name) => !GENERATED_NAMES.has(name)),
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

const getLibraries = (directory: string, fileName: string, libraries: Map<string, string>) => {
  if (libraries.has(fileName)) return libraries;
  const text = readFileSync(join(directory, fileName), "utf8");
  libraries.set(fileName, text);
  for (const match of text.matchAll(/<reference lib="([^"]+)"/g)) {
    getLibraries(directory, `lib.${match[1]}.d.ts`, libraries);
  }
  return libraries;
};

const LOGO_FILES = {
  "favicon.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-1 -1 11 11" shape-rendering="crispEdges"><style>path{fill:#21201c}@media(prefers-color-scheme:dark){path{fill:#eeeeec}}</style><path d="${LOGO_PATH}"/></svg>\n`,
  "logo-light.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 11" shape-rendering="crispEdges"><path fill="#21201c" d="${LOGO_PATH}"/></svg>\n`,
  "logo-dark.svg": `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 11" shape-rendering="crispEdges"><path fill="#eeeeec" d="${LOGO_PATH}"/></svg>\n`,
};

const getFileName = (path: string) => path.slice(path.lastIndexOf("/") + 1);

const write = (fileName: string, lines: string[]) =>
  writeFileSync(join(GENERATED_DIRECTORY, fileName), `${lines.join("\n")}\n`);

const highlight = await createHighlighter();
const readme = readFileSync(README_PATH, "utf8");
const examplePaths = EXAMPLE_PATHS.map((path) => join(PACKAGE_DIRECTORY, path));
const playgroundPaths = globSync(PLAYGROUND_PATHS, { cwd: PACKAGE_DIRECTORY }).map((path) =>
  join(PACKAGE_DIRECTORY, path),
);

mkdirSync(GENERATED_DIRECTORY, { recursive: true });
write("site-data.ts", [
  'import type { Benchmark, CompiledExample, ReferenceSection, Source } from "../site-data";',
  `export const examples: CompiledExample[] = ${JSON.stringify(examplePaths.map((path) => getExample(path, highlight)))};`,
  `export const benchmarks: Benchmark[] = ${JSON.stringify(getBenchmarks())};`,
  `export const prompt: string = ${JSON.stringify(PROMPT.exec(readme)?.groups?.prompt)};`,
  `export const install: Source = ${JSON.stringify(highlight("npm install tla-ts", "shellscript"))};`,
  `export const reference: ReferenceSection[] = ${JSON.stringify(getReference(highlight))};`,
]);
write("outlines.ts", [
  `export const outlines: Record<string, string> = ${JSON.stringify(
    Object.fromEntries(
      [...examplePaths, ...playgroundPaths].map((path) => [
        getFileName(path),
        getOutline(path, highlight),
      ]),
    ),
  )};`,
]);
write("playground-examples.ts", [
  `export const PLAYGROUND_EXAMPLES = ${JSON.stringify(
    playgroundPaths
      .map((path) => ({ fileName: getFileName(path), source: readFileSync(path, "utf8").trim() }))
      .toSorted(
        (left, right) =>
          Number(right.fileName === "counter.ts") - Number(left.fileName === "counter.ts") ||
          left.fileName.localeCompare(right.fileName),
      ),
  )};`,
]);
write("typescript-libraries.ts", [
  `export const libraries: ReadonlyMap<string, string> = new Map(${JSON.stringify([
    ...getLibraries(dirname(typescript.getDefaultLibFilePath({})), "lib.esnext.d.ts", new Map()),
  ])});`,
]);
for (const [fileName, contents] of Object.entries(LOGO_FILES)) {
  writeFileSync(join(PACKAGE_DIRECTORY, "public", fileName), contents);
}
