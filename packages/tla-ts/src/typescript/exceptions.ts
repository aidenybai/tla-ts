import ts from "@typescript/typescript6";
import type { Expression } from "../ast";
import {
  type Context,
  getHeapClass,
  getLiteralName,
  getSymbol,
  getUndefined,
  isOnce,
  share,
} from "./context";
import { TlaTypeScriptError } from "../errors";
import { translateExpression } from "./expressions";
import { getEngineErrors, getHeap, translateObjectValue } from "./heap";
import { getGeneratorPrototypeRef, translateBuiltInInstanceOf } from "./intrinsics";
import { getTypeNames, useJavaScript } from "./javascript";
import type { Scope } from "./scope";
import { getKind, isGeneratorType } from "./types";
import { apply, field, identifier, ifExpression, record, set, string } from "./tla";

export const NATIVE_ERRORS = new Set([
  "Error",
  "TypeError",
  "RangeError",
  "SyntaxError",
  "ReferenceError",
  "EvalError",
  "URIError",
  "SuppressedError",
  "AggregateError",
]);

const isNative = (symbol: ts.Symbol) =>
  NATIVE_ERRORS.has(symbol.name) &&
  (symbol.declarations ?? []).length > 0 &&
  (symbol.declarations ?? []).every((declaration) => declaration.getSourceFile().isDeclarationFile);

const getBase = (symbol: ts.Symbol, checker: ts.TypeChecker) => {
  const expression = (symbol.declarations ?? [])
    .flatMap((declaration) =>
      ts.isClassLike(declaration) || ts.isInterfaceDeclaration(declaration)
        ? (declaration.heritageClauses ?? [])
        : [],
    )
    .find((clause) => clause.token === ts.SyntaxKind.ExtendsKeyword)?.types[0]?.expression;
  return expression === undefined ? undefined : getSymbol(expression, checker);
};

// A class expression that a const holds, which the script evaluates once, so the const names it.
const isConstClass = (node: ts.Node): node is ts.ClassExpression =>
  ts.isClassExpression(node) &&
  ts.isVariableDeclaration(node.parent) &&
  node.parent.initializer === node &&
  (ts.getCombinedNodeFlags(node.parent) & ts.NodeFlags.Const) !== 0 &&
  isOnce(node.parent);

export const getErrorClass = (
  symbol: ts.Symbol | undefined,
  checker: ts.TypeChecker,
): ts.Symbol[] | undefined => {
  if (symbol === undefined) return undefined;
  const base = getBase(symbol, checker);
  if (isNative(symbol)) return [symbol, ...(base === undefined ? [] : [base])];
  const declaration = symbol.valueDeclaration;
  const held =
    declaration !== undefined && ts.isVariableDeclaration(declaration)
      ? declaration.initializer
      : undefined;
  if (held !== undefined && ts.isClassExpression(held)) {
    return getErrorClass(checker.getTypeAtLocation(held).getSymbol(), checker);
  }
  if (
    declaration === undefined ||
    !(ts.isClassDeclaration(declaration) || isConstClass(declaration)) ||
    declaration.members.length > 0
  ) {
    return undefined;
  }
  const inherited = getErrorClass(base, checker);
  return inherited === undefined ? undefined : [symbol, ...inherited];
};

export const getConstructor = (
  key: ts.Symbol | ts.Node,
  context: Context,
  preferred = "name" in key && typeof key.name === "string" ? key.name : "function",
) => {
  const existing = context.constructors.get(key);
  if (existing !== undefined) return identifier(existing);
  // TLC types a model value whose name has _ second, and such a value can't meet a string.
  const fresh = context.names.getFresh(preferred);
  const name = fresh[1] === "_" ? context.names.getFresh(`fn${preferred}`) : fresh;
  context.constructors.set(key, name);
  return identifier(name);
};

const getNative = (name: string, node: ts.Node, context: Context) => {
  const symbol = context.checker
    .getSymbolsInScope(node.getSourceFile(), ts.SymbolFlags.Value)
    .find((candidate) => candidate.name === name && isNative(candidate));
  if (symbol === undefined) throw new TlaTypeScriptError(`Unknown built-in: ${name}`, node);
  return symbol;
};

// A script's heap reads an error's properties through its constructor's prototype.
const includeError = (name: string, context: Context) => {
  context.builtIns.add(name);
  context.builtIns.add(`${name}.prototype`);
};

// An error that JavaScript itself throws, such as the TypeError of a failed defineProperty.
// An AggregateError also holds its errors.
export const translateEngineError = (
  name: string,
  node: ts.Node,
  context: Context,
  errors?: Expression,
) => {
  const symbol = getNative(name, node, context);
  includeError(name, context);
  return record("Record", [
    { name: "constructor", value: getConstructor(symbol, context) },
    ...(errors === undefined ? [] : [{ name: "errors", value: errors }]),
    { name: "message", value: string("") },
    { name: "name", value: string(name) },
  ]);
};

// The SuppressedError that disposing a resource throws where an error already completed the
// statements, which holds both.
export const translateSuppressedError = (
  error: Expression,
  suppressed: Expression,
  node: ts.Node,
  context: Context,
) => {
  const symbol = getNative("SuppressedError", node, context);
  includeError("SuppressedError", context);
  return record("Record", [
    { name: "constructor", value: getConstructor(symbol, context) },
    { name: "message", value: string("") },
    { name: "name", value: string("SuppressedError") },
    { name: "error", value: error },
    { name: "suppressed", value: suppressed },
  ]);
};

// The native error class that a call constructs an error of, as new does.
export const getCalledError = (node: ts.Node, context: Context) => {
  const classes = ts.isCallExpression(node)
    ? getErrorClass(getSymbol(node.expression, context.checker), context.checker)
    : undefined;
  return classes !== undefined && isNative(classes[0]) ? classes : undefined;
};

export const translateNewError = (
  node: ts.NewExpression | ts.CallExpression,
  classes: ts.Symbol[],
  scope: Scope,
  context: Context,
) => {
  const native = classes.find(isNative);
  if (native === undefined) throw new TlaTypeScriptError("Unknown error class", node);
  // A SuppressedError takes the error and the suppressed error before its message.
  const held = native.name === "SuppressedError" ? ["error", "suppressed"] : [];
  const argumentNodes = node.arguments ?? [];
  if (classes.some((symbol) => isNative(symbol) && symbol.name === "AggregateError")) {
    throw new TlaTypeScriptError("Unsupported constructor: new AggregateError", node);
  }
  if (argumentNodes.length > held.length + 1) {
    throw new TlaTypeScriptError("Error options aren't supported", node);
  }
  const message = argumentNodes.at(held.length);
  const value =
    message === undefined
      ? string("")
      : getTypeNames(context.checker.getTypeAtLocation(message), context.checker)?.includes(
            "undefined",
          ) !== false
        ? share(translateExpression(message, scope, context), "message", context, (shared) =>
            ifExpression(apply("=", [shared, getUndefined(context)]), string(""), shared),
          )
        : translateExpression(message, scope, context);
  if (native === classes[0]) includeError(native.name, context);
  const identity = scope.allocated.get(node);
  return record("Record", [
    { name: "constructor", value: getConstructor(classes[0], context) },
    ...(identity === undefined ? [] : [{ name: "identity", value: identity }]),
    { name: "message", value },
    { name: "name", value: string(native.name) },
    ...held.map((name, position) => {
      const argument = argumentNodes.at(position);
      return {
        name,
        value:
          argument === undefined
            ? getUndefined(context)
            : translateExpression(argument, scope, context),
      };
    }),
  ]);
};

// A caught value, or what a SuppressedError holds, which may be any value.
const isCaught = (node: ts.Expression, context: Context): boolean => {
  const declaration = getSymbol(node, context.checker)?.valueDeclaration;
  if (
    ts.isPropertyAccessExpression(node) &&
    ["error", "suppressed"].includes(node.name.text) &&
    getErrorClass(
      context.checker.getTypeAtLocation(node.expression).getSymbol(),
      context.checker,
    )?.at(-2)?.name === "SuppressedError"
  ) {
    return true;
  }
  if (!ts.isIdentifier(node) || declaration === undefined) return false;
  if (ts.isVariableDeclaration(declaration)) return ts.isCatchClause(declaration.parent);
  // A promise's value or reason, which a handler that then or catch takes gets.
  const handler = declaration.parent;
  const call = ts.findAncestor(
    handler.parent,
    (ancestor) => !ts.isParenthesizedExpression(ancestor) && !ts.isAsExpression(ancestor),
  );
  return (
    ts.isParameter(declaration) &&
    (ts.isArrowFunction(handler) || ts.isFunctionExpression(handler)) &&
    call !== undefined &&
    ts.isCallExpression(call) &&
    ts.isPropertyAccessExpression(call.expression) &&
    ["then", "catch"].includes(call.expression.name.text) &&
    context.checker.getTypeAtLocation(call.expression.expression).getSymbol()?.name === "Promise"
  );
};

// A caught value without a type, or a property of one, whose reads Get runs, as it may be any value.
export const isCaughtRead = (node: ts.Expression, context: Context): boolean =>
  (context.checker.getTypeAtLocation(node).flags & ts.TypeFlags.Any) !== 0 &&
  (isCaught(node, context) ||
    ((ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) &&
      isCaughtRead(node.expression, context)));

const getSubclasses = (node: ts.Node, symbol: ts.Symbol, context: Context) => {
  const found = new Map<ts.Symbol, Expression>();
  const visit = (child: ts.Node) => {
    [
      ts.isNewExpression(child) ? getSymbol(child.expression, context.checker) : undefined,
      ...getEngineErrors(child, context).map((thrown) => getNative(thrown, child, context)),
    ].forEach((created) => {
      const classes = getErrorClass(created, context.checker);
      if (classes?.includes(symbol)) found.set(classes[0], getConstructor(classes[0], context));
    });
    ts.forEachChild(child, visit);
  };
  visit(node.getSourceFile());
  return [...found.values()];
};

export const translateInstanceOf = (node: ts.BinaryExpression, scope: Scope, context: Context) => {
  const rightClasses = getErrorClass(getSymbol(node.right, context.checker), context.checker);
  // An object on the heap, such as an error that it holds, is an instance where the constructor's
  // prototype is on its chain.
  if (
    (getHeapClass(node.right, context) !== undefined ||
      (rightClasses !== undefined && isNative(rightClasses[0]))) &&
    getKind(node.left, context) === "object"
  ) {
    const heap = getHeap(scope, node, context);
    return useJavaScript(
      "IsPrototypeOf",
      [
        heap,
        useJavaScript(
          "Get",
          [heap, translateExpression(node.right, scope, context), string("prototype")],
          context,
        ),
        translateObjectValue(node.left, scope, context),
      ],
      context,
    );
  }
  // A generator function whose prototype object the heap holds, and whose @@hasInstance is
  // Function.prototype's, which a script can't change.
  const generatorPrototype = getGeneratorPrototypeRef(node.right, context);
  if (generatorPrototype !== undefined) {
    return useJavaScript(
      isGeneratorType(node.left, context) ? "GeneratorInheritsFrom" : "InheritsFrom",
      [
        getHeap(scope, node, context),
        generatorPrototype,
        translateExpression(node.left, scope, context),
      ],
      context,
    );
  }
  const symbol = getSymbol(node.right, context.checker);
  const classes = getErrorClass(symbol, context.checker);
  const builtIn =
    classes === undefined ? translateBuiltInInstanceOf(node, scope, context) : undefined;
  if (builtIn !== undefined) return builtIn;
  if (symbol === undefined || classes === undefined) {
    throw new TlaTypeScriptError(`Unsupported instanceof: ${node.right.getText()}`, node);
  }
  const value = translateExpression(node.left, scope, context);
  const subclasses = set(getSubclasses(node, classes[0], context));
  if (getErrorClass(context.checker.getTypeAtLocation(node.left).getSymbol(), context.checker)) {
    return apply("\\in", [field(value, "constructor"), subclasses]);
  }
  if (!isCaught(node.left, context)) {
    throw new TlaTypeScriptError("instanceof needs an error or a caught value", node);
  }
  if (context.heap === undefined) return useJavaScript("IsErrorOf", [value, subclasses], context);
  // Every error class's prototype inherits from Error.prototype, so a caught object on the heap that
  // doesn't is no error's instance. tla-ts doesn't tell the class of one that does.
  return share(value, "caught", context, (caught) =>
    useJavaScript(
      "IsInstanceOfError",
      [getHeap(scope, node, context), caught, subclasses, string(node.right.getText())],
      context,
    ),
  );
};

export const translateThrown = (node: ts.Expression, scope: Scope, context: Context) => {
  const type = context.checker.getTypeAtLocation(node);
  const names = getTypeNames(type, context.checker);
  const isPrimitive = names?.every((name) => name !== "object" && name !== "function") === true;
  // An object on the heap keeps its identity as a thrown value, as its ref. A name that only an
  // object literal gives holds one, though its type, such as {}, may fit primitives.
  const declaration = ts.isIdentifier(node)
    ? getSymbol(node, context.checker)?.valueDeclaration
    : undefined;
  const initializer =
    declaration !== undefined && ts.isVariableDeclaration(declaration)
      ? declaration.initializer
      : undefined;
  const isHeapObject =
    getKind(node, context) === "object" &&
    (names?.every((name) => name === "object") === true ||
      (initializer !== undefined &&
        ts.isObjectLiteralExpression(initializer) &&
        getLiteralName(initializer, context) !== undefined));
  if (
    !isPrimitive &&
    !isHeapObject &&
    getErrorClass(type.getSymbol(), context.checker) === undefined &&
    !isCaught(node, context)
  ) {
    throw new TlaTypeScriptError("Throw an error or a primitive", node);
  }
  return translateExpression(node, scope, context);
};
