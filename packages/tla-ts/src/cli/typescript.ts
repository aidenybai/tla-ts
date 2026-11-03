import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";

// A spec tla-ts compiled from the TypeScript file at path. specPath is where its module would be
// if it were a file, though tla-ts checks it without writing one.
export interface CompiledInput {
  path: string;
  specPath: string;
  source: string;
  config: string;
}

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
  };
};
