import type { Definition, Module } from "../../ast";
import { parseConfig } from "../../config";
import { createEnvironment } from "../../environment";
import { TlaError } from "../../errors";
import { evaluateStartupDefinitions, getStartupValue } from "../../evaluate";
import type { OperatorLevels } from "../../levels";
import { tokenize } from "../../lexer";
import { parseModuleTokens } from "../../parser";
import { createCheckEnvironment } from "../../search";
import { getParsedTexts, type PreparedModule } from "../../tlc/order";
import { getRankedStrings, type Value } from "../../values";
import { getPreparedFacts } from "../../dependencies";
import { createModuleView } from "../../module-view";
import { assembleRuntime, createLibrary, type Family, getDependencies, HOOKS } from "./library";
import {
  getHostDefinitions,
  getHostOnlyGlobals,
  getHostOnlyKeys,
  getRealmDefinitions,
  INTERPRETER,
  RUNTIME_DEFINITIONS,
} from "./runtime";

interface Stub {
  name: string;
  arity: number;
}

// A group of ESCore's parts that a program's spec leaves out when its program names none of the
// group's triggers: the group's operators that the spec stops at in their place, and the operators
// of other groups' stubs that the group's own operators name, which a spec with the group keeps.
export interface Gate {
  group: string;
  triggers: ReadonlySet<string>;
  stubs: Stub[];
  reached: string[];
}

export interface EscoreRuntime {
  // The modules that the runtime extends, which every program's spec links whole.
  modules: PreparedModule[];
  // The runtime with the definitions that a text reads, and the leaves given without what they
  // read.
  getView: (text: string, leaves: readonly string[]) => PreparedModule;
  families: Family[];
  gates: Gate[];
  // The property keys that the runtime's own operators get or call.
  internalKeys: ReadonlySet<string>;
  // The runtime's steps that take a result as their last parameter and, where it suspends, pass it
  // on with a frame that ResumeFrame resumes.
  resumableSteps: ReadonlySet<string>;
  // The host's globals and built-in keys that ESCore's realm lacks, at whose names a compile stops.
  hostOnlyGlobals: string[];
  hostOnlyKeys: string[];
}

// Every compiled spec's root module. It extends each module of the runtime before the program's,
// so that the strings of the runtime come first in TLC's order of strings for every program, and
// what the runtime's definitions evaluate to as a check starts is the same for every program. Its
// text is the same for every program too, as TLC ranks the strings of the root's tokens first: the
// program's code declares the variables and defines Init and Next.
export const ROOT = `---- MODULE Program ----
EXTENDS Naturals, Integers, Sequences, FiniteSets, TLC, ESBigNat, ESNumber, ESRuntime, ProgramCode
====
`;

// The variable and the steps of a script's spec, whose Init runs the script and whose Next leaves
// it as it ends.
export const SCRIPT_STEPS = `VARIABLE programDone
Init ==
  LET r == ApplyTo(RunProgram, InitialState) IN
  /\\ IF r.c.type = "throw" THEN PrintT(ApplyTo(DescribeResult, r)) /\\ Assert(FALSE, "the script threw an exception") ELSE TRUE
  /\\ programDone = TRUE
Next == UNCHANGED programDone`;

// The program's code is ProgramCode's, which the config puts in place of the runtime's hooks.
export const CONFIG = `INIT Init
NEXT Next
CONSTANTS None = None Empty = Empty Absent = Absent
${[...HOOKS.keys()].map((hook) => `CONSTANT ${hook} <- Program${hook}`).join("\n")}
`;

// A program with no code, with which the runtime is checked and started.
const EMPTY_PROGRAM = [
  "---- MODULE ProgramCode ----",
  "EXTENDS ESRuntime",
  ...[...HOOKS].map(
    (hook) => `Program${hook[0]}(${hook[1]}) == Assert(FALSE, "a program without code")`,
  ),
  "RunProgram(s) == Ok(s, Undefined)",
  SCRIPT_STEPS,
  "====",
  "",
].join("\n");

// The realm's tables and what building them runs, which a program's spec keeps whole, so that a
// program sees every property the realm has, even of the built-ins it can't run.
const REALM_ROOTS = "InitialState Intrinsics RealmProperties IntrinsicIndex";

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

// ESCore's runtime, read, checked by SANY's checks, and started once for every program a process
// compiles: its modules, the levels of their definitions, and what their definitions without
// parameters evaluate to, among them the realm.
export const prepareRuntime = (directory: string): EscoreRuntime => {
  const library = createLibrary(directory);
  const overrides = [
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
      text: (library.definitions.get("InitialState")?.text ?? "")
        .replace("HeapOf(IntrinsicObjects(0, 1))", "InitialObjects")
        .replace(
          "jobs |-> <<>>,",
          "jobs |-> <<>>, timers |-> <<>>, written |-> FALSE, writeMark |-> [objects |-> 0, environments |-> 0],",
        ),
    },
    {
      name: "DescribeResult",
      arity: 1,
      text: "DescribeResult(r) == DescribeThrown(r.s, r.c.value)",
    },
  ];
  const runtimeText = assembleRuntime(library, overrides, INTERPRETER);
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
  const accepted = modules.map((prepared) => ({
    ...prepared,
    levels: levels.get(prepared.module),
  }));
  const started = createCheckEnvironment(
    config,
    {
      source: ROOT,
      loadModule: (name) => (name === "ProgramCode" ? EMPTY_PROGRAM : undefined),
      preparedModules: accepted,
    },
    () => {},
  ).specification;
  evaluateStartupDefinitions(started.startupDefinitions, started.environment);
  // The strings of the values, some of which only evaluating them makes, keep their order in a
  // check that ranks every string the runtime ranked as it started before any of a program's.
  const strings = getRankedStrings();
  const [numbers, bigNats, runtime] = accepted.map((prepared) => ({
    ...prepared,
    texts: prepared.name === "ESRuntime" ? { parsed: strings, strings: [] } : prepared.texts,
    values: new Map(
      prepared.module.definitions.flatMap((definition): [Definition, Value][] => {
        const value = getStartupValue(definition, started.environment);
        return value === undefined ? [] : [[definition, value]];
      }),
    ),
  }));
  // The facts of each definition, of the runtime as its views stand in its values, collected in
  // the check that started it, whose variables, constants, and builtins every program's has.
  const getFacts = (definitions: readonly Definition[]) =>
    new Map(
      definitions.map((definition) => [
        definition.name,
        getPreparedFacts(definition, started.environment, started.environment.facts.words),
      ]),
    );
  const getView = createModuleView({
    ...runtime,
    facts: getFacts(
      createModuleView(runtime)(
        runtime.module.definitions.map((definition) => definition.name).join(" "),
      ).module.definitions,
    ),
  });
  const realm = new Set(
    getView(REALM_ROOTS).module.definitions.map((definition) => definition.name),
  );
  // An operator of a gated group on its objects, which the realm's tables don't run, other than a
  // test of an object's class.
  const stubs = [...library.definitions.values()].filter(
    (definition) =>
      library.triggers.has(definition.group) &&
      definition.isStateful &&
      !/^(?:Is|Has)[A-Z]/.test(definition.name) &&
      !realm.has(definition.name),
  );
  const stubGroups = new Map(stubs.map((stub) => [stub.name, stub.group]));
  return {
    modules: [numbers, bigNats].map((prepared) => ({
      ...prepared,
      facts: getFacts(prepared.module.definitions),
    })),
    getView,
    families: library.families,
    internalKeys: library.internalKeys,
    resumableSteps: new Set(
      [...(library.definitions.get("ResumeFrame")?.text ?? "").matchAll(/frame\.step = "(\w+)"/g)]
        .map((match) => match[1])
        .filter((name) => overrides.every((override) => override.name !== name)),
    ),
    gates: [...library.triggers].map((entry) => ({
      group: entry[0],
      triggers: entry[1],
      stubs: stubs
        .filter((stub) => stub.group === entry[0])
        .map((stub) => ({ name: stub.name, arity: stub.arity })),
      reached: [
        ...new Set(
          [...library.definitions.values()]
            .filter((definition) => definition.group === entry[0])
            .flatMap((definition) =>
              getDependencies(definition.text).filter((name) => {
                const group = stubGroups.get(name);
                return group !== undefined && group !== entry[0];
              }),
            ),
        ),
      ],
    })),
    hostOnlyGlobals: getHostOnlyGlobals(library),
    hostOnlyKeys: getHostOnlyKeys(library),
  };
};
