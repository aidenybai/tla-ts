import ts from "@typescript/typescript6";
import type { CompiledSpec, CompileOptions } from "../../compile";
import { parseModule } from "../../parser";
import { isModuleFile, isScript } from "../context";
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

// What compile gives on ESCore: a script's spec, which runs it as Node does, or a model's, whose
// steps call its exported functions, whose frame TypeScript's types give with its declaration
// files, parsed once in library by a host that compiles many models. A host without a file
// system, such as a browser, runs a file as an ES module only where its own syntax makes it one.
export const compileEscore = (
  options: CompileOptions,
  runtime: EscoreRuntime,
  library = options.libraries === undefined ? undefined : createLibrary(options.libraries),
): CompiledSpec => {
  const fileName = options.fileName ?? "spec.ts";
  const sourceFile = ts.createSourceFile(fileName, options.source, ts.ScriptTarget.ESNext, true);
  const spec = isScript(sourceFile)
    ? compileToEscore(
        options.source,
        fileName,
        runtime,
        ts.sys === undefined ? isModuleFile(sourceFile) : isEsModule(sourceFile),
        { steps: SCRIPT_STEPS, entries: [] },
      )
    : compileModelToEscore(options.source, fileName, runtime, library);
  return {
    name: spec.name,
    source: parseModule(spec.source),
    // A spec without variables has a next-state action that TLC reads only within a formula.
    config: isScript(sourceFile)
      ? spec.config.replace("INIT Init\nNEXT Next", "SPECIFICATION Spec")
      : spec.config,
    loadModule: spec.loadModule,
    preparedModules: spec.preparedModules,
  };
};
