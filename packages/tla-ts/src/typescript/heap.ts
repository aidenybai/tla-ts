import ts from "@typescript/typescript6";
import { type Context, getUndefined, isMethodCall, type MethodCall } from "./context";
import { TlaTypeScriptError } from "../errors";
import { translateExpression } from "./expressions";
import { isBuiltInObject, translateBuiltInObject } from "./intrinsics";
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
    const isPrototype =
      ts.isPropertyAssignment(property) &&
      (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) &&
      property.name.text === "__proto__";
    if (isPrototype) {
      return useJavaScript(
        "WithPrototype",
        [object, translateExpression(property.initializer, scope, context)],
        context,
      );
    }
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

// The heap after a node from getAllocated adds the object it makes.
export const translateAllocated = (node: ts.Expression, scope: Scope, context: Context) => {
  const heap = getHeap(scope, node, context);
  if (ts.isObjectLiteralExpression(node)) {
    return apply("Append", [heap, translateObject(node, scope, context)]);
  }
  if (ts.isCallExpression(node) && isDescription(node, context)) {
    const described = useJavaScript(
      "Describe",
      [
        heap,
        translateExpression(node.arguments[0], scope, context),
        translatePropertyKey(node.arguments[1], scope, context),
      ],
      context,
    );
    return apply("Append", [heap, described]);
  }
  if (!ts.isCallExpression(node) || !isCreation(node, context)) {
    throw new TlaTypeScriptError("Unsupported object", node);
  }
  const prototype = node.arguments[0];
  const properties = node.arguments.at(1);
  return useJavaScript(
    "Create",
    [
      heap,
      translateBuiltInObject(prototype, context) ?? translateExpression(prototype, scope, context),
      properties === undefined
        ? getUndefined(context)
        : translateExpression(properties, scope, context),
    ],
    context,
  );
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

export const isDescription = (node: ts.Node, context: Context) =>
  isMethodCall(node) &&
  node.expression.expression.getText() === "Object" &&
  node.expression.name.text === "getOwnPropertyDescriptor" &&
  node.arguments.length >= 2 &&
  getKind(node.arguments[0], context) === "object";

// Object.create, with a prototype that tla-ts can tell is an object or null.
export const isCreation = (node: ts.Node, context: Context) => {
  if (
    !isMethodCall(node) ||
    node.expression.expression.getText() !== "Object" ||
    node.expression.name.text !== "create" ||
    node.arguments.length === 0
  ) {
    return false;
  }
  const prototype = node.arguments[0];
  const properties = node.arguments.at(1);
  return (
    (prototype.kind === ts.SyntaxKind.NullKeyword ||
      getKind(prototype, context) === "object" ||
      isBuiltInObject(prototype, context)) &&
    (properties === undefined || getKind(properties, context) === "object")
  );
};

export const isAllocation = (node: ts.Node, context: Context): node is ts.CallExpression =>
  ts.isCallExpression(node) && (isDescription(node, context) || isCreation(node, context));

// The object literals, descriptions, and creations that evaluating a node always makes, innermost
// first.
// Functions and operands that only sometimes run make none.
export const getAllocated = (node: ts.Node, context: Context): ts.Expression[] => {
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
  const nested: ts.Expression[] = [];
  ts.forEachChild(node, (child) => {
    nested.push(...getAllocated(child, context));
  });
  const isAllocated =
    (ts.isObjectLiteralExpression(node) && isObjectValue(node, context)) ||
    isAllocation(node, context);
  return isAllocated ? [...nested, node] : nested;
};

// The operators of the built-in functions that change an object's properties, with how many
// arguments each takes and which of them must be objects.
const OBJECT_CHANGES = new Map([
  ["defineProperty", { operator: "DefineProperty", arity: 3, objects: [0, 2] }],
  ["defineProperties", { operator: "DefineProperties", arity: 2, objects: [0, 1] }],
  ["freeze", { operator: "Freeze", arity: 1, objects: [0] }],
  ["seal", { operator: "Seal", arity: 1, objects: [0] }],
  ["preventExtensions", { operator: "PreventExtensions", arity: 1, objects: [0] }],
]);

export const isObjectChange = (node: ts.Node): node is MethodCall =>
  isMethodCall(node) &&
  node.expression.expression.getText() === "Object" &&
  OBJECT_CHANGES.has(node.expression.name.text);

// The error that JavaScript itself may throw where a node runs.
export const getEngineError = (node: ts.Node) =>
  isObjectChange(node) && node.expression.name.text.startsWith("define") ? "TypeError" : undefined;

// A call that changes an object's properties. A definition gives a record of the heap after it
// and whether it succeeded, since one that fails throws a TypeError, and the others give the heap.
export const translateObjectChange = (node: MethodCall, scope: Scope, context: Context) => {
  const method = node.expression.name.text;
  const change = OBJECT_CHANGES.get(method);
  const isObject = (position: number) => {
    const argument = node.arguments.at(position);
    return argument !== undefined && getKind(argument, context) === "object";
  };
  if (change === undefined || !change.objects.every(isObject)) {
    throw new TlaTypeScriptError(`Unsupported statement: ${node.getText()}`, node);
  }
  const values = node.arguments
    .slice(0, change.arity)
    .map((argument, position) =>
      method === "defineProperty" && position === 1
        ? translatePropertyKey(argument, scope, context)
        : translateExpression(argument, scope, context),
    );
  return {
    change: useJavaScript(change.operator, [getHeap(scope, node, context), ...values], context),
    isFallible: method.startsWith("define"),
  };
};
