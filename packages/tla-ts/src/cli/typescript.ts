import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import type { Module } from "../ast";
import { compile } from "../compile";

// A spec tla-ts compiled from the TypeScript file at path. specPath is where its module would be
// if it were a file, though tla-ts checks it without writing one.
export interface CompiledInput {
  path: string;
  specPath: string;
  source: Module;
  config: string;
  loadModule: (name: string) => string | undefined;
}

export const compileTypeScriptFile = async (path: string): Promise<CompiledInput> => {
  const compiled = await compile({ source: readFileSync(path, "utf8"), fileName: path });
  return {
    path,
    specPath: join(dirname(path), `${compiled.name}.tla`),
    source: compiled.source,
    config: compiled.config,
    loadModule: compiled.loadModule,
  };
};
