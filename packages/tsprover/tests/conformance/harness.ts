import ts from "typescript";
import { check, type Value } from "tla-ts";
import { compile } from "../../src";

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
  if (value instanceof Set) return formatSet([...value].map(getCanonical));
  const entries: [unknown, unknown][] =
    value instanceof Map
      ? [...value]
      : Array.isArray(value)
        ? value.map((element, index) => [index + 1, element])
        : Object.entries(value as object).map((entry) => [
            /^-?\d+$/.test(entry[0]) ? Number(entry[0]) : entry[0],
            entry[1],
          ]);
  return formatFunction(entries.map((entry) => [getCanonical(entry[0]), getCanonical(entry[1])]));
};

const getCanonicalTla = (value: Value): string => {
  if (typeof value !== "object") return JSON.stringify(value);
  if (value.kind === "ModelValue") return value.name;
  if (value.kind === "Set" || value.kind === "MixedSet") {
    return formatSet(value.elements.map(getCanonicalTla));
  }
  if (value.kind === "Interval") {
    return formatSet(
      Array.from({ length: Math.max(0, value.high - value.low + 1) }, (_, index) =>
        JSON.stringify(value.low + index),
      ),
    );
  }
  if (value.kind === "Function") {
    return formatFunction(
      value.domain.map((key, index) => [getCanonicalTla(key), getCanonicalTla(value.range[index])]),
    );
  }
  throw new Error(`Unexpected value kind: ${value.kind}`);
};

// Runs a TypeScript module as JavaScript and returns what its getResult export returns.
const runJavaScript = (source: string) => {
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ESNext },
  }).outputText;
  const exports: { getResult?: () => unknown } = {};
  new Function("exports", output)(exports);
  if (exports.getResult === undefined) throw new Error("The module must export getResult");
  return exports.getResult();
};

// The last state that tsprover's spec reaches, where no action can run any more.
const runTla = async (source: string) => {
  const result = await check(compile(source));
  const state = result.violation?.trace.at(-1)?.state;
  if (result.status !== "deadlock" || state === undefined) {
    throw new Error(`Expected a deadlock, got ${result.status}: ${result.failure?.message ?? ""}`);
  }
  return state;
};

// The value of an expression, in JavaScript and in tsprover's TLA+.
export const evaluateExpression = async (expression: string, setup = "") => {
  const state = await runTla(`${setup}\nlet result = ${expression};`);
  return {
    expected: getCanonical(
      runJavaScript(`${setup}\nexport const getResult = () => (${expression});`),
    ),
    actual: getCanonicalTla(state.result),
  };
};

// The variables after an action runs statements once, in JavaScript and in tsprover's TLA+.
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
