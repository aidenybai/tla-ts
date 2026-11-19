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
import { getPlainValues, getRankedStrings, readPlainValues, type Value } from "../../values";
import { getPreparedFacts } from "../../dependencies";
import { decodeGraph, encodeGraph, type EncodedGraph } from "../../graph-codec";
import { createModuleView } from "../../module-view";
import {
  assembleRuntime,
  createLibrary,
  type Family,
  getDependencies,
  HOOKS,
  type Library,
} from "./library";
import {
  getHostDefinitions,
  getHostOnlyGlobals,
  getHostOnlyProperties,
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
  hostOnlyModuleGlobals: string[];
  hostOnlyProperties: { owner: string; key: string; descriptor: PropertyDescriptor | undefined }[];
}

// Every compiled spec's root module. It extends each module of the runtime before the program's,
// so that the strings of the runtime come first in TLC's order of strings for every program, and
// what the runtime's definitions evaluate to as a check starts is the same for every program. Its
// text is the same for every program too, as TLC ranks the strings of the root's tokens first: the
// program's code declares the variables and defines Init and Next. TLC orders a record's fields as
// it ranks their names, and = compares the fields in that order, so RootOrder, which no spec reads,
// ranks a value's type before its value: = on two values of different types, such as a string and
// true, then finds the types unequal before it would compare a sequence with a boolean, and fail.
export const ROOT = `---- MODULE Program ----
EXTENDS Naturals, Integers, Sequences, FiniteSets, TLC, ESBigNat, ESNumber, ESRuntime, ProgramCode
RootOrder(r) == r.c.type = "throw"
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

// The definitions that the runtime puts in place of ESCore's, as a compiled spec runs them.
const getOverrides = (library: Library) => [
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
        "jobs |-> <<>>, timers |-> <<>>, required |-> <<>>, hostHandler |-> Empty, written |-> FALSE, writeMark |-> [objects |-> 0, environments |-> 0], hostImport |-> Empty,",
      ),
  },
  {
    name: "DescribeResult",
    arity: 1,
    // A thrown error whose message Node writes is described by nothing that reads it.
    text: `DescribeResult(r) ==
  IF IsObject(r.c.value) /\\ O(r.s, r.c.value).class = "error" /\\ "hostMessage" \\in DOMAIN O(r.s, r.c.value).slots
  THEN [name |-> <<>>, message |-> <<>>]
  ELSE DescribeThrown(r.s, r.c.value)`,
  },
];

// The names and texts of the modules of the runtime: those that ESCore extends, then the runtime.
const getModuleTexts = (library: Library) => [
  ...library.modules,
  ["ESRuntime", assembleRuntime(library, getOverrides(library), INTERPRETER)] as const,
];

// The modules of the texts, read, checked by SANY's checks, and started: each one's levels, the
// strings it ranks, what its definitions without parameters evaluate to, among them the realm, and
// the facts of its definitions, of the runtime's as its views stand in its values.
const prepareModules = (texts: readonly (readonly [string, string])[]): PreparedModule[] => {
  const modules = texts.map((entry) => prepare(entry[0], entry[1]));
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
  const getFacts = (definitions: readonly Definition[]) =>
    new Map(
      definitions.map((definition) => [
        definition.name,
        getPreparedFacts(definition, started.environment, started.environment.facts.words),
      ]),
    );
  return accepted.map((prepared) => {
    const isRuntime = prepared.name === "ESRuntime";
    const valued = {
      ...prepared,
      texts: isRuntime ? { parsed: strings, strings: [] } : prepared.texts,
      values: new Map(
        prepared.module.definitions.flatMap((definition): [Definition, Value][] => {
          const value = getStartupValue(definition, started.environment);
          return value === undefined ? [] : [[definition, value]];
        }),
      ),
    };
    const definitions = isRuntime
      ? createModuleView(valued)(
          valued.module.definitions.map((definition) => definition.name).join(" "),
        ).module.definitions
      : valued.module.definitions;
    return { ...valued, facts: getFacts(definitions) };
  });
};

// The prepared modules as a graph holds them, with the texts they were prepared from and each
// value a plain copy.
interface PreparedGraph {
  texts: string[];
  modules: (Omit<PreparedModule, "values"> & { values: Map<Definition, unknown> })[];
}

// The graph of the modules of the runtime of ESCore's directory, prepared, which a build writes
// into a bundle so that a process reads the modules rather than prepares them.
export const getRuntimeGraph = (directory: string) => {
  const texts = getModuleTexts(createLibrary(directory));
  const modules = prepareModules(texts);
  const entries = modules.map((prepared) => [...(prepared.values ?? [])]);
  const plain = getPlainValues(entries.flat().map((entry) => entry[1]));
  let position = 0;
  const graph: PreparedGraph = {
    texts: texts.map((entry) => entry[1]),
    modules: modules.map((prepared, index) => ({
      ...prepared,
      values: new Map(entries[index].map((entry) => [entry[0], plain[position++]])),
    })),
  };
  return encodeGraph(graph);
};

// The build writes the graph of the prepared runtime in place of these strings, its tables as JSON
// and its stream as it is. Unbuilt, the tables are JSON for a string.
const RUNTIME_TABLES = '"tla-ts:escore-tables"';
const RUNTIME_STREAM = "tla-ts:escore-stream";

// The modules that the build prepared, where it prepared them from the same texts.
const readPreparedModules = (texts: readonly string[]): PreparedModule[] | undefined => {
  const tables: unknown = JSON.parse(RUNTIME_TABLES);
  if (!Array.isArray(tables)) return undefined;
  const graph = decodeGraph({
    tables: tables as EncodedGraph["tables"],
    stream: RUNTIME_STREAM,
  }) as PreparedGraph;
  if (graph.texts.length !== texts.length || graph.texts.some((text, i) => text !== texts[i])) {
    return undefined;
  }
  const entries = graph.modules.map((prepared) => [...prepared.values]);
  const values = readPlainValues(entries.flat().map((entry) => entry[1]));
  let position = 0;
  return graph.modules.map((prepared, index) => ({
    ...prepared,
    values: new Map(entries[index].map((entry) => [entry[0], values[position++]])),
  }));
};

// ESCore's runtime, read, checked by SANY's checks, and started once for every program a process
// compiles, or read as the build prepared it: its modules, the levels of their definitions, and
// what their definitions without parameters evaluate to, among them the realm.
export const prepareRuntime = (directory: string): EscoreRuntime => {
  const library = createLibrary(directory);
  const texts = getModuleTexts(library);
  const modules = readPreparedModules(texts.map((entry) => entry[1])) ?? prepareModules(texts);
  const runtime = modules[modules.length - 1];
  const overridden = new Set(getOverrides(library).map((override) => override.name));
  const getView = createModuleView(runtime);
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
    modules: modules.slice(0, -1),
    getView,
    families: library.families,
    internalKeys: library.internalKeys,
    resumableSteps: new Set(
      [...(library.definitions.get("ResumeFrame")?.text ?? "").matchAll(/frame\.step = "(\w+)"/g)]
        .map((match) => match[1])
        .filter((name) => !overridden.has(name)),
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
    hostOnlyModuleGlobals: getHostOnlyGlobals(library, globalThis),
    hostOnlyProperties: getHostOnlyProperties(library),
  };
};
