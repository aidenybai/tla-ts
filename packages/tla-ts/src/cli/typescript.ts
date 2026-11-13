import { readFileSync, realpathSync } from "node:fs";
import { dirname, join } from "node:path";
import { pathToFileURL } from "node:url";
import type { Module } from "../ast";
import {
  UNCAUGHT_EXCEPTION_EXIT_CODE,
  UNSETTLED_AWAIT_EXIT_CODE,
  UNSETTLED_AWAIT_WARNING,
} from "../exit-codes";

// A spec tla-ts compiled from the TypeScript file at path. specPath is where its module would be
// if it were a file, though tla-ts checks it without writing one.
export interface CompiledInput {
  path: string;
  specPath: string;
  source: Module;
  config: string;
  loadModule: (name: string) => string | undefined;
  isScript: boolean;
}

// The escapes of a string that TLC prints.
const TLC_ESCAPES = new Map([
  ["n", "\n"],
  ["t", "\t"],
]);

// What Node writes to stderr and the code it exits with, for the script at path whose spec fails an
// Assert with what Node reports: a top-level await that never settles, or a throw that nothing
// catches.
export const getNodeExit = (message: string, path: string) => {
  const quoted = message
    .split('The first argument of Assert evaluated to FALSE; the second argument was:\n"')
    .at(1);
  if (quoted === undefined) return undefined;
  const text = quoted
    .slice(0, -1)
    .replace(/\\(.)/g, (_, character: string) => TLC_ESCAPES.get(character) ?? character);
  if (text.startsWith(UNSETTLED_AWAIT_WARNING)) {
    return { code: UNSETTLED_AWAIT_EXIT_CODE, stderr: `Warning: ${text}\n\n\n\n` };
  }
  const realPath = realpathSync(path);
  return [`${realPath}:`, `${pathToFileURL(realPath).href}:`, "node:internal/"].some((prefix) =>
    text.replace(/^\n/, "").startsWith(prefix),
  )
    ? { code: UNCAUGHT_EXCEPTION_EXIT_CODE, stderr: `${text}\n\nNode.js ${process.version}\n` }
    : undefined;
};

export const compileTypeScriptFile = async (path: string): Promise<CompiledInput> => {
  // The TypeScript compiler takes a while to load, so only a TypeScript input loads it.
  const compiled = (await import("../typescript/compile")).compile(
    readFileSync(path, "utf8"),
    path,
    undefined,
    true,
  );
  return {
    path,
    specPath: join(dirname(path), `${compiled.name}.tla`),
    source: compiled.source,
    config: compiled.config,
    loadModule: compiled.loadModule,
    isScript: compiled.isScript,
  };
};
