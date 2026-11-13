import ts from "@typescript/typescript6";
import type { Expression } from "../ast";
import { type Context, getUndefined, share, translateString } from "./context";
import { TlaTypeScriptError } from "../errors";
import { getNumberValue, translateExpression } from "./expressions";
import { getHeap, translateObjectValue } from "./heap";
import { getBuiltIn, isBuiltInObject, translateBuiltInValue } from "./intrinsics";
import { useJavaScript } from "./javascript";
import type { Scope } from "./scope";
import { apply, boolean, identifier, ifExpression, string } from "./tla";
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

// The text that JSON.parse reads where its argument is a literal, which tla-ts parses as it compiles.
// A reviver would need calls, so a call that passes one has no text.
export const getJsonText = (node: ts.Node, context: Context) => {
  if (
    !ts.isCallExpression(node) ||
    !ts.isPropertyAccessExpression(node.expression) ||
    node.expression.name.text !== "parse" ||
    getBuiltIn(node.expression.expression, context) !== "JSON" ||
    context.heap === undefined ||
    node.arguments.length !== 1
  ) {
    return undefined;
  }
  const argument = node.arguments[0];
  if (ts.isStringLiteral(argument) || ts.isNoSubstitutionTemplateLiteral(argument)) {
    return argument.text;
  }
  if (ts.isNumericLiteral(argument)) return String(Number(argument.text));
  return ts.isPrefixUnaryExpression(argument) &&
    argument.operator === ts.SyntaxKind.MinusToken &&
    ts.isNumericLiteral(argument.operand)
    ? String(-Number(argument.operand.text))
    : undefined;
};

// What JSON.parse gives for a text, or a SyntaxError where the text isn't JSON.
export const parseJson = (text: string): { value: unknown } | { error: SyntaxError } => {
  try {
    return { value: JSON.parse(text) };
  } catch (error) {
    if (error instanceof SyntaxError) return { error };
    throw error;
  }
};

// Whether the heap still holds JSON's built-in method.
export const translateHoldsJson = (
  node: ts.Node,
  method: "parse" | "stringify",
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

// The primitive that JSON.parse gives for a literal's text.
const translateParsed = (node: ts.CallExpression, text: string, context: Context) => {
  const parsed = parseJson(text);
  if ("error" in parsed) {
    return apply("Assert", [
      boolean(false),
      string("tla-ts can't throw the SyntaxError of JSON.parse here"),
    ]);
  }
  const value = parsed.value;
  if (typeof value === "string") return translateString(value, context);
  if (typeof value === "boolean") return boolean(value);
  if (value === null) {
    context.prelude.add("Null");
    return identifier("Null");
  }
  const converted = typeof value === "number" ? getNumberValue(value, context) : undefined;
  if (converted !== undefined) return converted;
  throw new TlaTypeScriptError(`Unsupported call: ${node.getText()}`, node);
};

// JSON.stringify of a value, a replacer, and a space, where the heap still holds the built-in.
const isStringify = (node: ts.CallExpression, context: Context) =>
  ts.isPropertyAccessExpression(node.expression) &&
  node.expression.name.text === "stringify" &&
  getBuiltIn(node.expression.expression, context) === "JSON" &&
  context.heap !== undefined;

// Whether a type may hold a BigInt, or an object or array that holds one, which JSON.stringify
// throws a TypeError for.
const mayHoldBigInt = (type: ts.Type, checker: ts.TypeChecker, seen: Set<ts.Type>): boolean => {
  if (seen.has(type)) return false;
  seen.add(type);
  if (
    (type.flags &
      (ts.TypeFlags.BigIntLike |
        ts.TypeFlags.Any |
        ts.TypeFlags.Unknown |
        ts.TypeFlags.NonPrimitive |
        ts.TypeFlags.Instantiable)) !==
    0
  ) {
    return true;
  }
  if (type.isUnionOrIntersection()) {
    return type.types.some((inner) => mayHoldBigInt(inner, checker, seen));
  }
  // JSON.stringify leaves out a function.
  if ((type.flags & ts.TypeFlags.Object) === 0 || type.getCallSignatures().length > 0) return false;
  return (
    type.getSymbol()?.name === "BigInt" ||
    type
      .getProperties()
      .some((property) => mayHoldBigInt(checker.getTypeOfSymbol(property), checker, seen)) ||
    checker.getIndexInfosOfType(type).some((info) => mayHoldBigInt(info.type, checker, seen))
  );
};

// JSON.stringify of a value that may hold a BigInt, which only statements can run, as it may throw.
export const isBigIntStringify = (node: ts.CallExpression, context: Context) => {
  const value = node.arguments.at(0);
  return (
    isStringify(node, context) &&
    value !== undefined &&
    mayHoldBigInt(context.checker.getTypeAtLocation(value), context.checker, new Set())
  );
};

// JSON.stringify of a value, a replacer, and a space, which gives JSONTypeError where it throws a
// TypeError.
export const translateStringify = (node: ts.CallExpression, scope: Scope, context: Context) => {
  if (node.arguments.length > 3 || node.arguments.some(ts.isSpreadElement)) {
    throw new TlaTypeScriptError(`Unsupported call: ${node.getText()}`, node);
  }
  context.builtIns.add("BigInt.prototype");
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

// JSON.stringify, or JSON.parse of a literal, where the heap still holds the built-in.
export const translateJsonCall = (node: ts.CallExpression, scope: Scope, context: Context) => {
  const text = getJsonText(node, context);
  if (text !== undefined) {
    return ifExpression(
      translateHoldsJson(node, "parse", scope, context),
      translateParsed(node, text, context),
      apply("Assert", [
        boolean(false),
        string("tla-ts can't call JSON.parse where a script replaced it"),
      ]),
    );
  }
  if (!isStringify(node, context)) return undefined;
  return share(translateStringify(node, scope, context), "stringified", context, (value) =>
    ifExpression(
      useJavaScript("IsError", [value], context),
      apply("Assert", [
        boolean(false),
        string("tla-ts can't throw the TypeError of JSON.stringify here"),
      ]),
      value,
    ),
  );
};
