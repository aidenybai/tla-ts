import ts from "@typescript/typescript6";
import type { Expression } from "../ast";
import type { Context } from "./context";
import { TlaTypeScriptError } from "../errors";
import { translateExpression } from "./expressions";
import type { Scope } from "./scope";
import { apply, string } from "./tla";

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
