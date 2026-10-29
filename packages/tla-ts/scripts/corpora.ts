import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { basename, dirname, join, relative } from "node:path";
import { getObligations } from "../src/obligations";

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

export const getCorpora = (): Corpus[] =>
  JSON.parse(readFileSync(join(CONFORMANCE_DIRECTORY, "corpora.json"), "utf8"));

const listFiles = (directory: string): string[] =>
  readdirSync(directory).flatMap((entry) => {
    const path = join(directory, entry);
    return statSync(path).isDirectory() ? listFiles(path) : [path];
  });

export const findModels = (): CorpusModel[] =>
  getCorpora().flatMap((corpus) => {
    const root = join(CORPORA_DIRECTORY, corpus.name);
    if (!existsSync(root)) return [];
    return corpus.paths
      .flatMap((path) => listFiles(join(root, path)))
      .filter((path) => path.endsWith(".cfg") && existsSync(path.replace(/\.cfg$/, ".tla")))
      .sort()
      .map((configPath) => ({
        id: `${corpus.name}/${relative(root, configPath)}`,
        directory: dirname(configPath),
        specPath: configPath.replace(/\.cfg$/, ".tla"),
        configPath,
      }));
  });

export interface CorpusModule {
  id: string;
  path: string;
}

export const findModules = (): CorpusModule[] =>
  getCorpora().flatMap((corpus) => {
    const root = join(CORPORA_DIRECTORY, corpus.name);
    if (!existsSync(root)) return [];
    return corpus.paths
      .flatMap((path) => listFiles(join(root, path)))
      .filter((path) => path.endsWith(".tla"))
      .sort()
      .map((path) => ({ id: `${corpus.name}/${relative(root, path)}`, path }));
  });

// tla2tools.jar ships these, and SANY reads a library's own copy of one, such as the Bags module in
// TLAPS, only when that library comes first on its path.
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

// The modules that the corpora extend from TLAPS and the Community Modules, by name.
export const getLibraryModules = () =>
  new Map(
    ["tlapm/library", "community/modules"]
      .flatMap((library) => listFiles(join(CORPORA_DIRECTORY, library)))
      .filter((path) => path.endsWith(".tla") && !STANDARD_MODULES.has(basename(path, ".tla")))
      .map((path): [string, string] => [basename(path, ".tla"), path])
      .reverse(),
  );

export const getModuleName = (specPath: string) => basename(specPath, ".tla");

const readModule = (path: string | undefined) =>
  path !== undefined && existsSync(path)
    ? { file: path, source: readFileSync(path, "utf8") }
    : undefined;

// The obligations of a corpus module, found the way tlapm finds modules: in the module's directory,
// then the -I library, then tlapm's own standard library. A submodule reports its own obligations,
// before the module that contains it.
export const getModuleObligations = (path: string, libraryModules: Map<string, string>) =>
  getObligations(
    [{ file: path, source: readFileSync(path, "utf8") }],
    (name) =>
      readModule(join(dirname(path), `${name}.tla`)) ??
      readModule(libraryModules.get(name)) ??
      readModule(join(CORPORA_DIRECTORY, "tlapm/library", `${name}.tla`)),
  ).flatMap((result) => result.obligations);
