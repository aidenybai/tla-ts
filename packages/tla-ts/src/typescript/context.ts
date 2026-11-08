import ts from "@typescript/typescript6";
import type { Expression, OperatorDefinition, OperatorParam } from "../ast";
import { JAVASCRIPT_OPERATORS } from "./javascript";
import { createNames, type Names } from "./names";
import { apply, define, identifier, ifExpression, index, letExpression, string } from "./tla";

export interface Definition {
  name: string;
  parameters: OperatorParam[];
  readsState: boolean;
}

export interface Context {
  checker: ts.TypeChecker;
  names: Names;
  variables: Map<ts.Symbol, Expression>;
  // Helper functions and constants, compiled when first referenced.
  definitions: Map<ts.Declaration, Definition>;
  // Helpers being compiled or inlined, to detect recursion.
  inProgress: Set<ts.Node>;
  recursive: Set<ts.Declaration>;
  output: OperatorDefinition[];
  // String literals of @symmetric types, which become model values.
  modelValues: Map<string, string>;
  constructors: Map<ts.Symbol, string>;
  // Model values and helper operators that the spec uses.
  prelude: Set<"Null" | "Undefined" | "Rem" | "Quot" | "JavaScript">;
  // The calls that the exported function being compiled makes and tla-ts can't compile.
  unknowns: Unknowns | undefined;
  heap: ts.Symbol | undefined;
  // The built-in objects, by path, that a script names.
  builtIns: Set<string>;
}

export interface Unknown {
  name: string;
  domain: Expression;
  node: ts.Node;
}

interface Unknowns {
  owner: ts.Node;
  values: Unknown[];
}

export interface MethodCall extends ts.CallExpression {
  readonly expression: ts.PropertyAccessExpression;
}

export type FunctionNode =
  | ts.FunctionDeclaration
  | ts.ArrowFunction
  | ts.FunctionExpression
  | ts.MethodDeclaration;

export type HelperDeclaration = ts.FunctionDeclaration | ts.VariableDeclaration;

export const createContext = (checker: ts.TypeChecker): Context => ({
  checker,
  names: createNames(JAVASCRIPT_OPERATORS),
  variables: new Map(),
  definitions: new Map(),
  inProgress: new Set(),
  recursive: new Set(),
  output: [],
  modelValues: new Map(),
  constructors: new Map(),
  prelude: new Set(),
  unknowns: undefined,
  heap: undefined,
  builtIns: new Set(),
});

export const hasObjectLiteral = (node: ts.Node): boolean =>
  ts.isObjectLiteralExpression(node) || (ts.forEachChild(node, hasObjectLiteral) ?? false);

export const getSymbol = (node: ts.Node, checker: ts.TypeChecker) => {
  const symbol =
    ts.isShorthandPropertyAssignment(node.parent) && node.parent.name === node
      ? checker.getShorthandAssignmentValueSymbol(node.parent)
      : checker.getSymbolAtLocation(node);
  return symbol !== undefined && symbol.flags & ts.SymbolFlags.Alias
    ? checker.getAliasedSymbol(symbol)
    : symbol;
};

export const isMethodCall = (node: ts.Node): node is MethodCall =>
  ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression);

const isTopLevel = (statement: ts.Node): boolean => {
  const parent = statement.parent;
  if (ts.isSourceFile(parent)) return true;
  const namespace = ts.isModuleBlock(parent) ? parent.parent : parent;
  return ts.isModuleDeclaration(namespace) && isTopLevel(namespace);
};

// The declaration of a constant or function at the top level of a module, which becomes a TLA+
// definition.
export const getTopLevelDeclaration = (symbol: ts.Symbol | undefined) => {
  const declaration = symbol?.valueDeclaration;
  if (declaration === undefined) return undefined;
  if (ts.isFunctionDeclaration(declaration) && isTopLevel(declaration)) return declaration;
  const isTopLevelConst =
    ts.isVariableDeclaration(declaration) &&
    ts.isVariableStatement(declaration.parent.parent) &&
    isTopLevel(declaration.parent.parent) &&
    (declaration.parent.flags & ts.NodeFlags.Const) !== 0;
  return isTopLevelConst ? declaration : undefined;
};

const isAsync = (node: FunctionNode) =>
  node.modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword) === true;

const isPlain = (node: FunctionNode) => node.asteriskToken === undefined && !isAsync(node);

const isGenerator = (node: FunctionNode) => node.asteriskToken !== undefined && !isAsync(node);

const getAnyFunction = (node: ts.Node | undefined): FunctionNode | undefined => {
  if (node === undefined) return undefined;
  if (ts.isFunctionDeclaration(node) || ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
    return node;
  }
  return ts.isVariableDeclaration(node) ? getAnyFunction(node.initializer) : undefined;
};

// The function a node is, or that a variable declaration initializes.
export const getFunction = (node: ts.Node | undefined) => {
  const found = getAnyFunction(node);
  return found !== undefined && isPlain(found) ? found : undefined;
};

// A class whose definition and instances run no code, so only its methods matter.
const isInert = (node: ts.ClassLikeDeclaration) =>
  node.heritageClauses === undefined &&
  node.members.every(
    (member) =>
      ts.isSemicolonClassElement(member) ||
      ((ts.isMethodDeclaration(member) || ts.isAccessor(member)) &&
        !ts.isComputedPropertyName(member.name)),
  );

// The class a node names, from a class declaration or a variable that a class expression
// initializes.
export const getClass = (node: ts.Node | undefined, context: Context) => {
  const declaration =
    node === undefined ? undefined : getSymbol(node, context.checker)?.valueDeclaration;
  if (declaration === undefined) return undefined;
  const found = ts.isVariableDeclaration(declaration) ? declaration.initializer : declaration;
  return found !== undefined && ts.isClassLike(found) && isInert(found) ? found : undefined;
};

// Whether a variable's initializer is a function or a class, which tla-ts inlines where it's used
// instead of storing.
export const isInlined = (node: ts.Node | undefined) =>
  getAnyFunction(node) !== undefined ||
  (node !== undefined && ts.isClassExpression(node) && isInert(node));

// The method that a getter like `get method() { return this.#method; }` returns.
const getReturnedMethod = (getter: ts.GetAccessorDeclaration, context: Context) => {
  const statement = getter.body?.statements.length === 1 ? getter.body.statements[0] : undefined;
  const returned =
    statement !== undefined && ts.isReturnStatement(statement) ? statement.expression : undefined;
  if (
    returned === undefined ||
    !ts.isPropertyAccessExpression(returned) ||
    returned.expression.kind !== ts.SyntaxKind.ThisKeyword
  ) {
    return undefined;
  }
  return getSymbol(returned.name, context.checker)?.valueDeclaration;
};

// A method whose class the call names exactly: a static method on the class, or a method on a
// new instance.
const getMethod = (node: ts.Expression, context: Context) => {
  if (!ts.isPropertyAccessExpression(node)) return undefined;
  const named = getSymbol(node.name, context.checker)?.valueDeclaration;
  const declaration =
    named !== undefined && ts.isGetAccessor(named) ? getReturnedMethod(named, context) : named;
  if (
    declaration === undefined ||
    named === undefined ||
    !ts.isMethodDeclaration(declaration) ||
    declaration.parent !== named.parent
  ) {
    return undefined;
  }
  const isStatic =
    ts.canHaveModifiers(named) &&
    ts.getModifiers(named)?.some((modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword);
  const receiver = node.expression;
  const owner = isStatic
    ? receiver
    : ts.isNewExpression(receiver) && (receiver.arguments ?? []).length === 0
      ? receiver.expression
      : undefined;
  return getClass(owner, context) === declaration.parent ? declaration : undefined;
};

// Whether a node runs at most once, outside every function and loop.
const isOnce = (node: ts.Node): boolean =>
  ts.isSourceFile(node) ||
  (!ts.isFunctionLike(node) && !ts.isIterationStatement(node, false) && isOnce(node.parent));

// A plain method of an object literal that a script makes once, which a value can name, since
// each call checks that the property still holds it.
export const getObjectMethod = (node: ts.Node | undefined) =>
  node !== undefined &&
  ts.isMethodDeclaration(node) &&
  ts.isObjectLiteralExpression(node.parent) &&
  node.asteriskToken === undefined &&
  node.body !== undefined &&
  !(ts.getModifiers(node) ?? []).some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword) &&
  isOnce(node.parent)
    ? node
    : undefined;

// The object method that a call's callee names, which the call checks the object still holds.
export const getCalledMethod = (node: ts.Expression, context: Context) =>
  context.heap !== undefined && ts.isPropertyAccessExpression(node)
    ? getObjectMethod(getSymbol(node.name, context.checker)?.valueDeclaration)
    : undefined;

// The function that a callee or callback names: one written in place, one declared elsewhere, or
// a method of a known class.
const resolve = (node: ts.Expression, context: Context) =>
  getAnyFunction(node) ??
  getAnyFunction(getSymbol(node, context.checker)?.valueDeclaration) ??
  getMethod(node, context);

export const getCallee = (node: ts.Expression, context: Context) => {
  const found = resolve(node, context);
  return found !== undefined && isPlain(found) ? found : undefined;
};

export const getGenerator = (node: ts.Expression, context: Context) => {
  const found = resolve(node, context);
  return found !== undefined && isGenerator(found) ? found : undefined;
};

export const translateString = (value: string, context: Context) => {
  const modelValue = context.modelValues.get(value);
  return modelValue === undefined ? string(value) : identifier(modelValue);
};

const isTrivial = (value: Expression): boolean =>
  ["Identifier", "Number", "String", "ExceptAt"].includes(value.kind) ||
  (value.kind === "Prime" && isTrivial(value.expression));

export const getUndefined = (context: Context) => {
  context.prelude.add("Undefined");
  return identifier("Undefined");
};

// Binds a value that an expression repeats to a LET definition, so that TLC evaluates it once.
export const share = (
  value: Expression,
  base: string,
  context: Context,
  use: (shared: Expression) => Expression,
) => {
  if (isTrivial(value)) return use(value);
  const name = context.names.getFresh(base);
  return letExpression([define(name, [], value)], use(identifier(name)));
};

export const getElement = (sequence: Expression, position: Expression, context: Context) =>
  share(sequence, "sequence", context, (shared) =>
    share(position, "position", context, (at) =>
      ifExpression(
        apply("\\in", [at, apply("DOMAIN", [shared])]),
        index(shared, [at]),
        getUndefined(context),
      ),
    ),
  );
