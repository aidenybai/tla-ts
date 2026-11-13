import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Module } from "../ast";
import { UNSETTLED_AWAIT_WARNING } from "../exit-codes";

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

// Node's warning for a script that a top-level await leaves unsettled, from the Assert that the
// script fails there.
export const getUnsettledAwaitWarning = (message: string) => {
  const quoted = message.split(`\n"${UNSETTLED_AWAIT_WARNING}`).at(1);
  return quoted === undefined
    ? undefined
    : `Warning: ${UNSETTLED_AWAIT_WARNING}${quoted.slice(0, -1).replace(/\\(.)/g, (_, character: string) => TLC_ESCAPES.get(character) ?? character)}\n\n\n\n`;
};

export const compileTypeScriptFile = async (path: string): Promise<CompiledInput> => {
  // The TypeScript compiler takes a while to load, so only a TypeScript input loads it.
  const compiled = (await import("../typescript/compile")).compile(
    readFileSync(path, "utf8"),
    path,
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
