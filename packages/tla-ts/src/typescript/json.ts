import ts from "@typescript/typescript6";
import type { Expression } from "../ast";
import { type Context, getUndefined } from "./context";
import { TlaTypeScriptError } from "../errors";
import { translateExpression } from "./expressions";
import { getHeap, translateObjectValue } from "./heap";
import { getBuiltIn, isBuiltInObject, translateBuiltInValue } from "./intrinsics";
import { useJavaScript } from "./javascript";
import type { Scope } from "./scope";
import { apply, boolean, ifExpression, string } from "./tla";
import { getKind } from "./types";

const toEscape = (code: number) => `\\u${code.toString(16).padStart(4, "0")}`;

// The code units that QuoteJSONString escapes, which are the controls, the surrogates, the quote, and
// the backslash.
const JSON_ESCAPES = new Map<string, string>([
  ...Array.from({ length: 0x20 }, (_, code): [string, string] => [
    String.fromCharCode(code),
    toEscape(code),
  ]),
  ...Array.from({ length: 0x800 }, (_, offset): [string, string] => [
    String.fromCharCode(0xd800 + offset),
    toEscape(0xd800 + offset),
  ]),
  ["\b", "\\b"],
  ["\t", "\\t"],
  ["\n", "\\n"],
  ["\f", "\\f"],
  ["\r", "\\r"],
  ['"', '\\"'],
  ["\\", "\\\\"],
]);

// Merges functions in halves, so that the expression nests only as deep as the log of their count.
const mergeFunctions = (functions: Expression[]): Expression =>
  functions.length === 1
    ? functions[0]
    : apply("@@", [
        mergeFunctions(functions.slice(0, functions.length / 2)),
        mergeFunctions(functions.slice(functions.length / 2)),
      ]);

const COLLECTIONS = new Set(["Map", "Set", "WeakMap", "WeakSet"]);

// Whether a script may name a collection, which tla-ts can't tell from an array where it isn't on the
// heap.
const usesCollections = (node: ts.Node): boolean =>
  (ts.isIdentifier(node) && COLLECTIONS.has(node.text)) ||
  (ts.forEachChild(node, usesCollections) ?? false);

// Whether the heap still holds JSON's built-in method.
export const translateHoldsJson = (
  node: ts.Node,
  method: "stringify",
  scope: Scope,
  context: Context,
) =>
  useJavaScript(
    "HoldsBuiltIn",
    [
      getHeap(scope, node, context),
      translateBuiltInValue("JSON", node, context),
      string(method),
      string(`JSON.${method}`),
    ],
    context,
  );

// JSON.stringify of a value, a replacer, and a space, where the heap still holds the built-in.
export const translateJsonCall = (node: ts.CallExpression, scope: Scope, context: Context) => {
  const callee = node.expression;
  if (
    !ts.isPropertyAccessExpression(callee) ||
    callee.name.text !== "stringify" ||
    getBuiltIn(callee.expression, context) !== "JSON" ||
    context.heap === undefined
  ) {
    return undefined;
  }
  if (node.arguments.length > 3 || node.arguments.some(ts.isSpreadElement)) {
    throw new TlaTypeScriptError(`Unsupported call: ${node.getText()}`, node);
  }
  const values = [0, 1, 2].map((position) => {
    const argument = node.arguments.at(position);
    if (argument === undefined) return getUndefined(context);
    return getKind(argument, context) === "object" || isBuiltInObject(argument, context)
      ? translateObjectValue(argument, scope, context)
      : translateExpression(argument, scope, context);
  });
  const escapes = mergeFunctions(
    [...JSON_ESCAPES].map((entry) => apply(":>", [string(entry[0]), string(entry[1])])),
  );
  return ifExpression(
    translateHoldsJson(node, "stringify", scope, context),
    useJavaScript(
      "JSONStringify",
      [
        getHeap(scope, node, context),
        ...values,
        escapes,
        translateBuiltInValue("Array.prototype", node, context),
        translateBuiltInValue("Function.prototype", node, context),
        boolean(!usesCollections(node.getSourceFile())),
      ],
      context,
    ),
    apply("Assert", [
      boolean(false),
      string("tla-ts can't call JSON.stringify where a script replaced it"),
    ]),
  );
};
