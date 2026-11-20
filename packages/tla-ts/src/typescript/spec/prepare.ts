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
  type EscoreFiles,
  type Family,
  getDependencies,
  HOOKS,
  type Library,
  readEscoreFiles,
} from "./library";
import { type HostRealm, recordHostRealm } from "./realm";
import {
  getHostDefinitions,
  getLocalDefinitions,
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
  // The names that the runtime's modules define, which a program's own definitions avoid.
  names: ReadonlySet<string>;
  families: Family[];
  gates: Gate[];
  // The property keys that the runtime's own operators get or call.
  internalKeys: ReadonlySet<string>;
  // The runtime's steps that take a result as their last parameter and, where it suspends, pass it
  // on with a frame that ResumeFrame resumes.
  resumableSteps: ReadonlySet<string>;
  // What a program's spec reads of the host whose behavior it models.
  realm: HostRealm;
}

// What a host prepares ESCore's runtime from: ESCore's texts, the realm of the host that the
// runtime models, and the graph of the runtime that a build prepared from them, if one did.
export interface EscoreHost {
  files: EscoreFiles;
  realm: HostRealm;
  graph?: EncodedGraph;
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
const getOverrides = (library: Library, realm: HostRealm) => [
  ...RUNTIME_DEFINITIONS,
  ...getHostDefinitions(library),
  ...getLocalDefinitions(library),
  ...getRealmDefinitions(library, realm),
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
        // The task that runs, below whose frames a stack trace ends (STACK_DEFINITIONS).
        'jobs |-> <<>>, timers |-> <<>>, required |-> <<>>, hostHandler |-> Empty, written |-> FALSE, writeMark |-> [objects |-> 0, environments |-> 0], hostImport |-> Empty, frame |-> <<>>, task |-> [kind |-> "main"],',
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
const getModuleTexts = (library: Library, realm: HostRealm) => [
  ...library.modules,
  ["ESRuntime", assembleRuntime(library, getOverrides(library, realm), INTERPRETER)] as const,
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
  // TLC swallows what a definition throws as it starts, a stack overflow included, which would leave
  // the realm without its value.
  const initial = started.startupDefinitions.find(
    (definition) => definition.name === "InitialState",
  );
  if (initial === undefined || getStartupValue(initial, started.environment) === undefined) {
    throw new TlaError(
      "tla-ts can't start ESCore's realm, whose evaluation ran out of stack: run Node with a deeper stack, as with --stack-size=4000",
    );
  }
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

// The prepared modules as a graph holds them, each value a plain copy, without their tokens, which
// lexing a module's text makes faster than the graph reads them.
interface PreparedGraph {
  modules: (Omit<PreparedModule, "tokens" | "values"> & { values: Map<Definition, unknown> })[];
}

// The graph of the modules of the runtime of ESCore's texts for a realm, prepared, which a build
// writes into a bundle so that a process reads the modules rather than prepares them.
const getGraph = (library: Library, realm: HostRealm) => {
  const texts = getModuleTexts(library, realm);
  const modules = prepareModules(texts);
  const entries = modules.map((prepared) => [...(prepared.values ?? [])]);
  const plain = getPlainValues(entries.flat().map((entry) => entry[1]));
  let position = 0;
  const graph: PreparedGraph = {
    modules: modules.map((prepared, index) => ({
      name: prepared.name,
      text: prepared.text,
      module: prepared.module,
      levels: prepared.levels,
      texts: prepared.texts,
      values: new Map(entries[index].map((entry) => [entry[0], plain[position++]])),
      facts: prepared.facts,
    })),
  };
  return encodeGraph(graph);
};

// The Node whose realm a recorded host holds, the project's reference, which .node-version pins.
const REFERENCE_NODE = "26";

// The realm of the host that runs this process, which only the reference Node records, so that a
// recorded host is the same wherever it's recorded.
const recordReferenceRealm = (library: Library) => {
  const version = globalThis.process?.versions.node ?? "";
  if (version.split(".")[0] !== REFERENCE_NODE) {
    throw new TlaError(
      `tla-ts can't record the host on Node ${version}; it needs Node ${REFERENCE_NODE}`,
    );
  }
  return recordHostRealm(library);
};

// The graph of the runtime of ESCore's directory for the realm of the host that runs this process.
export const getRuntimeGraph = (directory: string) => {
  const library = createLibrary(readEscoreFiles(directory));
  return getGraph(library, recordReferenceRealm(library));
};

// The host that a browser prepares ESCore's runtime from, as this process records it: ESCore's
// texts, the realm of the host that runs this process as plain data, and the runtime's graph, for
// a page to fetch as JSON.
export const recordEscoreHost = (directory: string): EscoreHost => {
  const files = readEscoreFiles(directory);
  const library = createLibrary(files);
  const realm = recordReferenceRealm(library);
  return { files, realm, graph: getGraph(library, realm) };
};

// The build writes the graph of the prepared runtime in place of these strings, its tables as JSON
// and its stream as it is. Unbuilt, the tables are JSON for a string.
const RUNTIME_TABLES = '"tla-ts:escore-tables"';
const RUNTIME_STREAM = "tla-ts:escore-stream";

// The graph that the build wrote into this bundle, if it wrote one.
const getBundledGraph = (): EncodedGraph | undefined => {
  const tables: unknown = JSON.parse(RUNTIME_TABLES);
  return Array.isArray(tables)
    ? { tables: tables as EncodedGraph["tables"], stream: RUNTIME_STREAM }
    : undefined;
};

// The modules that a build prepared in an encoded graph, where it prepared them from the same texts.
const readPreparedModules = (
  texts: readonly string[],
  encoded: EncodedGraph | undefined,
): PreparedModule[] | undefined => {
  if (encoded === undefined) return undefined;
  const graph = decodeGraph(encoded) as PreparedGraph;
  if (
    graph.modules.length !== texts.length ||
    graph.modules.some((prepared, index) => prepared.text !== texts[index])
  ) {
    return undefined;
  }
  const entries = graph.modules.map((prepared) => [...prepared.values]);
  const values = readPlainValues(entries.flat().map((entry) => entry[1]));
  let position = 0;
  return graph.modules.map((prepared, index) => ({
    ...prepared,
    tokens: tokenize(prepared.text),
    values: new Map(entries[index].map((entry) => [entry[0], values[position++]])),
  }));
};

// ESCore's runtime of a library for a realm, read, checked by SANY's checks, and started once for
// every program a process compiles, or read as a build prepared it in a graph: its modules, the
// levels of their definitions, and what their definitions without parameters evaluate to, among
// them the realm.
const prepareLibraryRuntime = (
  library: Library,
  hostRealm: HostRealm,
  graph: EncodedGraph | undefined,
): EscoreRuntime => {
  const texts = getModuleTexts(library, hostRealm);
  const modules =
    readPreparedModules(
      texts.map((entry) => entry[1]),
      graph,
    ) ?? prepareModules(texts);
  const runtime = modules[modules.length - 1];
  const overridden = new Set(getOverrides(library, hostRealm).map((override) => override.name));
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
  // The names that each definition reads, read once for every group's walk.
  const dependencies = new Map(
    [...library.definitions.values()].map((definition) => [
      definition.name,
      getDependencies(definition.text),
    ]),
  );
  // The stubs of other groups that a group's operators reach, through any operators between, which
  // a spec with the group keeps.
  const getReachedStubs = (group: string) => {
    const visited = new Set<string>();
    const visit = (name: string): void => {
      if (visited.has(name)) return;
      visited.add(name);
      dependencies.get(name)?.forEach(visit);
    };
    [...library.definitions.values()]
      .filter((definition) => definition.group === group)
      .forEach((definition) => visit(definition.name));
    return [...visited].filter((name) => {
      const stubGroup = stubGroups.get(name);
      return stubGroup !== undefined && stubGroup !== group;
    });
  };
  return {
    modules: modules.slice(0, -1),
    getView,
    names: new Set(
      modules.flatMap((prepared) =>
        prepared.module.definitions.map((definition) => definition.name),
      ),
    ),
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
      reached: getReachedStubs(entry[0]),
    })),
    realm: hostRealm,
  };
};

// ESCore's runtime for a host that a build recorded, such as a browser.
export const prepareHostRuntime = (host: EscoreHost) =>
  prepareLibraryRuntime(createLibrary(host.files), host.realm, host.graph);

// ESCore's runtime of its directory for the host that runs this process, read as the build
// prepared it where the build wrote its graph into this bundle.
export const prepareRuntime = (directory: string) => {
  const library = createLibrary(readEscoreFiles(directory));
  return prepareLibraryRuntime(library, recordHostRealm(library), getBundledGraph());
};
