import type { PreparedModule } from "./tlc/order";
import type { Module } from "./ast";
import { TlaTypeScriptError } from "./errors";
import type { EscoreRuntime } from "./typescript/spec/prepare";

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
  preparedModules: PreparedModule[];
}

// ESCore's runtime, which a process prepares once for every program it compiles.
let escoreRuntime: EscoreRuntime | undefined;

// ESCore's runtime, prepared from ESCore's directory beside the package's sources. ESCore's host
// runs on Node's vm, which a browser lacks.
export const getEscoreRuntime = async () => {
  const path = globalThis.process?.getBuiltinModule?.("node:path");
  if (path === undefined) {
    throw new TlaTypeScriptError("tla-ts can't compile TypeScript outside Node yet");
  }
  const prepare = await import("./typescript/spec/prepare");
  escoreRuntime ??= prepare.prepareRuntime(path.join(import.meta.dirname, "../ecmascript"));
  return escoreRuntime;
};

// Compiles a TypeScript or JavaScript file into a spec by specializing ESCore. The TypeScript
// compiler takes a while to load, so only compiling loads it.
export const compile = async (options: CompileOptions): Promise<CompiledSpec> => {
  const runtime = await getEscoreRuntime();
  const api = await import("./typescript/spec/api");
  return api.compileEscore(options, runtime);
};
