import ts from "@typescript/typescript6";
import type { Context } from "./context";
import { TlaTypeScriptError } from "../errors";
import { translateExpression } from "./expressions";
import { useJavaScript } from "./javascript";
import type { Scope } from "./scope";
import { apply, identifier, string } from "./tla";
import { getKind, isHeapType, isNumberLike } from "./types";

const SHORT_CIRCUITS = new Set([
  ts.SyntaxKind.AmpersandAmpersandToken,
  ts.SyntaxKind.BarBarToken,
  ts.SyntaxKind.QuestionQuestionToken,
  ts.SyntaxKind.AmpersandAmpersandEqualsToken,
  ts.SyntaxKind.BarBarEqualsToken,
  ts.SyntaxKind.QuestionQuestionEqualsToken,
]);

export const getHeap = (scope: Scope, node: ts.Node, context: Context) => {
  const heap = context.heap === undefined ? undefined : scope.bindings.get(context.heap);
  if (heap === undefined) throw new TlaTypeScriptError("Use objects only in statements", node);
  return heap;
};

const getNumericKey = (node: ts.NumericLiteral) => string(String(Number(node.text)));

export const translatePropertyKey = (node: ts.Expression, scope: Scope, context: Context) => {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return string(node.text);
  }
  if (ts.isNumericLiteral(node)) return getNumericKey(node);
  const value = translateExpression(node, scope, context);
  if (getKind(node, context) === "string") return value;
  if (isNumberLike(node, context)) return apply("ToString", [value]);
  throw new TlaTypeScriptError("Use a string or a number as a key", node);
};

const translateMemberKey = (name: ts.PropertyName, scope: Scope, context: Context) => {
  if (ts.isComputedPropertyName(name)) return translatePropertyKey(name.expression, scope, context);
  if (ts.isIdentifier(name) || ts.isStringLiteral(name)) return string(name.text);
  if (ts.isNumericLiteral(name)) return getNumericKey(name);
  throw new TlaTypeScriptError("Unsupported key", name);
};

export const translateObject = (
  node: ts.ObjectLiteralExpression,
  scope: Scope,
  context: Context,
) => {
  context.prelude.add("JavaScript");
  return node.properties.reduce((object, property) => {
    if (ts.isPropertyAssignment(property)) {
      return useJavaScript(
        "Put",
        [
          object,
          translateMemberKey(property.name, scope, context),
          translateExpression(property.initializer, scope, context),
        ],
        context,
      );
    }
    if (ts.isShorthandPropertyAssignment(property)) {
      return useJavaScript(
        "Put",
        [object, string(property.name.text), translateExpression(property.name, scope, context)],
        context,
      );
    }
    if (ts.isSpreadAssignment(property) && getKind(property.expression, context) === "object") {
      return useJavaScript(
        "Spread",
        [
          object,
          getHeap(scope, property, context),
          translateExpression(property.expression, scope, context),
        ],
        context,
      );
    }
    throw new TlaTypeScriptError("Unsupported object member", property);
  }, identifier("EmptyObject"));
};

// Whether an object literal becomes a heap object. One that a built-in function takes, such as
// Array.from({ length: 2 }), does too, whatever type the function asks for.
const isObjectValue = (node: ts.ObjectLiteralExpression, context: Context) => {
  const checker = context.checker;
  const contextual = checker.getContextualType(node);
  const parent = node.parent;
  const isBuiltInArgument =
    ts.isCallExpression(parent) &&
    (checker.getResolvedSignature(parent)?.getDeclaration()?.getSourceFile().isDeclarationFile ??
      false);
  return (
    isBuiltInArgument ||
    contextual === undefined ||
    (contextual.flags & (ts.TypeFlags.Unknown | ts.TypeFlags.Any)) !== 0 ||
    checker.isTypeAssignableTo(checker.getNumberType(), contextual) ||
    isHeapType(checker.getNonNullableType(contextual), node, context)
  );
};

// The object literals that evaluating a node always makes, innermost first. Functions and operands
// that only sometimes run make none.
export const getAllocated = (node: ts.Node, context: Context): ts.ObjectLiteralExpression[] => {
  if (context.heap === undefined || ts.isFunctionLike(node) || ts.isClassLike(node)) return [];
  if (ts.isOptionalChain(node)) return [];
  if (ts.isConditionalExpression(node)) return getAllocated(node.condition, context);
  if (ts.isBinaryExpression(node)) {
    const kind = node.operatorToken.kind;
    if (SHORT_CIRCUITS.has(kind)) return getAllocated(node.left, context);
    const isPattern =
      kind === ts.SyntaxKind.EqualsToken &&
      (ts.isObjectLiteralExpression(node.left) || ts.isArrayLiteralExpression(node.left));
    return [
      ...(isPattern ? [] : getAllocated(node.left, context)),
      ...getAllocated(node.right, context),
    ];
  }
  const nested: ts.ObjectLiteralExpression[] = [];
  ts.forEachChild(node, (child) => {
    nested.push(...getAllocated(child, context));
  });
  return ts.isObjectLiteralExpression(node) && isObjectValue(node, context)
    ? [...nested, node]
    : nested;
};
