import ts from "@typescript/typescript6";
import { joinPath } from "./common-js";

interface DirectoryEntries {
  files: string[];
  directories: string[];
}

// HACK: TypeScript's own matching of a directory's files to a project's include and exclude
// patterns, which its system's readDirectory runs, and which its types leave out.
const matchFiles: (
  path: string,
  extensions: readonly string[] | undefined,
  excludes: readonly string[] | undefined,
  includes: readonly string[] | undefined,
  useCaseSensitiveFileNames: boolean,
  currentDirectory: string,
  depth: number | undefined,
  getFileSystemEntries: (path: string) => DirectoryEntries,
  realpath: (path: string) => string,
) => string[] = Reflect.get(ts, "matchFiles");

// The files and the environment that a program runs on, as Node runs it: the host's own, where the
// host has a file system, or, for a host without one, such as a browser, the texts of the files
// that it holds, by absolute path, in a Node that runs from / in an empty environment.
export interface ProgramSystem {
  // Whether the files are the host's own, which Node's resolution finds where Node runs.
  isHost: boolean;
  useCaseSensitiveFileNames: boolean;
  fileExists: (path: string) => boolean;
  directoryExists: (path: string) => boolean;
  getDirectories: (path: string) => string[];
  // The files under a directory that a project's include and exclude patterns match, as
  // TypeScript's system reads them for a tsconfig.json.
  readDirectory: (
    path: string,
    extensions?: readonly string[],
    excludes?: readonly string[],
    includes?: readonly string[],
    depth?: number,
  ) => string[];
  readFile: (path: string) => string | undefined;
  realpath: (path: string) => string;
  resolvePath: (path: string) => string;
  getCurrentDirectory: () => string;
  getEnvironmentVariable: (name: string) => string | undefined;
}

// The host's files, through TypeScript's system, and the environment of the process.
export const getHostSystem = (): ProgramSystem => {
  const system = ts.sys;
  return {
    isHost: true,
    useCaseSensitiveFileNames: system.useCaseSensitiveFileNames,
    fileExists: system.fileExists,
    directoryExists: system.directoryExists,
    getDirectories: system.getDirectories,
    readDirectory: system.readDirectory,
    readFile: (path) => system.readFile(path),
    realpath: (path) => system.realpath?.(path) ?? path,
    resolvePath: system.resolvePath,
    getCurrentDirectory: system.getCurrentDirectory,
    getEnvironmentVariable: (name) => process.env[name],
  };
};

// The files of a program that a host passes, with the entry's text at its path, where the host has
// no file system to hold them or passes files in place of its own.
export const createMemorySystem = (
  files: ReadonlyMap<string, string>,
  entry: { fileName: string; source: string },
): ProgramSystem => {
  const texts = new Map(
    [...files, [entry.fileName, entry.source] as const].map((file) => [
      joinPath("/", file[0]),
      file[1],
    ]),
  );
  // Each directory's files and directories, by name, from the root's.
  const entries = new Map([["/", { files: new Set<string>(), directories: new Set<string>() }]]);
  for (const path of texts.keys()) {
    const segments = path.split("/").slice(1);
    segments.forEach((segment, index) => {
      const directory = `/${segments.slice(0, index).join("/")}`;
      const parent = entries.get(directory) ?? { files: new Set(), directories: new Set() };
      entries.set(directory, parent);
      (index === segments.length - 1 ? parent.files : parent.directories).add(segment);
    });
  }
  const resolveFromRoot = (path: string) => joinPath("/", path);
  return {
    isHost: false,
    useCaseSensitiveFileNames: true,
    fileExists: (path) => texts.has(resolveFromRoot(path)),
    directoryExists: (path) => entries.has(resolveFromRoot(path)),
    getDirectories: (path) => [...(entries.get(resolveFromRoot(path))?.directories ?? [])],
    readDirectory: (path, extensions, excludes, includes, depth) =>
      matchFiles(
        path,
        extensions,
        excludes,
        includes,
        true,
        "/",
        depth,
        (directory) => {
          const found = entries.get(resolveFromRoot(directory));
          return { files: [...(found?.files ?? [])], directories: [...(found?.directories ?? [])] };
        },
        resolveFromRoot,
      ),
    readFile: (path) => texts.get(resolveFromRoot(path)),
    realpath: resolveFromRoot,
    resolvePath: resolveFromRoot,
    getCurrentDirectory: () => "/",
    getEnvironmentVariable: () => undefined,
  };
};
