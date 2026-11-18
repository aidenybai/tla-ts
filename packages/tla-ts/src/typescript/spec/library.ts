import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import type { Expression, SourceLocation } from "../../ast";
import { parseModule } from "../../parser";

// ESCore, split into its definitions, which a compiled spec takes the ones it reaches of. The
// directory holds ESCore.tla, the modules it extends, and parts, whose files tell which part
// defines each operator.

interface Definition {
  name: string;
  text: string;
  arity: number;
  // A definition without parameters, or with an operator parameter, which TLA+ can't declare
  // RECURSIVE, so the module defines it before its uses.
  isEager: boolean;
  // Whether its first parameter is the state, which an operator on the group's objects takes
  // and a pure helper doesn't.
  isStateful: boolean;
  group: string;
  arms: MethodArm[];
}

interface MethodArm {
  names: string[];
  start: number;
  end: number;
}

export interface GeneratedDefinition {
  name: string;
  text: string;
  arity: number;
}

export interface Library {
  definitions: Map<string, Definition>;
  order: string[];
  // The words that reach each group of parts whose objects only its built-ins make: the
  // names of its globals and of its constructors' own methods.
  triggers: Map<string, Set<string>>;
  families: { name: string; group: string }[];
  // The method names that a built-in's CASE dispatches on, by the property keys that reach them,
  // for the methods that only a string key reaches.
  methodKeys: Map<string, Set<string>>;
  // The property keys that ESCore's own operators get or set, such as toString and valueOf.
  internalKeys: Set<string>;
  modules: Map<string, string>;
}

const HEADER = /^([A-Z][A-Za-z0-9_]*)(?:\((.*)\))?\s*==/;

const getHeader = (definition: string) =>
  definition.split("\n").find((line) => !line.startsWith("\\*")) ?? "";

const splitDefinitions = (text: string) =>
  text
    .split(/\n(?=(?:\\\*.*\n)*[A-Z][A-Za-z0-9_]*(?:\(.*\))?\s*==)/)
    .map((definition) => definition.trimEnd())
    .filter((definition) => HEADER.test(getHeader(definition)));

const getDependencies = (text: string) => [
  ...new Set(
    text
      .replace(/\\\*.*$/gm, "")
      .replace(/"(?:[^"\\]|\\.)*"/g, '""')
      .match(/\b[A-Z][A-Za-z0-9_]*\b/g) ?? [],
  ),
];

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
const GATED_GROUPS = new Set([
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
]);

// String methods that make regular expressions.
const EXTRA_TRIGGERS = new Map([
  ["83-regexp", ["match", "matchAll", "replace", "replaceAll", "search", "split"]],
]);

export const createLibrary = (directory: string): Library => {
  const core = readFileSync(join(directory, "ESCore.tla"), "utf8");
  const body = core.slice(core.lastIndexOf("\nRECURSIVE "), core.lastIndexOf("\n===="));
  const partTexts = new Map(
    readdirSync(join(directory, "parts"))
      .filter((name) => name.endsWith(".tla"))
      .map((name) => [name, readFileSync(join(directory, "parts", name), "utf8")]),
  );
  const groupOf = new Map<string, string>();
  for (const [part, text] of partTexts) {
    for (const definition of splitDefinitions(text)) {
      const name = HEADER.exec(getHeader(definition))?.[1];
      if (name !== undefined) groupOf.set(name, getGroup(part));
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
      arms: getMethodArms(text),
      group: groupOf.get(match[1]) ?? "",
    });
    order.push(match[1]);
  }
  const families = [...core.matchAll(/id\[1\] = "([A-Za-z0-9]+)" -> \1Builtin/g)].map((match) => ({
    name: match[1],
    group: groupOf.get(`${match[1]}Builtin`) ?? "",
  }));
  const triggers = new Map<string, Set<string>>(
    [...GATED_GROUPS].map((group) => [group, new Set(EXTRA_TRIGGERS.get(group) ?? [])]),
  );
  const methodKeys = new Map<string, Set<string>>();
  const symbolMethods = new Set<string>();
  for (const [part, text] of partTexts) {
    for (const match of text.matchAll(/GlobalLink\("[A-Za-z0-9_]+", N\("([^"]+)"\)\)/g)) {
      triggers.get(getGroup(part))?.add(match[1]);
    }
    // The globals that a table of names links, such as TypedArrayNames.
    for (const table of text.matchAll(/^[A-Z][A-Za-z0-9]*Names ==\n?((?:.*\n)*?)(?=^\S)/gm)) {
      for (const match of table[1].matchAll(/"([A-Z][A-Za-z0-9]*)"/g))
        triggers.get(getGroup(part))?.add(match[1]);
    }
    for (const match of text.matchAll(
      /\b(?:M|G)\("([A-Za-z0-9_]+)", (?:SV\("([^"]+)"\)|Sym[A-Za-z]+), "([A-Za-z0-9]+)", "([A-Za-z0-9_]*)"(?:, "([A-Za-z0-9_]*)")?/g,
    )) {
      const names = [match[4], match[5]].filter((name) => name !== undefined && name !== "");
      if (match[2] === undefined) {
        names.forEach((name) => symbolMethods.add(name));
        continue;
      }
      names.forEach((name) =>
        methodKeys.set(name, new Set([...(methodKeys.get(name) ?? []), match[2]])),
      );
      if (!match[1].endsWith("Prototype")) {
        triggers.get(groupOf.get(`${match[3]}Builtin`) ?? "")?.add(match[2]);
      }
    }
  }
  // A method that a symbol key or a built-in's id in code reaches is always reachable.
  for (const match of body.matchAll(/<<"[A-Z][A-Za-z0-9]*", "([A-Za-z0-9_]+)">>/g))
    methodKeys.delete(match[1]);
  symbolMethods.forEach((name) => methodKeys.delete(name));
  const internalKeys = new Set(
    [...definitions.values()]
      .filter((definition) => !definition.name.endsWith("Properties"))
      .flatMap((definition) =>
        [...definition.text.matchAll(/\bSV\("([^"]+)"\)/g)].map((match) => match[1]),
      ),
  );
  const modules = new Map(
    ["ESNumber", "ESBigNat"].map((name) => [
      name,
      readFileSync(join(directory, `${name}.tla`), "utf8"),
    ]),
  );
  return { definitions, order, triggers, families, methodKeys, internalKeys, modules };
};

const getUnits = (text: string) =>
  `<<${Array.from({ length: text.length }, (_, index) => text.charCodeAt(index)).join(", ")}>>`;

// N and SV of a literal name as the code units that ESNames's table gives it, which spares a spec
// building the table of every name ESCore uses.
const foldNames = (text: string) =>
  text.replace(/\b(N|SV)\("((?:[^"\\]|\\.)*)"\)/g, (_, operator: string, literal: string) => {
    const units = getUnits(JSON.parse(`"${literal}"`));
    return operator === "N" ? units : `Str(${units})`;
  });

// The realm's tables and what building them runs, which every spec holds whole, so that a
// program sees every property the realm has, even of the built-ins it can't run.
const REALM_ROOTS = ["InitialState", "Intrinsics", "RealmProperties", "IntrinsicIndex"];

const getParameters = (arity: number) =>
  Array.from({ length: arity }, (_, index) => `p${index + 1}`).join(", ");

const getStub = (definition: Definition) =>
  `${definition.name}(${getParameters(definition.arity)}) ==\n  Assert(FALSE, "tla-ts can't run ${definition.name}, which this spec leaves out of ESCore")`;

// The CASE arms of a built-in's definition that dispatch on its method name m: each arm's names
// and where its body starts and ends in the definition's text, as the parser reads it.
const getMethodArms = (text: string): MethodArm[] => {
  if (!/\bm\b/.test(getHeader(text))) return [];
  const prefix = "---- MODULE Arms ----\n";
  const lineStarts = [0, 0];
  for (let index = 0; index < text.length; index++)
    if (text[index] === "\n") lineStarts.push(index + 1);
  const getOffset = (location: SourceLocation) =>
    lineStarts[location.line - 1] + location.column - 1;
  const arms: MethodArm[] = [];
  const getNames = (condition: Expression) => {
    if (condition.kind !== "Apply" || condition.args.length !== 2) return undefined;
    const subject = condition.args[0];
    const names = condition.args[1];
    if (subject.kind !== "Identifier" || subject.name !== "m") return undefined;
    if (condition.operator === "=" && names.kind === "String") return [names.value];
    if (condition.operator !== "\\in" || names.kind !== "SetEnumeration") return undefined;
    const values = names.elements.flatMap((element) =>
      element.kind === "String" ? [element.value] : [],
    );
    return values.length === names.elements.length ? values : undefined;
  };
  const visit = (node: unknown): void => {
    if (typeof node !== "object" || node === null) return;
    if (Array.isArray(node)) return node.forEach(visit);
    const expression = node as Expression;
    if (expression.kind === "Case") {
      for (const arm of expression.arms) {
        const names = getNames(arm.condition);
        const range = arm.body.location.range;
        if (names !== undefined && range !== undefined) {
          arms.push({ names, start: getOffset(range.start), end: getOffset(range.end) + 1 });
        }
      }
    }
    Object.values(node).forEach(visit);
  };
  visit(parseModule(`${prefix}${text}\n====`).definitions);
  return arms;
};

// A built-in's definition with the body of each CASE arm for methods that no word reaches in
// place of a stop, which keeps the arm's guard, so that no other arm runs in its place.
const pruneMethods = (
  text: string,
  arms: readonly MethodArm[],
  isReached: (name: string) => boolean,
) => {
  const pruned = arms.filter((arm) => !arm.names.some(isReached));
  // Only the outermost of the arms pruned, from the last back, so that each one's offsets hold.
  return pruned
    .filter(
      (arm) =>
        !pruned.some((other) => other !== arm && other.start <= arm.start && arm.end <= other.end),
    )
    .sort((left, right) => right.start - left.start)
    .reduce(
      (current, arm) =>
        `${current.slice(0, arm.start)}Assert(FALSE, "tla-ts can't run the built-in ${arm.names[0]}, which this spec leaves out of ESCore")${current.slice(arm.end)}`,
      text,
    );
};

// The module of a compiled program: the ESCore definitions that its generated ones reach, with
// the overrides in place of ESCore's. A stub that stops the check stands in for each operator in
// cut and of each gated group that the program's words don't reach, except its class tests and
// pure helpers, and for each built-in method
// that only a property key the program never names reaches.
export const assembleModule = (
  library: Library,
  name: string,
  generated: GeneratedDefinition[],
  overrides: GeneratedDefinition[],
  words: ReadonlySet<string>,
  cut: ReadonlySet<string>,
  stoppedMethods: readonly string[],
) => {
  const isIncluded = (group: string) =>
    !library.triggers.has(group) ||
    [...(library.triggers.get(group) ?? [])].some((word) => words.has(word));
  const isReached = (method: string) => {
    const keys = library.methodKeys.get(method);
    return (
      keys === undefined || [...keys].some((key) => words.has(key) || library.internalKeys.has(key))
    );
  };
  const families = library.families.filter((family) => isIncluded(family.group));
  const callBuiltin: GeneratedDefinition = {
    name: "CallBuiltin",
    arity: 6,
    text: [
      "CallBuiltin(s, f, id, this, args, nt) ==",
      `  IF id[2] \\in {${stoppedMethods.map((method) => `"${method}"`).join(", ")}} THEN Assert(FALSE, "tla-ts can't run a built-in whose result depends on the host's locale") ELSE`,
      ...families.map(
        (family, index) =>
          `  ${index === 0 ? "CASE" : "  []"} id[1] = "${family.name}" -> ${family.name}Builtin(s, f, id[2], this, args, nt)`,
      ),
      `    [] OTHER -> Assert(FALSE, "tla-ts can't run a built-in that this spec leaves out of ESCore")`,
    ].join("\n"),
  };
  const replaced = new Map(
    [...overrides, callBuiltin].map((definition) => [definition.name, definition]),
  );
  const generatedNames = new Set(generated.map((definition) => definition.name));
  const texts = new Map<string, string>();
  const stubbed = new Set<string>();
  const visit = (start: string[], isData: boolean) => {
    const stack = [...start];
    while (stack.length > 0) {
      const current = stack.pop() ?? "";
      if (texts.has(current) || stubbed.has(current) || generatedNames.has(current)) continue;
      const override = replaced.get(current);
      const definition = library.definitions.get(current);
      const text =
        (override === undefined ? undefined : foldNames(override.text)) ??
        (definition === undefined
          ? undefined
          : !isData &&
              definition.arity > 0 &&
              (cut.has(current) ||
                (!isIncluded(definition.group) &&
                  definition.isStateful &&
                  !/^(?:Is|Has)[A-Z]/.test(current)))
            ? undefined
            : foldNames(pruneMethods(definition.text, definition.arms, isReached)));
      if (text === undefined) {
        if (definition !== undefined) stubbed.add(current);
        continue;
      }
      texts.set(current, text);
      stack.push(...getDependencies(text.slice(text.indexOf("=="))));
    }
  };
  visit(REALM_ROOTS, true);
  const generatedTexts = generated.map((definition) => ({
    ...definition,
    text: foldNames(definition.text),
  }));
  visit(
    generatedTexts.flatMap((definition) =>
      getDependencies(definition.text.slice(definition.text.indexOf("=="))),
    ),
    false,
  );
  const libraryDefinitions = library.order
    .filter((current) => texts.has(current) && !replaced.has(current))
    .map((current) => ({
      definition: library.definitions.get(current),
      text: texts.get(current) ?? "",
    }));
  const overriding = [...replaced.values()].filter((definition) => texts.has(definition.name));
  const stubs = [...stubbed].flatMap((current) => library.definitions.get(current) ?? []);
  const recursive = [
    ...libraryDefinitions.flatMap((entry) =>
      entry.definition === undefined || entry.definition.isEager ? [] : [entry.definition],
    ),
    ...stubs,
    ...overriding,
    ...generatedTexts,
  ].filter((definition) => definition.arity > 0);
  return {
    text: [
      `---- MODULE ${name} ----`,
      "EXTENDS Integers, Sequences, FiniteSets, TLC, ESNumber",
      "CONSTANTS None, Empty, Absent",
      "VARIABLE programDone",
      // TLC computes the level of each definition without parameters by walking the bodies of
      // the operators it applies, along every path, so Init reaches the program only through
      // an operator argument, whose body TLC doesn't walk.
      "ApplyTo(F(_), x) == F(x)",
      ...recursive.map(
        (definition) =>
          `RECURSIVE ${definition.name}(${Array.from({ length: definition.arity }, () => "_").join(", ")})`,
      ),
      ...libraryDefinitions.filter((entry) => entry.definition?.isEager).map((entry) => entry.text),
      ...libraryDefinitions
        .filter((entry) => !entry.definition?.isEager)
        .map((entry) => entry.text),
      ...stubs.map(getStub),
      ...overriding.map((definition) => texts.get(definition.name) ?? ""),
      ...generatedTexts.map((definition) => definition.text),
      "====",
      "",
    ].join("\n"),
    kept: [...texts.keys()],
    stubbed: [...stubbed],
  };
};
