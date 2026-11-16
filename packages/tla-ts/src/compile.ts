import type { Module } from "./ast";

export interface CompileOptions {
  source: string;
  fileName?: string;
  // TypeScript's built-in declaration files, such as lib.es5.d.ts, by file name. A browser has no
  // disk to read them from, so it passes them here.
  libraries?: ReadonlyMap<string, string>;
}

export interface CompiledSpec {
  name: string;
  source: Module;
  config: string;
  loadModule: (name: string) => string | undefined;
}

// The TypeScript compiler takes a while to load, so only compiling loads it.
export const compile = async (options: CompileOptions): Promise<CompiledSpec> => {
  const compiled = (await import("./typescript/compile")).compile(
    options.source,
    options.fileName,
    options.libraries,
  );
  return {
    name: compiled.name,
    source: compiled.source,
    config: compiled.config,
    loadModule: compiled.loadModule,
  };
};
