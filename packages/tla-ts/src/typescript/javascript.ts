import ts from "@typescript/typescript6";
import type { Expression } from "../ast";
import { type Context, getSymbol } from "./context";
import { TlaTypeScriptError } from "../errors";
import { translateExpression } from "./expressions";
import type { Scope } from "./scope";
import { apply, boolean, ifExpression, number, string } from "./tla";

export const JAVASCRIPT_MODULE = `------------------------------ MODULE JavaScript ------------------------------
EXTENDS Integers, Sequences, TLC

CONSTANTS Undefined, Null

LOCAL Digits == {"-", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"}

TypeOf(value) ==
  LET text == ToString(value)
      first == SubSeq(text, 1, 1)
  IN CASE value = Undefined -> "undefined"
       [] value = Null -> "object"
       [] text \\in {"TRUE", "FALSE"} -> "boolean"
       [] first = "\\"" -> "string"
       [] \\A i \\in 1..Len(text) : SubSeq(text, i, i) \\in Digits -> "number"
       [] first \\in {"[", "<", "{", "("} \\cup Digits -> "object"
       [] OTHER -> "function"

RelativeIndex(index, length) == IF index < 0 THEN length + index ELSE index

ClampedIndex(index, length) ==
  LET relative == RelativeIndex(index, length)
  IN IF relative < 0 THEN 0 ELSE IF relative > length THEN length ELSE relative

SequenceWith(sequence, index, value) ==
  LET relative == RelativeIndex(index, Len(sequence))
  IN IF relative \\in 0..(Len(sequence) - 1)
     THEN [sequence EXCEPT ![relative + 1] = value]
     ELSE Assert(FALSE, "tla-ts can't throw the RangeError of with()")

SameValue(left, right) ==
  /\\ TypeOf(left) = TypeOf(right)
  /\\ Assert(TypeOf(left) # "object" \\/ left = Null \\/ right = Null,
            "tla-ts can't compare objects by identity")
  /\\ left = right
===============================================================================`;

export const useJavaScript = (operator: string, args: Expression[], context: Context) => {
  context.prelude.add("JavaScript");
  return apply(operator, args);
};

export const getTypeNames = (type: ts.Type): string[] | undefined => {
  if (type.isUnion()) {
    const names = type.types.map(getTypeNames);
    return names.every((name) => name !== undefined) ? [...new Set(names.flat())] : undefined;
  }
  const flags = type.flags;
  if (flags & ts.TypeFlags.Never) return [];
  if (flags & ts.TypeFlags.NumberLike) return ["number"];
  if (flags & ts.TypeFlags.StringLike) return ["string"];
  if (flags & ts.TypeFlags.BooleanLike) return ["boolean"];
  if (flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Void)) return ["undefined"];
  if (flags & ts.TypeFlags.Null) return ["null"];
  if (!(flags & ts.TypeFlags.Object)) return undefined;
  const isFunction =
    type.getCallSignatures().length > 0 ||
    type.getConstructSignatures().length > 0 ||
    type.getSymbol()?.name === "Function";
  return [isFunction ? "function" : "object"];
};

export const translateTypeOf = (node: ts.TypeOfExpression, scope: Scope, context: Context) => {
  const names = getTypeNames(context.checker.getTypeAtLocation(node.expression));
  const known = names && [...new Set(names.map((name) => (name === "null" ? "object" : name)))];
  if (known?.length === 1) return string(known[0]);
  if (context.modelValues.size > 0) {
    throw new TlaTypeScriptError("typeof can't tell a @symmetric value from a function", node);
  }
  return useJavaScript("TypeOf", [translateExpression(node.expression, scope, context)], context);
};

export const isComparable = (left: ts.Expression, right: ts.Expression, context: Context) => {
  const names = [left, right].map((node) => getTypeNames(context.checker.getTypeAtLocation(node)));
  if (names.some((name) => name === undefined)) return false;
  const kinds = new Set(
    names.flatMap((name) => name ?? []).filter((name) => name !== "null" && name !== "undefined"),
  );
  return kinds.size <= 1;
};

const CONVERSIONS = new Set(["Boolean", "String", "Number", "parseInt", "parseFloat"]);

const PARSERS = new Map<string, (text: string) => number>([
  ["parseInt", (text) => Number.parseInt(text)],
  ["parseFloat", Number.parseFloat],
]);

const getInteger = (value: number, node: ts.Node) => {
  if (!Number.isInteger(value) || Object.is(value, -0) || Math.abs(value) > 2 ** 31 - 1) {
    throw new TlaTypeScriptError(`Only integers are supported: ${node.getText()}`, node);
  }
  return number(value);
};

// The number that +argument or Number(argument) converts a value to.
export const translateToNumber = (
  argument: ts.Expression,
  node: ts.Expression,
  scope: Scope,
  context: Context,
) => {
  if (ts.isStringLiteral(argument)) return getInteger(Number(argument.text), node);
  const names = getTypeNames(context.checker.getTypeAtLocation(argument));
  const kind = names?.length === 1 ? names[0] : undefined;
  if (kind === "null") return number(0);
  const value = translateExpression(argument, scope, context);
  if (kind === "number") return value;
  if (kind === "boolean") return ifExpression(value, number(1), number(0));
  throw new TlaTypeScriptError(`Unsupported expression: ${node.getText()}`, node);
};

// A call to Boolean, String, Number, parseInt, or parseFloat, or undefined for any other call.
export const translateConversion = (node: ts.CallExpression, scope: Scope, context: Context) => {
  const callee = node.expression;
  const declarations = getSymbol(callee, context.checker)?.declarations ?? [];
  if (
    !ts.isIdentifier(callee) ||
    !CONVERSIONS.has(callee.text) ||
    declarations.length === 0 ||
    !declarations.every((declaration) => declaration.getSourceFile().isDeclarationFile)
  ) {
    return undefined;
  }
  const name = callee.text;
  const unsupported = new TlaTypeScriptError(`Unsupported call: ${node.getText()}`, node);
  const argument = node.arguments.at(0);
  if (argument === undefined) {
    if (name === "Boolean") return boolean(false);
    if (name === "String") return string("");
    if (name === "Number") return number(0);
    throw unsupported;
  }
  if (node.arguments.length > 1) throw unsupported;
  if (name === "Number") return translateToNumber(argument, node, scope, context);
  const parse = PARSERS.get(name);
  if (parse !== undefined && ts.isStringLiteral(argument)) {
    return getInteger(parse(argument.text), node);
  }
  const names = getTypeNames(context.checker.getTypeAtLocation(argument));
  const kind = names?.length === 1 ? names[0] : undefined;
  const value = translateExpression(argument, scope, context);
  const isEmpty = kind === "undefined" || kind === "null";
  if (name === "Boolean") {
    if (kind === "boolean") return value;
    if (kind === "number") return apply("#", [value, number(0)]);
    if (kind === "string") return apply("#", [value, string("")]);
    if (isEmpty || kind === "object" || kind === "function") return boolean(!isEmpty);
  }
  if (name === "String") {
    if (kind === "string") return value;
    if (kind === "number") return apply("ToString", [value]);
    if (kind === "boolean") return ifExpression(value, string("true"), string("false"));
    if (isEmpty) return string(kind);
  }
  throw unsupported;
};
