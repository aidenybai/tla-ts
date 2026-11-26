import ts from "@typescript/typescript6";
import { joinPath } from "./common-js";

// The files and the environment that a program runs on, as Node runs it: the host's own, where the
// host has a file system, or, for a host without one, such as a browser, the texts of the files
// that it holds, by absolute path, in a Node that runs from / in an empty environment.
export interface ProgramSystem {
  // Whether the files are the host's own, which Node's resolution finds where Node runs.
  isHost: boolean;
  // Whether the entry is the only file, as where a host without a file system passes no others.
  isEntryAlone: boolean;
  fileExists: (path: string) => boolean;
  directoryExists: (path: string) => boolean;
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
    isEntryAlone: false,
    fileExists: system.fileExists,
    directoryExists: system.directoryExists,
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
  const directories = new Set(
    [...texts.keys()].flatMap((path) =>
      path
        .split("/")
        .slice(1, -1)
        .map((_segment, index, segments) => `/${segments.slice(0, index + 1).join("/")}`),
    ),
  );
  const resolveFromRoot = (path: string) => joinPath("/", path);
  return {
    isHost: false,
    isEntryAlone: texts.size === 1,
    fileExists: (path) => texts.has(resolveFromRoot(path)),
    directoryExists: (path) =>
      resolveFromRoot(path) === "/" || directories.has(resolveFromRoot(path)),
    readFile: (path) => texts.get(resolveFromRoot(path)),
    realpath: resolveFromRoot,
    resolvePath: resolveFromRoot,
    getCurrentDirectory: () => "/",
    getEnvironmentVariable: () => undefined,
  };
};
