import type { Module } from "../../ast";
import { parseConfig } from "../../config";
import { createEnvironment } from "../../environment";
import { TlaError } from "../../errors";
import type { OperatorLevels } from "../../levels";
import { tokenize } from "../../lexer";
import { parseModuleTokens } from "../../parser";
import { getParsedTexts, type PreparedModule } from "../../tlc/order";
import { assembleRuntime, createLibrary } from "./library";
import {
  getHostDefinitions,
  getHostOnlyGlobals,
  getHostOnlyKeys,
  getRealmDefinitions,
  INTERPRETER,
  LOCALE_METHODS,
  RUNTIME_DEFINITIONS,
} from "./runtime";

export interface EscoreRuntime {
  modules: PreparedModule[];
  // The host's globals and built-in keys that ESCore's realm lacks, at whose names a compile stops.
  hostOnlyGlobals: string[];
  hostOnlyKeys: string[];
}

// Every compiled spec's root module. It extends each module of the runtime before the program's,
// so that the strings of the runtime come first in TLC's order of strings for every program.
export const ROOT = `---- MODULE Program ----
EXTENDS Naturals, Integers, Sequences, FiniteSets, TLC, ESBigNat, ESNumber, ESRuntime, ProgramCode
VARIABLE programDone
Init ==
  LET r == ApplyTo(RunProgram, InitialState) IN
  /\\ IF r.c.type = "throw" THEN PrintT(ApplyTo(DescribeResult, r)) /\\ Assert(FALSE, "the script threw an exception") ELSE TRUE
  /\\ programDone = TRUE
Next == UNCHANGED programDone
====
`;

// The program's code is ProgramCode's, which the config substitutes for the runtime's constants.
export const CONFIG = `INIT Init
NEXT Next
CONSTANTS None = None Empty = Empty Absent = Absent CallCode <- ProgramCallCode LoopIteration <- ProgramLoopIteration
`;

// A program with no code, with which the runtime is checked and started.
const EMPTY_PROGRAM = `---- MODULE ProgramCode ----
EXTENDS ESRuntime
ProgramCallCode(s, f, ctx, args, id) == Unsupported(s, <<>>)
ProgramLoopIteration(s, ctx, loop, v) == Unsupported(s, <<>>)
RunProgram(s) == Ok(s, Undefined)
====
`;

const prepare = (name: string, text: string): PreparedModule => {
  const tokens = tokenize(text);
  return {
    name,
    text,
    tokens,
    module: parseModuleTokens(text, tokens),
    levels: undefined,
    texts: {
      parsed: [...new Set(getParsedTexts(tokens))],
      strings: [
        ...new Set(tokens.flatMap((token) => (token.kind === "String" ? [token.text] : []))),
      ],
    },
  };
};

const files = { readFile: undefined, writeFile: undefined, makeDirectory: undefined };

// ESCore's runtime, read and checked by SANY's checks once for every program a process compiles:
// its modules and the levels of their definitions.
export const prepareRuntime = (directory: string): EscoreRuntime => {
  const library = createLibrary(directory);
  const runtimeText = assembleRuntime(
    library,
    [
      ...RUNTIME_DEFINITIONS,
      ...getHostDefinitions(library),
      ...getRealmDefinitions(library),
      // The realm's first objects, which the runtime evaluates once, as it starts, rather than
      // deep in the realm's properties, where building them would take a deeper stack.
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
      {
        name: "DescribeResult",
        arity: 1,
        text: "DescribeResult(r) == DescribeThrown(r.s, r.c.value)",
      },
    ],
    INTERPRETER,
    LOCALE_METHODS,
  );
  const modules = [
    ...[...library.modules].map((entry) => prepare(entry[0], entry[1])),
    prepare("ESRuntime", runtimeText),
  ];
  const config = parseConfig(CONFIG);
  const levels = new Map<Module, (OperatorLevels | undefined)[]>();
  let warning: string | undefined;
  createEnvironment(config, {
    source: ROOT,
    loadModule: (name) => (name === "ProgramCode" ? EMPTY_PROGRAM : undefined),
    preparedModules: modules,
    onModuleLevels: (module, moduleLevels) => levels.set(module, moduleLevels),
    print: (text) => {
      warning ??= text;
    },
    files,
  });
  if (warning !== undefined)
    throw new TlaError(`SANY's checks warn of ESCore's runtime: ${warning}`);
  return {
    modules: modules.map((prepared) => ({ ...prepared, levels: levels.get(prepared.module) })),
    hostOnlyGlobals: getHostOnlyGlobals(library),
    hostOnlyKeys: getHostOnlyKeys(library),
  };
};
