import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
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

export const getModuleName = (specPath: string) => basename(specPath, ".tla");
