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
  families: string[];
  // The realm's properties with a string key, by the intrinsic that holds each, as the property
  // tables list them.
  properties: { owner: string; key: string }[];
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

export const createLibrary = (directory: string): Library => {
  const core = readFileSync(join(directory, "ESCore.tla"), "utf8");
  const body = core.slice(core.lastIndexOf("\nRECURSIVE "), core.lastIndexOf("\n===="));
  const partTexts = readdirSync(join(directory, "parts"))
    .filter((name) => name.endsWith(".tla"))
    .map((name) => readFileSync(join(directory, "parts", name), "utf8"));
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
    });
    order.push(match[1]);
  }
  const modules = new Map(
    ["ESNumber", "ESBigNat"].map((name) => [
      name,
      readFileSync(join(directory, `${name}.tla`), "utf8"),
    ]),
  );
  const properties = partTexts.flatMap((text) => [
    ...[...text.matchAll(/\b(?:M|G|V|L)\("([A-Za-z0-9_]+)", SV\("([^"]+)"\)/g)].map((match) => ({
      owner: match[1],
      key: match[2],
    })),
    ...[...text.matchAll(/GlobalLink\("[A-Za-z0-9_]+", N\("([^"]+)"\)\)/g)].map((match) => ({
      owner: "GlobalObject",
      key: match[1],
    })),
    // The globals that a table of names links: the native errors and the typed arrays.
    ...[
      ...text.matchAll(/^(?:NativeErrors|[A-Z][A-Za-z0-9]*Names) ==\n?((?:.*\n)*?)(?=^\S)/gm),
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
    families: [...core.matchAll(/id\[1\] = "([A-Za-z0-9]+)" -> \1Builtin/g)].map(
      (match) => match[1],
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

// The module ESRuntime: every ESCore definition, with the overrides in place of ESCore's and a
// stub that stops the check in place of each operator in cut. A compiled program's code is its
// operator constants CallCode and LoopIteration, which a config substitutes, so that one runtime
// serves every program. CallBuiltin stops at the built-ins in stoppedMethods.
export const assembleRuntime = (
  library: Library,
  overrides: readonly GeneratedDefinition[],
  cut: ReadonlySet<string>,
  stoppedMethods: readonly string[],
) => {
  const callBuiltin: GeneratedDefinition = {
    name: "CallBuiltin",
    arity: 6,
    text: [
      "CallBuiltin(s, f, id, this, args, nt) ==",
      `  IF id[2] \\in {${stoppedMethods.map((method) => `"${method}"`).join(", ")}} THEN Assert(FALSE, "tla-ts can't run a built-in whose result depends on the host's locale") ELSE`,
      ...library.families.map(
        (family, index) =>
          `  ${index === 0 ? "CASE" : "  []"} id[1] = "${family}" -> ${family}Builtin(s, f, id[2], this, args, nt)`,
      ),
      `    [] OTHER -> Assert(FALSE, "tla-ts can't run a built-in that ESCore leaves out")`,
    ].join("\n"),
  };
  const replaced = new Map(
    [...overrides, callBuiltin].map((definition) => [definition.name, definition]),
  );
  const kept = library.order.flatMap((name) => {
    const definition = library.definitions.get(name);
    return definition === undefined ||
      UNUSED.has(name) ||
      name === "LoopIteration" ||
      replaced.has(name)
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
      "CONSTANTS None, Empty, Absent, CallCode(_, _, _, _, _), LoopIteration(_, _, _, _)",
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
