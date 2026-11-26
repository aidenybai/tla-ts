import type { PreparedModule } from "./tlc/order";
import type { Module } from "./ast";
import { TlaTypeScriptError } from "./errors";
import type { JsTlaRuntime } from "./typescript/spec/prepare";

export interface CompileOptions {
  source: string;
  fileName?: string;
  // TypeScript's built-in declaration files, such as lib.es5.d.ts, by file name. A browser has no
  // disk to read them from, so it passes them here.
  libraries?: ReadonlyMap<string, string>;
  // The files that the program runs on in place of the host's, by absolute path, as Node runs it
  // from / in an empty environment. A browser has no disk, so it passes the packages a program
  // imports here.
  files?: ReadonlyMap<string, string>;
}

export interface CompiledSpec {
  name: string;
  source: Module;
  config: string;
  loadModule: (name: string) => string | undefined;
  preparedModules: PreparedModule[];
}

// JS.tla's runtime, which a process prepares once for every program it compiles.
let jsTlaRuntime: JsTlaRuntime | undefined;

// JS.tla's runtime, prepared from JS.tla's directory beside the package's sources. JS.tla's host
// runs on Node's vm, which a browser lacks.
export const getJsTlaRuntime = async () => {
  const path = globalThis.process?.getBuiltinModule?.("node:path");
  if (path === undefined) {
    throw new TlaTypeScriptError("tla-ts can't compile TypeScript outside Node yet");
  }
  const prepare = await import("./typescript/spec/prepare");
  jsTlaRuntime ??= prepare.prepareRuntime(path.join(import.meta.dirname, "../ecmascript"));
  return jsTlaRuntime;
};

// Compiles a TypeScript or JavaScript file into a spec by specializing JS.tla. The TypeScript
// compiler takes a while to load, so only compiling loads it.
export const compile = async (options: CompileOptions): Promise<CompiledSpec> => {
  const runtime = await getJsTlaRuntime();
  const api = await import("./typescript/spec/api");
  return api.compileJsTla(options, runtime);
};
