import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import type { TestMetadata } from "./test-file";

const PACKAGE_DIRECTORY = join(import.meta.dirname, "..");

// TypeScript 6.0.2, the version that tla-ts compiles with.
export const TYPESCRIPT_REVISION = "607a22a90d1a5a1b507ce01bb8cd7ec020f954e7";

export const TYPESCRIPT_DIRECTORY = join(PACKAGE_DIRECTORY, ".oracles/typescript");

// The codebases whose files tla-ts model checks, each with the directories that hold their sources.
export const CODEBASES: Record<string, { root: string; sources: string[] }> = {
  typescript: { root: TYPESCRIPT_DIRECTORY, sources: ["src"] },
  "tla-ts": { root: join(PACKAGE_DIRECTORY, "../tla-ts"), sources: ["src"] },
};

export const getCodebaseFile = (metadata: TestMetadata) => {
  const codebase = metadata.codebase === undefined ? undefined : CODEBASES[metadata.codebase];
  if (codebase === undefined || metadata.source === undefined) return undefined;
  return join(codebase.root, metadata.source);
};

// The codebase that holds a file, if any.
export const findCodebase = (file: string) =>
  Object.values(CODEBASES).find((codebase) => file.startsWith(`${codebase.root}/`));

// The directory of the tsconfig.json that a codebase's file belongs to.
export const findProject = (file: string, root: string): string | undefined => {
  const directory = dirname(file);
  if (existsSync(join(directory, "tsconfig.json"))) return directory;
  return directory === root || !directory.startsWith(root)
    ? undefined
    : findProject(directory, root);
};
