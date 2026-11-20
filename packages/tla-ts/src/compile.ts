import type { PreparedModule } from "./tlc/order";
import type { Module } from "./ast";
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

// ESCore's runtime, which a process prepares once for every program it compiles on ESCore.
let escoreRuntime: EscoreRuntime | undefined;

// TLA_TS_ESCORE, a switch for tla-ts's own tests, compiles by specializing ESCore instead, from
// ESCore's directory beside the package's sources.
const compileOnEscore = async (options: CompileOptions) => {
  const [api, prepare] = await Promise.all([
    import("./typescript/spec/api"),
    import("./typescript/spec/prepare"),
  ]);
  escoreRuntime ??= prepare.prepareRuntime(
    process.getBuiltinModule("node:path").join(import.meta.dirname, "../ecmascript"),
  );
  return api.compileEscore(options, escoreRuntime);
};

// The TypeScript compiler takes a while to load, so only compiling loads it.
export const compile = async (options: CompileOptions): Promise<CompiledSpec> => {
  if (globalThis.process?.env.TLA_TS_ESCORE !== undefined) return compileOnEscore(options);
  const [typescript, program] = await Promise.all([
    import("./typescript/compile"),
    import("./typescript/program"),
  ]);
  const compiled = typescript.compile(
    options.source,
    options.fileName,
    options.libraries === undefined ? undefined : program.createLibrary(options.libraries),
  );
  return {
    name: compiled.name,
    source: compiled.source,
    config: compiled.config,
    loadModule: compiled.loadModule,
    preparedModules: compiled.preparedModules,
  };
};
