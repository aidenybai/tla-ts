import ts from "@typescript/typescript6";
import { TlaTypeScriptError } from "../../errors";
import { assembleModule, type Library } from "./library";
import { INTERPRETER, RUNTIME_DEFINITIONS } from "./runtime";
import { specialize } from "./specialize";

export interface EscoreSpec {
  name: string;
  source: string;
  config: string;
  loadModule: (name: string) => string | undefined;
}

// Compiles a TypeScript script to a spec whose Init runs it as ESCore runs a script: the realm,
// then the script, then the jobs it queued. An uncaught exception fails Init's assertion.
export const compileToEscore = (source: string, fileName: string, library: Library): EscoreSpec => {
  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.Preserve,
      useDefineForClassFields: true,
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
  const isQueuing = program.words.has("Promise") || program.words.has("then");
  const name = "Program";
  const module = assembleModule(
    library,
    name,
    [
      ...program.definitions,
      {
        name: "Init",
        arity: 0,
        text: [
          "Init ==",
          `  LET r == ${isQueuing ? "LET p == ApplyTo(Program, InitialState) IN IF IsAbrupt(p) THEN p ELSE ApplyTo(RunJobs, p.s)" : "ApplyTo(Program, InitialState)"} IN`,
          `  /\\ IF r.c.type = "throw" THEN PrintT(ApplyTo(DescribeResult, r)) /\\ Assert(FALSE, "the script threw an exception") ELSE TRUE`,
          "  /\\ programDone = TRUE",
        ].join("\n"),
      },
      {
        name: "DescribeResult",
        arity: 1,
        text: "DescribeResult(r) == DescribeThrown(r.s, r.c.value)",
      },
      { name: "Next", arity: 0, text: "Next == UNCHANGED programDone" },
    ],
    [
      ...RUNTIME_DEFINITIONS,
      // The realm's first objects, which the spec evaluates once, as it starts, rather than deep
      // in the realm's properties, where building them would take a deeper stack.
      {
        name: "InitialObjects",
        arity: 0,
        text: "InitialObjects == HeapOf(IntrinsicObjects(0, 1))",
      },
      {
        name: "InitialState",
        arity: 0,
        text: (library.definitions.get("InitialState")?.text ?? "").replace(
          "HeapOf(IntrinsicObjects(0, 1))",
          "InitialObjects",
        ),
      },
    ],
    program.words,
    INTERPRETER,
  );
  return {
    name,
    source: module.text,
    config: "INIT Init\nNEXT Next\nCONSTANTS None = None Empty = Empty Absent = Absent\n",
    loadModule: (moduleName) => library.modules.get(moduleName),
  };
};
