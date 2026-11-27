import ts from "@typescript/typescript6";
import type { CompiledSpec, CompileOptions } from "../../compile";
import { parseModule } from "../../parser";
import { isScript } from "../context";
import { isEsModule } from "../exceptions";
import { createLibrary } from "../program";
import { createMemorySystem, getHostSystem } from "../system";
import { compileToJsTla } from "./compile";
import { foldNames } from "./library";
import { compileModelToJsTla } from "./model";
import type { JsTlaRuntime } from "./prepare";

// The steps of a script's spec as the API checks it: the spec keeps one state, the script's end, as
// the CLI's does, so that a check of a script that ends reports that state rather than none. A
// script that throws fails the check as it starts, with the message of the error it threw, or the
// thrown value as a string, and one that leaves a promise rejected with no handler fails with
// today's message for it.
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
VARIABLE programDone
vars == <<programDone>>
Init ==
  LET r == ApplyTo(RunProgram, InitialState) IN
  /\ CASE r.c.type # "throw" -> TRUE
       [] r.c.target # Empty /\ r.c.target.kind = "rejection" -> Assert(FALSE, "A promise rejected with no handler")
       [] OTHER -> Assert(FALSE, ScriptThrownText(r))
  /\ programDone = TRUE
Next == UNCHANGED programDone
Spec == Init /\ [][Next]_vars`);

// A declaration at the top level of the file, by where its text is, with the definitions of the
// program's code that it compiles to.
export interface SourceRegion {
  name: string;
  start: number;
  end: number;
  definitions: string[];
}

export interface JsTlaCompiled extends CompiledSpec {
  regions: SourceRegion[];
}

// What compile gives on JS.tla: a script's spec, which runs it as Node does, or a model's, whose
// steps call its exported functions, whose frame TypeScript's types give with its declaration
// files, parsed once in library by a host that compiles many models. A program runs on the host's
// files, or on those that the options pass, with the file's own source at its path, as on a host
// without a file system, such as a browser, which loads the file by its extension, its package's
// type and its syntax, as Node loads a file.
export const compileJsTla = (
  options: CompileOptions,
  runtime: JsTlaRuntime,
  library = options.libraries === undefined ? undefined : createLibrary(options.libraries),
): JsTlaCompiled => {
  const fileName = options.fileName ?? "spec.ts";
  const sourceFile = ts.createSourceFile(fileName, options.source, ts.ScriptTarget.ESNext, true);
  const system =
    options.files === undefined && ts.sys !== undefined
      ? getHostSystem()
      : createMemorySystem(options.files ?? new Map(), { fileName, source: options.source });
  // A module whose exported functions the model calls none of runs as a script.
  const model = isScript(sourceFile)
    ? undefined
    : compileModelToJsTla(options.source, fileName, runtime, library, true, undefined, system);
  const isScriptFile = model === undefined || model.isScript;
  const spec =
    model !== undefined && !model.isScript
      ? model
      : compileToJsTla(
          options.source,
          fileName,
          runtime,
          !system.isHost || isEsModule(sourceFile),
          { steps: SCRIPT_STEPS, entries: [] },
          system,
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
