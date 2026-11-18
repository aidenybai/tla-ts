import ts from "@typescript/typescript6";
import { TlaTypeScriptError } from "../../errors";
import type { PreparedModule } from "../../tlc/order";
import { foldNames } from "./library";
import { CONFIG, type EscoreRuntime, ROOT } from "./prepare";
import { specialize } from "./specialize";

export interface EscoreSpec {
  name: string;
  source: string;
  config: string;
  loadModule: (name: string) => string | undefined;
  preparedModules: PreparedModule[];
}

// The operators of the runtime that a program's code takes the place of, by the names that the
// config substitutes for them.
const HOOKS = new Map([
  ["CallCode", "ProgramCallCode"],
  ["LoopIteration", "ProgramLoopIteration"],
]);

// Compiles a TypeScript script to a spec whose Init runs it as ESCore runs a script: the realm,
// then the script, then the jobs it queued. An uncaught exception fails Init's assertion. The
// spec's module ProgramCode holds the script's code, and the runtime's prepared modules the rest.
export const compileToEscore = (
  source: string,
  fileName: string,
  runtime: EscoreRuntime,
): EscoreSpec => {
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.Preserve,
      useDefineForClassFields: true,
      // A script runs in strict mode only where it says so, which TypeScript 6 deprecates.
      alwaysStrict: false,
      ignoreDeprecations: "6.0",
    },
    fileName,
    reportDiagnostics: true,
  });
  const error = transpiled.diagnostics?.find(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error,
  );
  if (error !== undefined) {
    throw new TlaTypeScriptError(ts.flattenDiagnosticMessageText(error.messageText, "\n"));
  }
  const sourceFile = ts.createSourceFile(
    fileName.replace(/\.ts$/, ".js"),
    transpiled.outputText,
    ts.ScriptTarget.ESNext,
    true,
    ts.ScriptKind.JS,
  );
  const program = specialize(sourceFile);
  const hostOnly =
    runtime.hostOnlyGlobals.find((name) => program.identifiers.has(name)) ??
    runtime.hostOnlyKeys.find((key) => program.words.has(key));
  if (hostOnly !== undefined) {
    throw new TlaTypeScriptError(
      `tla-ts can't run the host's ${hostOnly}, which ESCore leaves out`,
    );
  }
  const isQueuing = program.words.has("Promise") || program.words.has("then");
  const definitions = [
    ...program.definitions,
    {
      name: "RunProgram",
      arity: 1,
      text: isQueuing
        ? "RunProgram(s) == LET p == Program(s) IN IF IsAbrupt(p) THEN p ELSE RunJobs(p.s)"
        : "RunProgram(s) == Program(s)",
    },
  ].map((definition) => ({
    name: HOOKS.get(definition.name) ?? definition.name,
    arity: definition.arity,
    text: foldNames(
      definition.text.replace(/\b(?:CallCode|LoopIteration)\b/g, (name) => HOOKS.get(name) ?? name),
    ),
  }));
  const code = [
    "---- MODULE ProgramCode ----",
    "EXTENDS ESRuntime",
    ...definitions
      .filter((definition) => definition.arity > 0)
      .map(
        (definition) =>
          `RECURSIVE ${definition.name}(${Array.from({ length: definition.arity }, () => "_").join(", ")})`,
      ),
    ...definitions.map((definition) => definition.text),
    "====",
    "",
  ].join("\n");
  return {
    name: "Program",
    source: ROOT,
    config: CONFIG,
    loadModule: (name) => (name === "ProgramCode" ? code : undefined),
    preparedModules: runtime.modules,
  };
};
