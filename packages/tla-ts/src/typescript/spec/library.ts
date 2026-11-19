import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

// ESCore, split into its definitions, of which a compiled spec's runtime is made. The directory
// holds ESCore.tla, the modules it extends, and parts, whose tables list the realm's properties.

interface Definition {
  name: string;
  text: string;
  arity: number;
  // A definition without parameters, or with an operator parameter, which TLA+ can't declare
  // RECURSIVE, so the module defines it before its uses.
  isEager: boolean;
  // Whether its first parameter is the state, which an operator on a group's objects takes and a
  // pure helper doesn't.
  isStateful: boolean;
  group: string;
}

export interface Family {
  name: string;
  group: string;
}

export interface GeneratedDefinition {
  name: string;
  text: string;
  arity: number;
}

export interface Library {
  definitions: Map<string, Definition>;
  order: string[];
  // The families of built-ins that CallBuiltin dispatches on.
  families: Family[];
  // The words that reach each group of parts whose objects only its built-ins make: the names of
  // its globals and of its constructors' own properties.
  triggers: Map<string, Set<string>>;
  // The names that ESCore's own operators use as property keys, such as toString and then.
  internalKeys: Set<string>;
  // The realm's properties with a string key, by the intrinsic that holds each, as the property
  // tables list them.
  properties: { owner: string; key: string }[];
  modules: Map<string, string>;
}

const HEADER = /^([A-Z][A-Za-z0-9_]*)(?:\((.*)\))?\s*==/;

const getHeader = (definition: string) =>
  definition.split("\n").find((line) => !line.startsWith("\\*")) ?? "";

// The names that a definition reads.
export const getDependencies = (text: string) => [
  ...new Set(
    text
      .slice(text.indexOf("=="))
      .replace(/\\\*.*$/gm, "")
      .replace(/"(?:[^"\\]|\\.)*"/g, '""')
      .match(/\b[A-Z][A-Za-z0-9_]*\b/g) ?? [],
  ),
];

const splitDefinitions = (text: string) =>
  text
    .split(/\n(?=(?:\\\*.*\n)*[A-Z][A-Za-z0-9_]*(?:\(.*\))?\s*==)/)
    .map((definition) => definition.trimEnd())
    .filter((definition) => HEADER.test(getHeader(definition)));

// Parts that hold one kind of object each form a group: regular expressions, buffers and typed
// arrays, and Temporal.
const getGroup = (part: string) =>
  part.startsWith("83-regexp")
    ? "83-regexp"
    : part.startsWith("84-")
      ? "84"
      : part.startsWith("89-")
        ? "89"
        : part;

// The groups whose operators run only on objects that the group's own built-ins make, or on code
// that a compiled script never has, so that a program that names none of the group's globals
// reaches none of them.
const GATED_GROUPS = [
  "77-json.tla",
  "79-proxy.tla",
  "81-collections.tla",
  "81-disposable.tla",
  "81-iterator.tla",
  "81-shadowrealm.tla",
  "82-date.tla",
  "83-regexp",
  "84",
  "86-promise.tla",
  "87-eval.tla",
  "88-modules.tla",
  "89",
];

// String methods that make regular expressions, and the methods of collections and arrays that
// give iterators, whose helpers, such as every and map, a program may call.
const EXTRA_TRIGGERS = new Map([
  ["83-regexp", ["match", "matchAll", "replace", "replaceAll", "search", "split"]],
  ["81-iterator.tla", ["values", "keys", "entries"]],
]);

export const createLibrary = (directory: string): Library => {
  const core = readFileSync(join(directory, "ESCore.tla"), "utf8");
  const body = core.slice(core.lastIndexOf("\nRECURSIVE "), core.lastIndexOf("\n===="));
  const parts = readdirSync(join(directory, "parts"))
    .filter((name) => name.endsWith(".tla"))
    .map((name) => ({
      group: getGroup(name),
      text: readFileSync(join(directory, "parts", name), "utf8"),
    }));
  const groupOf = new Map(
    parts.flatMap((part) =>
      splitDefinitions(part.text).flatMap((definition) => {
        const name = HEADER.exec(getHeader(definition))?.[1];
        return name === undefined ? [] : [[name, part.group] as const];
      }),
    ),
  );
  const triggers = new Map(
    GATED_GROUPS.map((group) => [group, new Set(EXTRA_TRIGGERS.get(group) ?? [])]),
  );
  for (const part of parts) {
    for (const match of part.text.matchAll(/GlobalLink\("[A-Za-z0-9_]+", N\("([^"]+)"\)\)/g)) {
      triggers.get(part.group)?.add(match[1]);
    }
    // The globals that a table of names links, such as TypedArrayNames.
    for (const table of part.text.matchAll(/^[A-Z][A-Za-z0-9]*Names ==\n?((?:.*\n)*?)(?=^\S)/gm)) {
      for (const match of table[1].matchAll(/"([A-Z][A-Za-z0-9]*)"/g)) {
        triggers.get(part.group)?.add(match[1]);
      }
    }
    // A constructor's own properties, such as Promise.resolve.
    for (const match of part.text.matchAll(
      /\b(?:M|G)\("([A-Za-z0-9_]+)", SV\("([^"]+)"\), "([A-Za-z0-9]+)"/g,
    )) {
      if (!match[1].endsWith("Prototype")) {
        triggers.get(groupOf.get(`${match[3]}Builtin`) ?? "")?.add(match[2]);
      }
    }
  }
  const definitions = new Map<string, Definition>();
  const order: string[] = [];
  for (const text of splitDefinitions(body.slice(body.indexOf("\n", 1)))) {
    const match = HEADER.exec(getHeader(text));
    if (match === null) continue;
    definitions.set(match[1], {
      name: match[1],
      text,
      arity: match[2] === undefined ? 0 : match[2].split(",").length,
      isEager: match[2] === undefined || match[2].includes("("),
      isStateful: match[2]?.split(",")[0].trim() === "s",
      group: groupOf.get(match[1]) ?? "",
    });
    order.push(match[1]);
  }
  const modules = new Map(
    ["ESNumber", "ESBigNat"].map((name) => [
      name,
      readFileSync(join(directory, `${name}.tla`), "utf8"),
    ]),
  );
  const properties = parts.flatMap((part) => [
    ...[...part.text.matchAll(/\b(?:M|G|V|L)\("([A-Za-z0-9_]+)", SV\("([^"]+)"\)/g)].map(
      (match) => ({
        owner: match[1],
        key: match[2],
      }),
    ),
    ...[...part.text.matchAll(/GlobalLink\("[A-Za-z0-9_]+", N\("([^"]+)"\)\)/g)].map((match) => ({
      owner: "GlobalObject",
      key: match[1],
    })),
    // The globals that a table of names links: the native errors and the typed arrays.
    ...[
      ...part.text.matchAll(/^(?:NativeErrors|[A-Z][A-Za-z0-9]*Names) ==\n?((?:.*\n)*?)(?=^\S)/gm),
    ].flatMap((table) =>
      [...table[1].matchAll(/"([A-Z][A-Za-z0-9]*(?:Error|Array))"/g)].map((match) => ({
        owner: "GlobalObject",
        key: match[1],
      })),
    ),
  ]);
  return {
    definitions,
    order,
    families: [...core.matchAll(/id\[1\] = "([A-Za-z0-9]+)" -> \1Builtin/g)].map((match) => ({
      name: match[1],
      group: groupOf.get(`${match[1]}Builtin`) ?? "",
    })),
    triggers,
    internalKeys: new Set(
      [...definitions.values()]
        .filter((definition) => !definition.name.endsWith("Properties"))
        .flatMap((definition) =>
          [...definition.text.matchAll(/\b(?:SV|N)\("([^"]+)"\)/g)].map((match) => match[1]),
        ),
    ),
    properties,
    modules,
  };
};

const getUnits = (text: string) =>
  `<<${Array.from({ length: text.length }, (_, index) => text.charCodeAt(index)).join(", ")}>>`;

// N and SV of a literal name as the code units that ESNames's table gives it, which spares a spec
// building the table of every name ESCore uses.
export const foldNames = (text: string) =>
  text.replace(/\b(N|SV)\("((?:[^"\\]|\\.)*)"\)/g, (_, operator: string, literal: string) => {
    const units = getUnits(JSON.parse(`"${literal}"`));
    return operator === "N" ? units : `Str(${units})`;
  });

// ESCore's definitions that a compiled spec has no use for: SV, whose literal uses the module
// folds, and the test262 harness's entry points, which run the interpreter on parse nodes.
const UNUSED = new Set(["SV", "HarnessResult", "RunFrom", "RunModuleFrom"]);

const getParameters = (arity: number) =>
  Array.from({ length: arity }, (_, index) => `p${index + 1}`).join(", ");

const getStub = (definition: Definition) =>
  `${definition.name}(${getParameters(definition.arity)}) ==\n  Assert(FALSE, "tla-ts can't run ${definition.name}, which a compiled spec leaves out of ESCore")`;

// The operators of the runtime that a program's code takes the place of, which the runtime
// defines as stops and a config overrides with the program's, by their parameters.
export const HOOKS = new Map([
  ["CallCode", "s, f, ctx, args, id"],
  ["LoopIteration", "s, ctx, loop, v"],
  ["CallBuiltin", "s, f, id, this, args, nt"],
  ["SourceUnits", "t"],
  ["RunBody", "s, ctx, body"],
  ["ResumeCode", "args, r"],
  ["HostTimeZone", "key"],
  ["HostDateFormat", "key"],
  ["ModuleNode", "id"],
  ["ModuleDeclarations", "s, ctx, node"],
]);

// The module ESRuntime: every ESCore definition, with the overrides in place of ESCore's and a
// stub that stops the check in place of each operator in cut. A compiled program's code takes the
// place of the hooks, so that one runtime serves every program. They are definitions rather than
// operator constants, whose arguments' levels SANY's checks would trace through every operator
// that calls them.
export const assembleRuntime = (
  library: Library,
  overrides: readonly GeneratedDefinition[],
  cut: ReadonlySet<string>,
) => {
  const replaced = new Map(overrides.map((definition) => [definition.name, definition]));
  const kept = library.order.flatMap((name) => {
    const definition = library.definitions.get(name);
    return definition === undefined || UNUSED.has(name) || HOOKS.has(name) || replaced.has(name)
      ? []
      : [definition];
  });
  const stubs = kept.filter((definition) => cut.has(definition.name) && definition.arity > 0);
  const copied = kept.filter((definition) => !stubs.includes(definition));
  const recursive = [
    ...copied.filter((definition) => !definition.isEager),
    ...stubs,
    ...replaced.values(),
  ].filter((definition) => definition.arity > 0);
  return foldNames(
    [
      "---- MODULE ESRuntime ----",
      "EXTENDS Integers, Sequences, FiniteSets, TLC, ESNumber",
      "CONSTANTS None, Empty, Absent",
      ...[...HOOKS].map(
        (hook) =>
          `${hook[0]}(${hook[1]}) == Assert(FALSE, "tla-ts can't run ${hook[0]} without a program")`,
      ),
      // TLC computes the level of each definition without parameters by walking the bodies of
      // the operators it applies, along every path, so Init reaches the program only through
      // an operator argument, whose body TLC doesn't walk.
      "ApplyTo(F(_), x) == F(x)",
      ...recursive.map(
        (definition) =>
          `RECURSIVE ${definition.name}(${Array.from({ length: definition.arity }, () => "_").join(", ")})`,
      ),
      ...copied.filter((definition) => definition.isEager).map((definition) => definition.text),
      // An override without parameters comes before the operators, which TLA+ reads in order.
      ...[...replaced.values()]
        .filter((definition) => definition.arity === 0)
        .map((definition) => definition.text),
      ...copied.filter((definition) => !definition.isEager).map((definition) => definition.text),
      ...stubs.map(getStub),
      ...[...replaced.values()]
        .filter((definition) => definition.arity > 0)
        .map((definition) => definition.text),
      "====",
      "",
    ].join("\n"),
  );
};

// A program's CallBuiltin, which runs the built-ins of the families given and stops at the others
// and at the methods in stoppedMethods, but for Temporal's, which format through HostDateFormat.
export const getCallBuiltin = (
  name: string,
  families: readonly Family[],
  stoppedMethods: readonly string[],
) =>
  [
    `${name}(s, f, id, this, args, nt) ==`,
    `  IF id[2] \\in {${stoppedMethods.map((method) => `"${method}"`).join(", ")}} /\\ id[1] \\notin {${families
      .filter((family) => family.group === "89")
      .map((family) => `"${family.name}"`)
      .join(
        ", ",
      )}} THEN Assert(FALSE, "tla-ts can't run a built-in whose result depends on the host's locale") ELSE`,
    ...families.map(
      (family, index) =>
        `  ${index === 0 ? "CASE" : "  []"} id[1] = "${family.name}" -> ${family.name}Builtin(s, f, id[2], this, args, nt)`,
    ),
    `    [] OTHER -> Assert(FALSE, "tla-ts can't run a built-in that this program's spec leaves out of ESCore")`,
  ].join("\n");
