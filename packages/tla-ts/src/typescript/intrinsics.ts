import ts from "@typescript/typescript6";
import { type Context, getSymbol } from "./context";
import { TlaTypeScriptError } from "../errors";
import { getConstructor, getErrorClass, NATIVE_ERRORS } from "./exceptions";
import { translateExpression } from "./expressions";
import { useJavaScript } from "./javascript";
import type { Scope } from "./scope";
import { boolean, identifier, string } from "./tla";
import { getKind } from "./types";

// Built-in constructors whose prototype objects tla-ts compiles to constants, which compare by
// identity.
const CONSTRUCTORS = new Set([
  ...NATIVE_ERRORS,
  "Object",
  "Function",
  "Array",
  "String",
  "Boolean",
  "Number",
  "Symbol",
  "BigInt",
  "Map",
  "Set",
  "WeakMap",
  "WeakSet",
  "WeakRef",
  "FinalizationRegistry",
  "Promise",
  "RegExp",
  "Date",
  "ArrayBuffer",
  "DataView",
]);

const isLibrary = (symbol: ts.Symbol) =>
  (symbol.declarations ?? []).length > 0 &&
  (symbol.declarations ?? []).every((declaration) => declaration.getSourceFile().isDeclarationFile);

const getBuiltIn = (node: ts.Expression, context: Context) => {
  const symbol = getSymbol(node, context.checker);
  return ts.isIdentifier(node) &&
    CONSTRUCTORS.has(node.text) &&
    symbol !== undefined &&
    isLibrary(symbol)
    ? node.text
    : undefined;
};

const isNativeError = (name: string) => NATIVE_ERRORS.has(name) && name !== "Error";

// The prototype of a built-in object, which "null" names.
const getParent = (name: string) => {
  if (name === "Object.prototype") return "null";
  if (name === "Function.prototype") return "Object.prototype";
  if (name.endsWith(".prototype")) {
    return isNativeError(name.slice(0, -".prototype".length))
      ? "Error.prototype"
      : "Object.prototype";
  }
  return isNativeError(name) ? "Error" : "Function.prototype";
};

const isPlainFunction = (type: ts.Type) => {
  const declarations = type.getCallSignatures().map((signature) => signature.getDeclaration());
  return (
    declarations.length > 0 &&
    type.getConstructSignatures().length === 0 &&
    declarations.every(
      (declaration) =>
        !declaration.getSourceFile().isDeclarationFile &&
        (ts.isArrowFunction(declaration) ||
          ts.isFunctionExpression(declaration) ||
          ts.isFunctionDeclaration(declaration)) &&
        declaration.asteriskToken === undefined &&
        !(ts.getCombinedModifierFlags(declaration) & ts.ModifierFlags.Async),
    )
  );
};

// The built-in object that a node is, such as "Array" or "Array.prototype".
const getName = (node: ts.Expression, context: Context): string | undefined => {
  if (ts.isParenthesizedExpression(node)) return getName(node.expression, context);
  const builtIn = getBuiltIn(node, context);
  if (builtIn !== undefined) return builtIn;
  if (ts.isPropertyAccessExpression(node) && node.name.text === "prototype") {
    const owner = getBuiltIn(node.expression, context);
    return owner === undefined ? undefined : `${owner}.prototype`;
  }
  if (isPrototypeCall(node, context)) {
    const parent = getPrototype(node.arguments[0], context);
    return parent === "null" ? undefined : parent;
  }
  return undefined;
};

// The built-in object that is the prototype of a node's value, or "null".
const getPrototype = (node: ts.Expression, context: Context): string | undefined => {
  const name = getName(node, context);
  if (name !== undefined) return getParent(name);
  const checker = context.checker;
  const type = checker.getTypeAtLocation(node);
  if (type.isUnion()) return undefined;
  if (type.flags & ts.TypeFlags.NumberLike) return "Number.prototype";
  if (type.flags & ts.TypeFlags.StringLike) return "String.prototype";
  if (type.flags & ts.TypeFlags.BooleanLike) return "Boolean.prototype";
  if (type.flags & ts.TypeFlags.BigIntLike) return "BigInt.prototype";
  const kind = getKind(node, context);
  if (kind === "sequence") return "Array.prototype";
  if (kind === "set") return "Set.prototype";
  if (kind === "map") return "Map.prototype";
  const classes = getErrorClass(type.getSymbol(), checker);
  if (classes !== undefined) {
    return NATIVE_ERRORS.has(classes[0].name) && isLibrary(classes[0])
      ? `${classes[0].name}.prototype`
      : undefined;
  }
  if (isPlainFunction(type)) return "Function.prototype";
  return (type.getSymbol()?.flags ?? 0) & ts.SymbolFlags.ObjectLiteral
    ? "Object.prototype"
    : undefined;
};

export const isBuiltInObject = (node: ts.Expression, context: Context) =>
  getName(node, context) !== undefined;

const isPrototypeCall = (node: ts.Node, context: Context): node is ts.CallExpression =>
  ts.isCallExpression(node) &&
  ts.isPropertyAccessExpression(node.expression) &&
  getBuiltIn(node.expression.expression, context) === "Object" &&
  node.expression.name.text === "getPrototypeOf" &&
  node.arguments.length === 1;

const isPrototypeOfCall = (node: ts.Node): node is ts.CallExpression =>
  ts.isCallExpression(node) &&
  ts.isPropertyAccessExpression(node.expression) &&
  node.expression.name.text === "isPrototypeOf" &&
  node.arguments.length === 1;

// Whether a value is only compared where it appears, so a built-in object's constant can stand for
// it, since TLA+ can't read its properties.
const isCompared = (node: ts.Expression, context: Context): boolean => {
  const parent = node.parent;
  if (ts.isParenthesizedExpression(parent)) return isCompared(parent, context);
  if (ts.isBinaryExpression(parent)) {
    return [
      ts.SyntaxKind.EqualsEqualsEqualsToken,
      ts.SyntaxKind.ExclamationEqualsEqualsToken,
    ].includes(parent.operatorToken.kind);
  }
  if (ts.isVariableDeclaration(parent) && parent.initializer === node) {
    const name = parent.name;
    if (!ts.isIdentifier(name)) return false;
    const symbol = getSymbol(name, context.checker);
    const references: ts.Identifier[] = [];
    const visit = (child: ts.Node) => {
      if (
        ts.isIdentifier(child) &&
        child !== name &&
        getSymbol(child, context.checker) === symbol
      ) {
        references.push(child);
      }
      ts.forEachChild(child, visit);
    };
    visit(node.getSourceFile());
    return references.every(
      (reference) =>
        (ts.isBinaryExpression(reference.parent) &&
          reference.parent.left === reference &&
          reference.parent.operatorToken.kind === ts.SyntaxKind.EqualsToken) ||
        isCompared(reference, context),
    );
  }
  if (isPrototypeCall(parent, context)) return true;
  if (isPrototypeOfCall(parent)) return true;
  if (ts.isPropertyAccessExpression(parent) && parent.expression === node) {
    return isPrototypeOfCall(parent.parent) && parent.parent.expression === parent;
  }
  if (ts.isCallExpression(parent) && parent.arguments.includes(node)) {
    const signature = context.checker.getResolvedSignature(parent);
    const position = parent.arguments.indexOf(node);
    const parameter = signature?.getParameters()[position];
    const parameterType =
      parameter === undefined ? undefined : context.checker.getTypeOfSymbol(parameter);
    return (
      ((parameterType?.flags ?? 0) & ts.TypeFlags.Unknown ||
        (ts.isPropertyAccessExpression(parent.expression) &&
          getBuiltIn(parent.expression.expression, context) === "Object" &&
          parent.expression.name.text === "is")) !== 0
    );
  }
  return false;
};

const getGlobal = (name: string, node: ts.Node, context: Context) => {
  const symbol = context.checker
    .getSymbolsInScope(node.getSourceFile(), ts.SymbolFlags.Value)
    .find((candidate) => candidate.name === name && isLibrary(candidate));
  if (symbol === undefined) throw new TlaTypeScriptError(`Unknown built-in: ${name}`, node);
  return symbol;
};

// A built-in constructor is a model value, as error constructors are. Function.prototype is one
// too, as it's a function, and other prototypes are functions from a model value no program can
// name.
const translateBuiltIn = (name: string, node: ts.Node, context: Context) => {
  if (name === "null") {
    context.prelude.add("Null");
    return identifier("Null");
  }
  if (!name.includes(".")) return getConstructor(getGlobal(name, node, context), context);
  if (name === "Function.prototype") {
    const prototype = context.checker
      .getTypeOfSymbol(getGlobal("Function", node, context))
      .getProperty("prototype");
    if (prototype === undefined) throw new TlaTypeScriptError("Unknown built-in", node);
    return getConstructor(prototype, context, "FunctionPrototype");
  }
  return useJavaScript(":>", [identifier("Intrinsic"), string(name)], context);
};

// Evaluates the value whose prototype a call asks for, which mustn't call anything that could
// throw, since only its type decides the result.
const evaluate = (node: ts.Expression, scope: Scope, context: Context) => {
  const visit = (child: ts.Node) => {
    if (ts.isFunctionLike(child)) return;
    const isBuiltInNew =
      ts.isNewExpression(child) && getBuiltIn(child.expression, context) !== undefined;
    if (
      (ts.isCallExpression(child) && !isPrototypeCall(child, context)) ||
      (ts.isNewExpression(child) && !isBuiltInNew)
    ) {
      throw new TlaTypeScriptError("Pass getPrototypeOf a value without calls", child);
    }
    ts.forEachChild(child, visit);
  };
  visit(node);
  if (!ts.isFunctionLike(node)) translateExpression(node, scope, context);
};

// A built-in object, or Object.getPrototypeOf or isPrototypeOf on built-in objects, or undefined
// for any other node.
export const translateIntrinsic = (node: ts.Expression, scope: Scope, context: Context) => {
  if (isPrototypeOfCall(node) && ts.isPropertyAccessExpression(node.expression)) {
    const owner = getName(node.expression.expression, context);
    if (owner === undefined) return undefined;
    const first = getPrototype(node.arguments[0], context);
    if (first === undefined) {
      throw new TlaTypeScriptError("isPrototypeOf needs a value whose type tells", node);
    }
    evaluate(node.arguments[0], scope, context);
    const getChain = (name: string): string[] =>
      name === "null" ? [] : [name, ...getChain(getParent(name))];
    return boolean(getChain(first).includes(owner));
  }
  const isCall = isPrototypeCall(node, context);
  const name = isCall ? getPrototype(node.arguments[0], context) : getName(node, context);
  if (isCall && name === undefined) {
    throw new TlaTypeScriptError("getPrototypeOf needs a value whose type tells", node);
  }
  if (name === undefined || (ts.isIdentifier(node) && !isCompared(node, context))) {
    return undefined;
  }
  if (!isCompared(node, context)) {
    throw new TlaTypeScriptError(
      `Compare ${node.getText()} only with === or assert.sameValue`,
      node,
    );
  }
  if (isCall) {
    evaluate(node.arguments[0], scope, context);
  }
  const symbol = ts.isIdentifier(node) ? getSymbol(node, context.checker) : undefined;
  return symbol === undefined
    ? translateBuiltIn(name, node, context)
    : getConstructor(symbol, context);
};
