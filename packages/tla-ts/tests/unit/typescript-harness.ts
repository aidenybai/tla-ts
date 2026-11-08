import ts from "@typescript/typescript6";
import { types } from "node:util";
import { runInNewContext } from "node:vm";
import { check, type Value } from "../../src";
import { parseModule } from "../../src/parser";
import { printModule } from "../../src/printer";
import { compile } from "../../src/typescript/compile";

// Values print as strings that are equal for equal TLA+ values. Sets ignore order, and arrays,
// Maps, and objects all print as functions from their keys, as TLA+ represents them.
const formatSet = (elements: string[]) => `{${elements.sort().join(", ")}}`;

const formatFunction = (entries: [string, string][]) =>
  `[${entries
    .map((entry) => `${entry[0]} |-> ${entry[1]}`)
    .sort()
    .join(", ")}]`;

const getCanonical = (value: unknown): string => {
  if (value === null) return "Null";
  if (value === undefined) return "Undefined";
  if (typeof value === "number" || typeof value === "boolean" || typeof value === "string") {
    return JSON.stringify(value);
  }
  if (types.isSet(value)) return formatSet([...value].map(getCanonical));
  const entries: [unknown, unknown][] = types.isMap(value)
    ? [...value]
    : Array.isArray(value)
      ? value.map((element, index) => [index + 1, element])
      : Object.entries(value as object).map((entry) => [
          /^-?\d+$/.test(entry[0]) ? Number(entry[0]) : entry[0],
          entry[1],
        ]);
  return formatFunction(entries.map((entry) => [getCanonical(entry[0]), getCanonical(entry[1])]));
};

const getEntry = (value: Value, isKey: (key: Value) => boolean) => {
  if (typeof value !== "object" || value.kind !== "Function") return undefined;
  const position = value.domain.findIndex(isKey);
  return position === -1 ? undefined : value.range[position];
};

// A script's objects are references (Ref :> n) into its heap's objects, which print as the object.
const getCanonicalTla = (value: Value, heap?: Value): string => {
  const getInner = (inner: Value) => getCanonicalTla(inner, heap);
  if (typeof value !== "object") return JSON.stringify(value);
  if (value.kind === "ModelValue") return value.name;
  if (value.kind === "Set" || value.kind === "MixedSet") {
    return formatSet(value.elements.map(getInner));
  }
  const reference = getEntry(
    value,
    (key) => typeof key === "object" && key.kind === "ModelValue" && key.name === "Ref",
  );
  const objects = heap === undefined ? undefined : getEntry(heap, (key) => key === "objects");
  const object =
    reference === undefined || objects === undefined
      ? undefined
      : getEntry(objects, (key) => key === reference);
  const values = object === undefined ? undefined : getEntry(object, (key) => key === "values");
  if (values !== undefined) return getInner(values);
  if (value.kind === "Interval") {
    return formatSet(
      Array.from({ length: Math.max(0, value.high - value.low + 1) }, (_, index) =>
        JSON.stringify(value.low + index),
      ),
    );
  }
  if (value.kind === "Function") {
    return formatFunction(
      value.domain.map((key, index) => [getInner(key), getInner(value.range[index])]),
    );
  }
  throw new Error(`Unexpected value kind: ${value.kind}`);
};

// Runs a TypeScript module as JavaScript and returns what its getResult export returns.
const runJavaScript = (source: string) => {
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ESNext },
  }).outputText;
  // A fresh realm, so that a script that changes a built-in object doesn't change this one's.
  const exports: { getResult?: () => unknown } = {};
  runInNewContext(output, { exports });
  if (exports.getResult === undefined) throw new Error("The module must export getResult");
  return exports.getResult();
};

const isWrittenField = (key: string) =>
  /^(location|text|isBulleted|prefixEnds)$|[rR]anges?$/.test(key);

const getParsedShape = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(getParsedShape);
  if (value === null || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.entries(value)
      .filter((entry) => !isWrittenField(entry[0]) && entry[1] !== undefined)
      .map((entry) => [entry[0], getParsedShape(entry[1])]),
  );
};

export const compileChecked = (source: string, fileName?: string) => {
  const spec = compile(source, fileName);
  const parsed = parseModule(printModule(spec.source));
  if (JSON.stringify(getParsedShape(parsed)) !== JSON.stringify(getParsedShape(spec.source))) {
    throw new Error(
      `The printed module doesn't parse back to the module:\n${printModule(spec.source)}`,
    );
  }
  return spec;
};

// The last state that the compiled spec reaches, where no action can run any more.
const runTla = async (source: string) => {
  const result = await check(compileChecked(source));
  const state = result.violation?.trace.at(-1)?.state;
  if (result.status !== "deadlock" || state === undefined) {
    throw new Error(`Expected a deadlock, got ${result.status}: ${result.failure?.message ?? ""}`);
  }
  return state;
};

// The value of an expression, in JavaScript and in the TLA+ that tla-ts compiles it to.
export const evaluateExpression = async (expression: string, setup = "") => {
  const state = await runTla(`${setup}\nlet result = ${expression};`);
  return {
    expected: getCanonical(
      runJavaScript(`${setup}\nexport const getResult = () => (${expression});`),
    ),
    actual: getCanonicalTla(state.result, state.heap),
  };
};

// The variables after an action runs statements once, in JavaScript and in the TLA+ that tla-ts compiles it to.
export const runStatements = async (variables: string, statements: string, setup = "") => {
  const names = ts
    .createSourceFile("variables.ts", `let ${variables};`, ts.ScriptTarget.ESNext)
    .statements.filter(ts.isVariableStatement)
    .flatMap((statement) => statement.declarationList.declarations)
    .flatMap((declaration) => (ts.isIdentifier(declaration.name) ? [declaration.name.text] : []));
  const model = `${setup}
let ${variables};
let isDone = false;
export const run = () => {
  if (isDone) return;
  isDone = true;
  ${statements}
};`;
  const state = await runTla(model);
  return {
    expected: getCanonical(
      runJavaScript(`${model}\nexport const getResult = () => { run(); return { ${names} }; };`),
    ),
    actual: formatFunction(
      names.map((name) => [JSON.stringify(name), getCanonicalTla(state[name])]),
    ),
  };
};
