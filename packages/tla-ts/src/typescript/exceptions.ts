import ts from "@typescript/typescript6";
import type { Expression } from "../ast";
import { type Context, getSymbol, getUndefined, share } from "./context";
import { TlaTypeScriptError } from "../errors";
import { translateExpression } from "./expressions";
import { getTypeNames, useJavaScript } from "./javascript";
import type { Scope } from "./scope";
import { apply, field, identifier, ifExpression, junction, record, set, string } from "./tla";

const NATIVE_ERRORS = new Set([
  "Error",
  "TypeError",
  "RangeError",
  "SyntaxError",
  "ReferenceError",
  "EvalError",
  "URIError",
]);

const isNative = (symbol: ts.Symbol) =>
  NATIVE_ERRORS.has(symbol.name) &&
  (symbol.declarations ?? []).length > 0 &&
  (symbol.declarations ?? []).every((declaration) => declaration.getSourceFile().isDeclarationFile);

const getBase = (symbol: ts.Symbol, checker: ts.TypeChecker) => {
  const expression = (symbol.declarations ?? [])
    .flatMap((declaration) =>
      ts.isClassDeclaration(declaration) || ts.isInterfaceDeclaration(declaration)
        ? (declaration.heritageClauses ?? [])
        : [],
    )
    .find((clause) => clause.token === ts.SyntaxKind.ExtendsKeyword)?.types[0]?.expression;
  return expression === undefined ? undefined : getSymbol(expression, checker);
};

export const getErrorClass = (
  symbol: ts.Symbol | undefined,
  checker: ts.TypeChecker,
): ts.Symbol[] | undefined => {
  if (symbol === undefined) return undefined;
  const base = getBase(symbol, checker);
  if (isNative(symbol)) return [symbol, ...(base === undefined ? [] : [base])];
  const declaration = symbol.valueDeclaration;
  if (
    declaration === undefined ||
    !ts.isClassDeclaration(declaration) ||
    declaration.members.length > 0
  ) {
    return undefined;
  }
  const inherited = getErrorClass(base, checker);
  return inherited === undefined ? undefined : [symbol, ...inherited];
};

export const getConstructor = (symbol: ts.Symbol, context: Context) => {
  const existing = context.constructors.get(symbol);
  if (existing !== undefined) return identifier(existing);
  const name = context.names.getFresh(symbol.name);
  context.constructors.set(symbol, name);
  return identifier(name);
};

export const translateNewError = (
  node: ts.NewExpression,
  classes: ts.Symbol[],
  scope: Scope,
  context: Context,
) => {
  const argumentNodes = node.arguments ?? [];
  if (argumentNodes.length > 1) {
    throw new TlaTypeScriptError("Error options aren't supported", node);
  }
  const message = argumentNodes.at(0);
  const value =
    message === undefined
      ? string("")
      : getTypeNames(context.checker.getTypeAtLocation(message))?.includes("undefined") !== false
        ? share(translateExpression(message, scope, context), "message", context, (shared) =>
            ifExpression(apply("=", [shared, getUndefined(context)]), string(""), shared),
          )
        : translateExpression(message, scope, context);
  const native = classes.find(isNative);
  if (native === undefined) throw new TlaTypeScriptError("Unknown error class", node);
  return record("Record", [
    { name: "constructor", value: getConstructor(classes[0], context) },
    { name: "message", value },
    { name: "name", value: string(native.name) },
  ]);
};

const isCaught = (node: ts.Expression, context: Context) => {
  const declaration = getSymbol(node, context.checker)?.valueDeclaration;
  return (
    ts.isIdentifier(node) &&
    declaration !== undefined &&
    ts.isVariableDeclaration(declaration) &&
    ts.isCatchClause(declaration.parent)
  );
};

const getSubclasses = (node: ts.Node, symbol: ts.Symbol, context: Context) => {
  const found = new Map<ts.Symbol, Expression>();
  const visit = (child: ts.Node) => {
    if (ts.isNewExpression(child)) {
      const classes = getErrorClass(getSymbol(child.expression, context.checker), context.checker);
      if (classes?.includes(symbol)) found.set(classes[0], getConstructor(classes[0], context));
    }
    ts.forEachChild(child, visit);
  };
  visit(node.getSourceFile());
  return [...found.values()];
};

export const translateInstanceOf = (node: ts.BinaryExpression, scope: Scope, context: Context) => {
  const symbol = getSymbol(node.right, context.checker);
  const classes = getErrorClass(symbol, context.checker);
  if (symbol === undefined || classes === undefined) {
    throw new TlaTypeScriptError(`Unsupported instanceof: ${node.right.getText()}`, node);
  }
  const value = translateExpression(node.left, scope, context);
  const subclasses = set(getSubclasses(node, symbol, context));
  if (getErrorClass(context.checker.getTypeAtLocation(node.left).getSymbol(), context.checker)) {
    return apply("\\in", [field(value, "constructor"), subclasses]);
  }
  if (!isCaught(node.left, context)) {
    throw new TlaTypeScriptError("instanceof needs an error or a caught value", node);
  }
  return share(value, "caught", context, (caught) =>
    junction("And", [
      apply("=", [useJavaScript("TypeOf", [caught], context), string("object")]),
      apply("#", [caught, identifier("Null")]),
      apply("\\in", [field(caught, "constructor"), subclasses]),
    ]),
  );
};

export const translateThrown = (node: ts.Expression, scope: Scope, context: Context) => {
  const type = context.checker.getTypeAtLocation(node);
  const names = getTypeNames(type);
  const isPrimitive = names?.every((name) => name !== "object" && name !== "function") === true;
  if (
    !isPrimitive &&
    getErrorClass(type.getSymbol(), context.checker) === undefined &&
    !isCaught(node, context)
  ) {
    throw new TlaTypeScriptError("Throw an error or a primitive", node);
  }
  return translateExpression(node, scope, context);
};
