import ts from "@typescript/typescript6";
import { TlaTypeScriptError } from "../../errors";
import type { PreparedModule } from "../../tlc/order";
import { foldNames, getCallBuiltin, HOOKS } from "./library";
import { CONFIG, type EscoreRuntime, ROOT } from "./prepare";
import { LOCALE_METHODS } from "./runtime";
import { specialize } from "./specialize";

export interface EscoreSpec {
  name: string;
  source: string;
  config: string;
  loadModule: (name: string) => string | undefined;
  preparedModules: PreparedModule[];
}

interface CodeDefinition {
  name: string;
  arity: number;
  text: string;
}

// A program's definitions with each one whose text is another's but for its name and the names of
// definitions merged before it merged into the first, and with each literal sequence of numbers,
// such as a name's code units, a definition of its own, so that a check reads each one once.
const compact = (definitions: readonly CodeDefinition[]) => {
  const merged = new Map<string, string>();
  const firsts = new Map<string, string>();
  const rename = (text: string) =>
    text.replace(/\b[A-Za-z_][A-Za-z0-9_]*\b/g, (name) => merged.get(name) ?? name);
  for (const definition of definitions) {
    const key = `${definition.arity} ${rename(definition.text).slice(definition.name.length)}`;
    const first = firsts.get(key);
    if (first === undefined) firsts.set(key, definition.name);
    else merged.set(definition.name, first);
  }
  const sequences = new Map<string, string>();
  const kept = definitions
    .filter((definition) => !merged.has(definition.name))
    .map((definition) => ({
      ...definition,
      text:
        definition.name === "SourceText"
          ? definition.text
          : rename(definition.text).replace(/<<\d+(?:, \d+){2,}>>/g, (sequence) => {
              const name = sequences.get(sequence) ?? `Units${sequences.size + 1}`;
              sequences.set(sequence, name);
              return name;
            }),
    }));
  return [
    ...[...sequences].map((entry) => ({
      name: entry[1],
      arity: 0,
      text: `${entry[1]} == ${entry[0]}`,
    })),
    ...kept,
  ];
};

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
  const isIncluded = (gate: EscoreRuntime["gates"][number]) =>
    [...gate.triggers].some((word) => program.words.has(word));
  const included = runtime.gates.filter(isIncluded);
  const kept = new Set(included.flatMap((gate) => gate.reached));
  // The operators of the groups that the program names none of the triggers of.
  const leaves = runtime.gates
    .filter((gate) => !isIncluded(gate))
    .flatMap((gate) => gate.stubs)
    .filter((stub) => !kept.has(stub.name));
  const leftOut = new Set(
    runtime.gates.filter((gate) => !isIncluded(gate)).map((gate) => gate.group),
  );
  const definitions = compact(
    [
      ...program.definitions,
      {
        name: "RunProgram",
        arity: 1,
        text: isQueuing
          ? "RunProgram(s) == LET p == Program(s) IN IF IsAbrupt(p) THEN p ELSE RunJobs(p.s)"
          : "RunProgram(s) == Program(s)",
      },
      {
        name: "CallBuiltin",
        arity: 6,
        text: getCallBuiltin(
          "CallBuiltin",
          runtime.families.filter((family) => !leftOut.has(family.group)),
          LOCALE_METHODS,
        ),
      },
    ].map((definition) => ({
      name: HOOKS.has(definition.name) ? `Program${definition.name}` : definition.name,
      arity: definition.arity,
      text: foldNames(
        definition.text.replace(
          /\b(?:CallCode|LoopIteration|CallBuiltin)\b/g,
          (name) => `Program${name}`,
        ),
      ),
    })),
  );
  const code = definitions.map((definition) => definition.text).join("\n");
  const view = runtime.getView(
    `${code}\n${ROOT}\n${CONFIG}`,
    leaves.map((leaf) => leaf.name),
  );
  const viewed = new Set(view.module.definitions.map((definition) => definition.name));
  const stubs = leaves.filter((leaf) => viewed.has(leaf.name));
  const module = [
    "---- MODULE ProgramCode ----",
    "EXTENDS ESRuntime",
    ...definitions
      .filter((definition) => definition.arity > 0)
      .map(
        (definition) =>
          `RECURSIVE ${definition.name}(${Array.from({ length: definition.arity }, () => "_").join(", ")})`,
      ),
    code,
    ...stubs.map(
      (stub) =>
        `Stub${stub.name}(${Array.from({ length: stub.arity }, (_, index) => `p${index + 1}`).join(", ")}) == Assert(FALSE, "tla-ts can't run ${stub.name}, which this program's spec leaves out of ESCore")`,
    ),
    "====",
    "",
  ].join("\n");
  return {
    name: "Program",
    source: ROOT,
    config: [CONFIG, ...stubs.map((stub) => `CONSTANT ${stub.name} <- Stub${stub.name}`), ""].join(
      "\n",
    ),
    loadModule: (name) => (name === "ProgramCode" ? module : undefined),
    preparedModules: [...runtime.modules, view],
  };
};
