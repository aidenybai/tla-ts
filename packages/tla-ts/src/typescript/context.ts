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
  // The literal that each function a script holds as a value returns, by its model value's name,
  // for the functions that return only a literal.
  constantFunctions: Map<string, Expression>;
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
  | ts.MethodDeclaration
  | ts.ConstructorDeclaration;

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
  constantFunctions: new Map(),
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
  if (declaration === undefined || declaration.getSourceFile().isDeclarationFile) return undefined;
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
  return found !== undefined &&
    ts.isClassLike(found) &&
    isInert(found) &&
    !isHeapClass(found, context)
    ? found
    : undefined;
};

// Whether a variable's initializer is a function or a class, which tla-ts inlines where it's used
// instead of storing.
export const isInlined = (node: ts.Node | undefined, context: Context) =>
  getAnyFunction(node) !== undefined ||
  (node !== undefined &&
    ts.isClassExpression(node) &&
    isInert(node) &&
    !isHeapClass(node, context));

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

const isPlainMethod = (node: ts.Node): node is ts.MethodDeclaration =>
  ts.isMethodDeclaration(node) &&
  node.asteriskToken === undefined &&
  node.body !== undefined &&
  !ts.isComputedPropertyName(node.name) &&
  !ts.isPrivateIdentifier(node.name) &&
  !(ts.getModifiers(node) ?? []).some((modifier) => modifier.kind === ts.SyntaxKind.AsyncKeyword);

const isStatic = (node: ts.Node) =>
  ts.canHaveModifiers(node) &&
  (ts.getModifiers(node) ?? []).some((modifier) => modifier.kind === ts.SyntaxKind.StaticKeyword);

// Whether an assignment's target writes a name, alone or in a pattern.
const isWrittenBy = (target: ts.Node, symbol: ts.Symbol, context: Context): boolean => {
  if (ts.isIdentifier(target)) return getSymbol(target, context.checker) === symbol;
  if (ts.isParenthesizedExpression(target) || ts.isSpreadElement(target)) {
    return isWrittenBy(target.expression, symbol, context);
  }
  if (ts.isBinaryExpression(target) && target.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
    return isWrittenBy(target.left, symbol, context);
  }
  if (ts.isArrayLiteralExpression(target)) {
    return target.elements.some((element) => isWrittenBy(element, symbol, context));
  }
  if (!ts.isObjectLiteralExpression(target)) return false;
  return target.properties.some((property) =>
    ts.isPropertyAssignment(property)
      ? isWrittenBy(property.initializer, symbol, context)
      : ts.isShorthandPropertyAssignment(property)
        ? isWrittenBy(property.name, symbol, context)
        : ts.isSpreadAssignment(property) && isWrittenBy(property.expression, symbol, context),
  );
};

// Whether a script assigns to a name anywhere.
const isAssigned = (symbol: ts.Symbol, node: ts.Node, context: Context): boolean => {
  const target =
    ts.isBinaryExpression(node) &&
    node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
    node.operatorToken.kind <= ts.SyntaxKind.LastAssignment
      ? node.left
      : (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) &&
          (node.operator === ts.SyntaxKind.PlusPlusToken ||
            node.operator === ts.SyntaxKind.MinusMinusToken)
        ? node.operand
        : (ts.isForInStatement(node) || ts.isForOfStatement(node)) &&
            !ts.isVariableDeclarationList(node.initializer)
          ? node.initializer
          : undefined;
  return (
    (target !== undefined && isWrittenBy(target, symbol, context)) ||
    (ts.forEachChild(node, (child) => isAssigned(symbol, child, context) || undefined) ?? false)
  );
};

// The function that a script evaluates once, which is a value with one identity, either as the
// expression or through a name that its declaration gives it and nothing assigns.
export const getFunctionValue = (node: ts.Node, context: Context) => {
  if (context.heap === undefined) return undefined;
  const symbol = ts.isIdentifier(node) ? getSymbol(node, context.checker) : undefined;
  const declaration = symbol?.valueDeclaration;
  const isNamed =
    symbol !== undefined &&
    declaration !== undefined &&
    !isAssigned(symbol, node.getSourceFile(), context);
  const found =
    isNamed && ts.isVariableDeclaration(declaration)
      ? declaration.initializer
      : isNamed && ts.isFunctionDeclaration(declaration)
        ? declaration
        : node;
  return found !== undefined &&
    (ts.isFunctionExpression(found) ||
      ts.isArrowFunction(found) ||
      (ts.isFunctionDeclaration(found) && found.body !== undefined)) &&
    isOnce(found.parent)
    ? found
    : undefined;
};

const heapClasses = new WeakMap<ts.ClassLikeDeclaration, boolean>();

// A class that a script evaluates once into objects on the heap: a constructor object with the
// static methods, and its prototype with the other methods. Its name never changes, so a new or
// a method call can find the class it names.
export const isHeapClass = (node: ts.ClassLikeDeclaration, context: Context) => {
  if (context.heap === undefined) return false;
  const known = heapClasses.get(node);
  if (known !== undefined) return known;
  const declared = ts.isClassExpression(node) ? node.parent : node;
  const nameNode =
    ts.isClassDeclaration(node) || !ts.isVariableDeclaration(declared) ? node.name : declared.name;
  const symbol =
    nameNode === undefined || !ts.isIdentifier(nameNode)
      ? undefined
      : getSymbol(nameNode, context.checker);
  const isHeap =
    node.heritageClauses === undefined &&
    symbol !== undefined &&
    (ts.isClassDeclaration(node) || ts.isVariableDeclaration(declared)) &&
    isOnce(node) &&
    node.members.every(
      (member) =>
        ts.isSemicolonClassElement(member) ||
        (ts.isConstructorDeclaration(member) && member.body !== undefined) ||
        isPlainMethod(member) ||
        (ts.isPropertyDeclaration(member) && !isStatic(member) && ts.isIdentifier(member.name)),
    ) &&
    !isAssigned(symbol, node.getSourceFile(), context);
  heapClasses.set(node, isHeap);
  return isHeap;
};

// The heap class that a name names.
export const getHeapClass = (node: ts.Expression, context: Context) => {
  const declaration = getSymbol(node, context.checker)?.valueDeclaration;
  const found =
    declaration !== undefined && ts.isVariableDeclaration(declaration)
      ? declaration.initializer
      : declaration;
  return found !== undefined && ts.isClassLike(found) && isHeapClass(found, context)
    ? found
    : undefined;
};

// The heap class that a new names.
export const getNewClass = (node: ts.Node, context: Context) =>
  ts.isNewExpression(node) ? getHeapClass(node.expression, context) : undefined;

// A class's constructor, when its body runs statements.
export const getRunConstructor = (node: ts.ClassLikeDeclaration) =>
  node.members.find(
    (member): member is ts.ConstructorDeclaration =>
      ts.isConstructorDeclaration(member) && (member.body?.statements.length ?? 0) > 0,
  );

// Whether a new is all that a statement evaluates, besides the variable it initializes or
// assigns, so the statement can run the constructor.
export const isStatementNew = (node: ts.NewExpression) => {
  const parent = node.parent;
  return (
    ts.isExpressionStatement(parent) ||
    (ts.isVariableDeclaration(parent) &&
      parent.initializer === node &&
      ts.isIdentifier(parent.name) &&
      ts.isVariableStatement(parent.parent.parent)) ||
    (ts.isBinaryExpression(parent) &&
      parent.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      parent.right === node &&
      ts.isIdentifier(parent.left) &&
      ts.isExpressionStatement(parent.parent))
  );
};

// A plain method that a script makes once, of an object literal or a heap class, which a value can
// name, since each call checks that the property still holds it.
export const getObjectMethod = (node: ts.Node | undefined, context: Context) =>
  node !== undefined &&
  isPlainMethod(node) &&
  (ts.isObjectLiteralExpression(node.parent)
    ? isOnce(node.parent)
    : ts.isClassLike(node.parent) && isHeapClass(node.parent, context))
    ? node
    : undefined;

export interface CalledMethod {
  method: ts.MethodDeclaration;
  receiver: ts.Expression;
  key: string;
}

// The object method that a callee such as obj.name or obj["name"] reads, which the call checks
// the object still holds.
export const getCalledMethod = (
  node: ts.Expression,
  context: Context,
): CalledMethod | undefined => {
  const isAccess =
    context.heap !== undefined &&
    (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node));
  if (!isAccess) return undefined;
  const name = ts.isPropertyAccessExpression(node) ? node.name : node.argumentExpression;
  if (!ts.isIdentifier(name) && !ts.isPrivateIdentifier(name) && !ts.isStringLiteralLike(name)) {
    return undefined;
  }
  const method = getObjectMethod(getSymbol(name, context.checker)?.valueDeclaration, context);
  return method === undefined ? undefined : { method, receiver: node.expression, key: name.text };
};

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
