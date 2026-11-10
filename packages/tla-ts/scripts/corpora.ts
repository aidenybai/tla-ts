import { spawn } from "node:child_process";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  symlinkSync,
  writeFileSync,
} from "node:fs";
import { basename, dirname, join, relative } from "node:path";

export interface Corpus {
  name: string;
  repository: string;
  commit: string;
  paths: string[];
}

export interface CorpusModel {
  id: string;
  directory: string;
  specPath: string;
  configPath: string;
}

export const CONFORMANCE_DIRECTORY = join(import.meta.dirname, "../tests/conformance");

export const CORPORA_DIRECTORY = join(CONFORMANCE_DIRECTORY, ".corpora");

export const EXPECTED_PATH = join(CONFORMANCE_DIRECTORY, "expected.json");

export const TLC_SEED = 4n;

export const MAIN_THREAD_STACK_MB = 1.15;

export const getCorpora = (): Corpus[] =>
  JSON.parse(readFileSync(join(CONFORMANCE_DIRECTORY, "corpora.json"), "utf8"));

export const listFiles = (directory: string): string[] =>
  readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });

export interface CorpusModule {
  id: string;
  path: string;
}

const findCorpusFiles = (isIncluded: (path: string) => boolean): CorpusModule[] =>
  getCorpora().flatMap((corpus) => {
    const root = join(CORPORA_DIRECTORY, corpus.name);
    if (!existsSync(root)) return [];
    return corpus.paths
      .flatMap((path) => listFiles(join(root, path)))
      .filter(isIncluded)
      .sort()
      .map((path) => ({ id: `${corpus.name}/${relative(root, path)}`, path }));
  });

export const findModels = (): CorpusModel[] =>
  findCorpusFiles(
    (path) => path.endsWith(".cfg") && existsSync(path.replace(/\.cfg$/, ".tla")),
  ).map((config) => ({
    id: config.id,
    directory: dirname(config.path),
    specPath: config.path.replace(/\.cfg$/, ".tla"),
    configPath: config.path,
  }));

export const findModules = () => findCorpusFiles((path) => path.endsWith(".tla"));

const STANDARD_MODULES = new Set([
  "Bags",
  "FiniteSets",
  "Integers",
  "Json",
  "Naturals",
  "Randomization",
  "RealTime",
  "Reals",
  "Sequences",
  "TLC",
  "TLCExt",
  "Toolbox",
]);

export const getLibraryModules = () =>
  new Map(
    ["tlapm/library", "community/modules"]
      .flatMap((library) => listFiles(join(CORPORA_DIRECTORY, library)))
      .filter((path) => path.endsWith(".tla") && !STANDARD_MODULES.has(basename(path, ".tla")))
      .map((path): [string, string] => [basename(path, ".tla"), path])
      .reverse(),
  );

export const LIBRARY_PATH = join(CONFORMANCE_DIRECTORY, ".library");

export const linkLibraryModules = () => {
  rmSync(LIBRARY_PATH, { recursive: true, force: true });
  mkdirSync(LIBRARY_PATH);
  getLibraryModules().forEach((path, name) => symlinkSync(path, join(LIBRARY_PATH, `${name}.tla`)));
};

export const getOption = (name: string) =>
  process.argv.includes(name) ? process.argv[process.argv.indexOf(name) + 1] : undefined;

export const getToolPath = (variable: string, tool: string) => {
  const path = process.env[variable];
  if (!path || !existsSync(path)) {
    console.error(`Set ${variable} to the path of ${tool}`);
    process.exit(1);
  }
  return path;
};

export const runProcess = (command: string, args: string[], directory: string) =>
  new Promise<{ exitCode: number | null; output: string }>((resolve) => {
    const child = spawn(command, args, { cwd: directory });
    const chunks: Buffer[] = [];
    child.stdout.on("data", (chunk: Buffer) => chunks.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => chunks.push(chunk));
    child.on("close", (exitCode) =>
      resolve({ exitCode, output: Buffer.concat(chunks).toString("utf8") }),
    );
  });

export const parseToolboxMessages = (output: string) =>
  output
    .split("@!!BEGIN\n")
    .slice(1)
    .map((block) => {
      const fields = new Map<string, string>();
      block
        .slice(0, block.indexOf("@!!END"))
        .split("\n@!!")
        .map((field, index) => (index === 0 ? field.replace(/^@!!/, "") : field))
        .forEach((field) => {
          const separator = field.indexOf(":");
          fields.set(field.slice(0, separator), field.slice(separator + 1));
        });
      return fields;
    });

export const runConcurrently = async <Item>(
  items: Item[],
  concurrency: number,
  work: (item: Item) => Promise<void>,
) => {
  const queue = [...items];
  await Promise.all(
    Array.from({ length: concurrency }, async () => {
      for (let item = queue.shift(); item !== undefined; item = queue.shift()) await work(item);
    }),
  );
};

export const sortById = <Result extends { id: string }>(results: Result[]) =>
  results.sort((left, right) => (left.id < right.id ? -1 : 1));

export const writeResults = (path: string, results: unknown[]) =>
  writeFileSync(path, `${JSON.stringify(results, null, 2)}\n`);

export const writeLines = (path: string, results: unknown[]) =>
  writeFileSync(path, `[\n${results.map((result) => JSON.stringify(result)).join(",\n")}\n]\n`);

export const reportModuleResults = (path: string, results: { verdict: string }[]) => {
  writeResults(path, results);
  console.log("");
  Map.groupBy(results, (result) => result.verdict).forEach((group, verdict) =>
    console.log(`${verdict}: ${group.length}`),
  );
  console.log(`modules: ${results.length} (${basename(path)} has the details)`);
};
