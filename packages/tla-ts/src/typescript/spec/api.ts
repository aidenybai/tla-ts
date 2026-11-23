import ts from "@typescript/typescript6";
import type { CompiledSpec, CompileOptions } from "../../compile";
import { parseModule } from "../../parser";
import { isScript } from "../context";
import { isEsModule } from "../exceptions";
import { createLibrary } from "../program";
import { compileToEscore } from "./compile";
import { foldNames } from "./library";
import { compileModelToEscore } from "./model";
import type { EscoreRuntime } from "./prepare";

// The steps of a script's spec as the API checks it: the spec declares no variable, as today's
// compiler's does, so that a script that throws fails the check as it starts, with the message of
// the error it threw, or the thrown value as a string, and one that leaves a promise rejected with
// no handler fails with today's message for it.
const SCRIPT_STEPS =
  foldNames(String.raw`ScriptCharacter == [u \in {CharacterUnits[c] : c \in DOMAIN CharacterUnits} |-> CHOOSE c \in DOMAIN CharacterUnits : CharacterUnits[c] = u]
RECURSIVE ScriptText(_)
ScriptText(units) ==
  IF units = <<>> THEN ""
  ELSE IF Head(units) \notin DOMAIN ScriptCharacter THEN Assert(FALSE, "tla-ts can't show a string of a character TLA+ strings lack")
  ELSE ScriptCharacter[Head(units)] \o ScriptText(Tail(units))
ScriptThrownText(r) ==
  LET v == r.c.value
      m == IF IsObject(v) THEN Get(r.s, v, SV("message")) ELSE Ok(r.s, Undefined)
      t == IF ~IsAbrupt(m) /\ IsString(Val(m)) THEN m ELSE ToStr(r.s, v)
  IN IF ~IsAbrupt(t) /\ IsString(Val(t)) THEN ScriptText(Val(t).value) ELSE "a value that isn't a string"
vars == <<>>
Init ==
  LET r == ApplyTo(RunProgram, InitialState) IN
  CASE r.c.type # "throw" -> TRUE
    [] r.c.target # Empty /\ r.c.target.kind = "rejection" -> Assert(FALSE, "A promise rejected with no handler")
    [] OTHER -> Assert(FALSE, ScriptThrownText(r))
Next == FALSE
Spec == Init /\ [][Next]_vars`);

// A declaration at the top level of the file, by where its text is, with the definitions of the
// program's code that it compiles to.
export interface SourceRegion {
  name: string;
  start: number;
  end: number;
  definitions: string[];
}

export interface EscoreCompiled extends CompiledSpec {
  regions: SourceRegion[];
}

// What compile gives on ESCore: a script's spec, which runs it as Node does, or a model's, whose
// steps call its exported functions, whose frame TypeScript's types give with its declaration
// files, parsed once in library by a host that compiles many models. A host without a file
// system, such as a browser, has no package.json to name a file's type, so it loads the file as
// Node loads one without: an ES module or CommonJS by its extension, and else by its syntax.
export const compileEscore = (
  options: CompileOptions,
  runtime: EscoreRuntime,
  library = options.libraries === undefined ? undefined : createLibrary(options.libraries),
): EscoreCompiled => {
  const fileName = options.fileName ?? "spec.ts";
  const sourceFile = ts.createSourceFile(fileName, options.source, ts.ScriptTarget.ESNext, true);
  // A module whose exported functions the model calls none of runs as a script.
  const model = isScript(sourceFile)
    ? undefined
    : compileModelToEscore(options.source, fileName, runtime, library);
  const isScriptFile = model === undefined || model.isScript;
  const spec =
    model !== undefined && !model.isScript
      ? model
      : compileToEscore(
          options.source,
          fileName,
          runtime,
          ts.sys === undefined || isEsModule(sourceFile),
          { steps: SCRIPT_STEPS, entries: [] },
        );
  return {
    name: spec.name,
    source: parseModule(spec.source),
    // A spec without variables has a next-state action that TLC reads only within a formula.
    config: isScriptFile
      ? spec.config.replace("INIT Init\nNEXT Next", "SPECIFICATION Spec")
      : spec.config,
    loadModule: spec.loadModule,
    preparedModules: spec.preparedModules,
    // The program's code is of the file as tla-ts rewrote it, so a region finds its declaration in
    // the file's own text by the first name it declares.
    regions: spec.regions.flatMap((region) => {
      const declaration = sourceFile.statements.find((statement) =>
        ts.isVariableStatement(statement)
          ? statement.declarationList.declarations.some(
              (declared) =>
                ts.isIdentifier(declared.name) && declared.name.text === region.names[0],
            )
          : (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) &&
            statement.name?.text === region.names[0],
      );
      return declaration === undefined
        ? []
        : [
            {
              name: region.names[0],
              start: declaration.getStart(),
              end: declaration.end,
              definitions: region.definitions,
            },
          ];
    }),
  };
};
