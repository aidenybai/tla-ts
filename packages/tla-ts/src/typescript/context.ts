import ts from "@typescript/typescript6";
import type { Expression, OperatorDefinition, OperatorParam } from "../ast";
import { getTypeNames, JAVASCRIPT_OPERATORS } from "./javascript";
import { BUILT_INS } from "./built-ins";
import { getErrorClass, isNativeErrorName, isPrototypeRead, NATIVE_ERRORS } from "./exceptions";
import { getBuiltIn, isHeldBuiltInObject } from "./intrinsics";
import { isHeapArray, isHeapSetOrMap } from "./types";
import { TlaTypeScriptError } from "../errors";
import { createNames, type Names } from "./names";
import type { Link } from "./regions";
import { apply, define, identifier, ifExpression, index, letExpression, string } from "./tla";

export interface Definition {
  name: string;
  parameters: OperatorParam[];
  readsState: boolean;
}

export interface SelfCall {
  name: string;
  changed: ts.Symbol[];
  // The function that each parameter that takes one runs, the same in every call.
  functions: (FunctionNode | undefined)[];
}

export interface Passed {
  node: ts.Expression;
  value: Expression;
}

export interface Context {
  checker: ts.TypeChecker;
  names: Names;
  variables: Map<ts.Symbol, Expression>;
  // Helper functions and constants, compiled when first referenced.
  definitions: Map<ts.Declaration, Definition>;
  // The operator of each helper that calls itself where a statement changed the state that it
  // reads, which takes that state.
  stateCalls: Map<ts.Node, Definition>;
  // Helpers being compiled or inlined, to detect recursion.
  inProgress: Set<ts.Node>;
  recursive: Set<ts.Declaration>;
  // The recursive operator of each function that changes state and calls itself, while its body
  // compiles, with what it changes.
  selfCalls: Map<ts.Node, SelfCall>;
  output: OperatorDefinition[];
  // The TypeScript that each emitted definition or expression compiles from.
  links: Link[];
  // String literals of @symmetric types, which become model values.
  modelValues: Map<string, string>;
  constructors: Map<ts.Symbol | ts.Node, string>;
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
  // Whether a script names NaN, Infinity, or -0, so that its numbers compute as JavaScript's.
  hasSpecialNumbers: boolean;
  // The model values that stand for the well-known symbols and for the symbols a script makes.
  symbols: string[];
  // The model values that stand for the numbers that a script's literals give and that aren't
  // integers, and for their negations, by number.
  fractions: Map<number, string>;
  // The array literals, new sets and maps, and the rest elements, variables, parameters, fields,
  // and functions that hold them, which the heap holds.
  heapCollections: Set<ts.Node>;
  // The generator functions that a script declares at its top, or that a variable there holds,
  // whose prototype objects the heap holds from the start, by the place on the heap of each.
  generatorPrototypes: Map<ts.FunctionDeclaration | ts.FunctionExpression, number>;
  // Whether a script gives Array.prototype or Object.prototype properties, which an array reads
  // past its end.
  hasInheritedElements: boolean;
  // The code units outside ASCII that a script's strings may hold: those its text writes, and those
  // of each case of the code points they make.
  characters: Set<number>;
  // The argument that an inlined call passed, by the name that binds the parameter that took it.
  passed: Map<string, Passed>;
  // What each function that a statement runs changes, with the functions that it runs in turn, by
  // the functions that the paths bind to the parameters that they call.
  changeSummaries: Map<string, Map<ts.Node, ChangeSummary>>;
}

export interface ChangeSummary {
  changed: Set<ts.Symbol>;
  // Whether it makes an error, which changes the heap unless the caller ignores its identity.
  isErrorMade: boolean;
  // The parameters that it calls or passes, which a path may bind to functions.
  parameters: Set<ts.Symbol>;
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
  | ts.ConstructorDeclaration
  | ts.GetAccessorDeclaration
  | ts.SetAccessorDeclaration;

export type HelperDeclaration = ts.FunctionDeclaration | ts.VariableDeclaration;

export const createContext = (checker: ts.TypeChecker): Context => ({
  checker,
  names: createNames(JAVASCRIPT_OPERATORS),
  variables: new Map(),
  definitions: new Map(),
  stateCalls: new Map(),
  inProgress: new Set(),
  recursive: new Set(),
  selfCalls: new Map(),
  output: [],
  links: [],
  modelValues: new Map(),
  constructors: new Map(),
  prelude: new Set(),
  unknowns: undefined,
  heap: undefined,
  builtIns: new Set(),
  constantFunctions: new Map(),
  hasSpecialNumbers: false,
  symbols: [],
  fractions: new Map(),
  heapCollections: new Set(),
  generatorPrototypes: new Map(),
  hasInheritedElements: false,
  characters: new Set(),
  passed: new Map(),
  changeSummaries: new Map(),
});

export const hasObjectLiteral = (node: ts.Node): boolean =>
  ts.isObjectLiteralExpression(node) || (ts.forEachChild(node, hasObjectLiteral) ?? false);

// The function whose arguments object a reference to arguments names. tla-ts follows only a
// reference that no arrow function holds, since an arrow function names the arguments of the
// function around it, which a later call may have replaced.
const isModuleSyntax = (statement: ts.Statement) =>
  ts.isImportDeclaration(statement) ||
  ts.isImportEqualsDeclaration(statement) ||
  ts.isExportDeclaration(statement) ||
  ts.isExportAssignment(statement) ||
  (ts.canHaveModifiers(statement) &&
    (ts.getModifiers(statement) ?? []).some(
      (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
    ));

// An await that no function encloses.
const hasTopLevelAwait = (node: ts.Node): boolean =>
  ts.isAwaitExpression(node) ||
  (ts.isForOfStatement(node) && node.awaitModifier !== undefined) ||
  (!ts.isFunctionLike(node) && (ts.forEachChild(node, hasTopLevelAwait) ?? false));

// A file that imports, exports, or awaits outside a function, which Node runs only as a module.
// Node runs another file as a script where it strips its types.
export const isModuleFile = (file: ts.SourceFile) =>
  file.statements.some(isModuleSyntax) || hasTopLevelAwait(file);

// The function whose arguments object a name reads, which for an arrow is the function around it.
export const getArgumentsOwner = (node: ts.Node, checker: ts.TypeChecker) => {
  if (!ts.isIdentifier(node) || node.text !== "arguments") return undefined;
  const symbol = checker.getSymbolAtLocation(node);
  const owner = ts.findAncestor(
    node.parent,
    (ancestor): ancestor is FunctionNode =>
      ts.isFunctionDeclaration(ancestor) ||
      ts.isFunctionExpression(ancestor) ||
      ts.isMethodDeclaration(ancestor) ||
      ts.isConstructorDeclaration(ancestor) ||
      ts.isAccessor(ancestor),
  );
  return symbol === undefined || symbol.declarations !== undefined ? undefined : owner;
};

// A name that no declaration binds, whose reading throws a ReferenceError.
export const isUnresolved = (node: ts.Node, context: Context): node is ts.Identifier =>
  ts.isIdentifier(node) && context.checker.getSymbolAtLocation(node) === undefined;

// Whether a literal is truthy, where its value is certain.
const getLiteralTruth = (node: ts.Expression) => {
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword || node.kind === ts.SyntaxKind.NullKeyword) {
    return false;
  }
  if (ts.isStringLiteral(node)) return node.text !== "";
  const value = ts.isNumericLiteral(node) ? Number(node.text) : Number.NaN;
  return Number.isNaN(value) ? undefined : value !== 0;
};

// The unresolved name that an expression reads before it evaluates anything that could change
// state or throw, which throws a ReferenceError there.
export const getUnresolvedRead = (
  node: ts.Expression | ts.ClassDeclaration,
  context: Context,
): ts.Identifier | undefined => {
  if (ts.isIdentifier(node)) return isUnresolved(node, context) ? node : undefined;
  // Reads each operand in order while the ones before it are literals.
  const readInOrder = (operands: readonly ts.Expression[]): ts.Identifier | undefined => {
    const first = operands.at(0);
    if (first === undefined || ts.isSpreadElement(first)) return undefined;
    const read = getUnresolvedRead(first, context);
    if (read !== undefined || getLiteralTruth(first) === undefined) return read;
    return readInOrder(operands.slice(1));
  };
  if (
    ts.isParenthesizedExpression(node) ||
    ts.isAsExpression(node) ||
    ts.isTypeAssertionExpression(node) ||
    ts.isNonNullExpression(node) ||
    ts.isSatisfiesExpression(node) ||
    ts.isVoidExpression(node) ||
    ts.isPropertyAccessExpression(node) ||
    ts.isElementAccessExpression(node)
  ) {
    return getUnresolvedRead(node.expression, context);
  }
  if (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) {
    return getUnresolvedRead(node.operand, context);
  }
  if (ts.isConditionalExpression(node)) {
    const truth = getLiteralTruth(node.condition);
    return truth === undefined
      ? getUnresolvedRead(node.condition, context)
      : getUnresolvedRead(truth ? node.whenTrue : node.whenFalse, context);
  }
  if (ts.isArrayLiteralExpression(node)) return readInOrder(node.elements);
  // An object literal evaluates its values and spreads in order, and a spread reads its
  // expression before it copies anything.
  if (ts.isObjectLiteralExpression(node)) {
    const values = node.properties.map((property) =>
      ts.isPropertyAssignment(property) && !ts.isComputedPropertyName(property.name)
        ? [property.initializer]
        : ts.isShorthandPropertyAssignment(property)
          ? [property.name]
          : ts.isSpreadAssignment(property)
            ? [property.expression]
            : [],
    );
    const end = values.findIndex((value) => value.length === 0);
    return readInOrder(values.slice(0, end === -1 ? undefined : end).flat());
  }
  // A class without a base evaluates its computed keys in order before it runs anything else.
  if (ts.isClassLike(node)) {
    if (node.heritageClauses !== undefined) return undefined;
    return readInOrder(
      node.members.flatMap((member) =>
        member.name !== undefined && ts.isComputedPropertyName(member.name)
          ? [member.name.expression]
          : [],
      ),
    );
  }
  if (ts.isCallExpression(node) || ts.isNewExpression(node)) {
    if (isUnresolved(node.expression, context)) return node.expression;
    // A function declaration binds its name before any code runs, so reading it can't throw, and
    // a class declaration that comes before binds its name, or reading it throws a ReferenceError
    // too. A new evaluates its arguments before the class runs any code, and a function written
    // in place, or super, evaluates nothing that can throw before them.
    const callee = skipCasts(node.expression);
    const declaration = ts.isIdentifier(callee)
      ? context.checker.getSymbolAtLocation(callee)?.valueDeclaration
      : undefined;
    return ts.isFunctionExpression(callee) ||
      callee.kind === ts.SyntaxKind.SuperKeyword ||
      (declaration !== undefined &&
        (ts.isFunctionDeclaration(declaration) ||
          (ts.isClassDeclaration(declaration) && declaration.end <= node.getStart())))
      ? readInOrder(node.arguments ?? [])
      : undefined;
  }
  if (!ts.isBinaryExpression(node)) return undefined;
  const operator = node.operatorToken.kind;
  // An assignment to a name reads its value only after it evaluates the value it assigns.
  if (operator === ts.SyntaxKind.EqualsToken) {
    return ts.isIdentifier(node.left) ? getUnresolvedRead(node.right, context) : undefined;
  }
  const truth = getLiteralTruth(node.left);
  const isShortCircuit =
    (operator === ts.SyntaxKind.AmpersandAmpersandToken && truth === false) ||
    (operator === ts.SyntaxKind.BarBarToken && truth === true) ||
    (operator === ts.SyntaxKind.QuestionQuestionToken &&
      node.left.kind !== ts.SyntaxKind.NullKeyword &&
      truth !== undefined);
  return isShortCircuit ? undefined : readInOrder([node.left, node.right]);
};

// TypeScript gives new.target the symbol of the function it's in, which isn't its value.
export const getSymbol = (node: ts.Node, checker: ts.TypeChecker) => {
  const parent = node.parent;
  // A parameter property's name names the property, where the constructor's body reads the
  // parameter.
  const symbol = ts.isMetaProperty(node)
    ? undefined
    : ts.isShorthandPropertyAssignment(parent) && parent.name === node
      ? checker.getShorthandAssignmentValueSymbol(parent)
      : ts.isIdentifier(node) &&
          ts.isParameter(parent) &&
          parent.name === node &&
          ts.isParameterPropertyDeclaration(parent, parent.parent)
        ? checker.getSymbolsOfParameterPropertyDeclaration(parent, node.text)[0]
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

export const isPlain = (node: FunctionNode) => node.asteriskToken === undefined && !isAsync(node);

export const isGenerator = (node: FunctionNode) =>
  node.asteriskToken !== undefined && !isAsync(node);

export const isAsyncFunction = (node: FunctionNode) =>
  node.asteriskToken === undefined && isAsync(node);

export const isAsyncGenerator = (node: FunctionNode) =>
  node.asteriskToken !== undefined && isAsync(node);

export const isAnyGenerator = (node: FunctionNode) => node.asteriskToken !== undefined;

export const getAnyFunction = (node: ts.Node | undefined): FunctionNode | undefined => {
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
export const isInlined = (node: ts.Node | undefined, context: Context) => {
  const found = getAnyFunction(node);
  return (
    (found !== undefined && !isHeapFunction(found, context)) ||
    getFactoryCall(node, context) !== undefined ||
    (node !== undefined &&
      ts.isClassExpression(node) &&
      isInert(node) &&
      !isHeapClass(node, context))
  );
};

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

// Whether code under a node runs at most once: outside functions and loops, or in the body of a
// function that a call runs where it's written. A for loop runs its initializer, and a for-of or a
// for-in the expression it iterates, once.
export const isOnce = (node: ts.Node): boolean =>
  ts.isSourceFile(node) ||
  (ts.isFunctionLike(node)
    ? isCalledInPlace(node)
      ? isOnce(node.parent)
      : isCalledOnce(node)
    : !ts.isIterationStatement(node, false) &&
      ((ts.isForStatement(node.parent) && node.parent.initializer === node) ||
      ((ts.isForOfStatement(node.parent) || ts.isForInStatement(node.parent)) &&
        node.parent.expression === node)
        ? isOnce(node.parent.parent)
        : isOnce(node.parent)));

const calledOnce = new WeakMap<ts.Node, boolean>();

// A named function or method that its file calls at one place, which runs once, and names nowhere
// else, so that its body runs at most once.
const isCalledOnce = (node: ts.SignatureDeclaration): boolean => {
  const known = calledOnce.get(node);
  if (known !== undefined) return known;
  // Functions that call each other answer no.
  calledOnce.set(node, false);
  const name =
    ts.isFunctionDeclaration(node) || ts.isMethodDeclaration(node)
      ? node.name
      : (ts.isFunctionExpression(node) || ts.isArrowFunction(node)) &&
          ts.isVariableDeclaration(node.parent) &&
          node.parent.initializer === node
        ? node.parent.name
        : undefined;
  const uses =
    name !== undefined && ts.isIdentifier(name)
      ? findNodes(
          node.getSourceFile(),
          (inner): inner is ts.Identifier =>
            ts.isIdentifier(inner) && inner.text === name.text && inner !== name,
        )
      : [];
  const use = uses.length === 1 ? uses[0] : undefined;
  const callee =
    use !== undefined && ts.isPropertyAccessExpression(use.parent) && use.parent.name === use
      ? use.parent
      : use;
  const call = callee?.parent;
  const isOnceCalled =
    callee !== undefined &&
    call !== undefined &&
    ts.isCallExpression(call) &&
    call.expression === callee &&
    ts.findAncestor(call, (ancestor) => ancestor === node) === undefined &&
    isOnce(node.parent) &&
    isOnce(call);
  calledOnce.set(node, isOnceCalled);
  return isOnceCalled;
};

const isCalledInPlace = (node: ts.Node) => {
  const getOuter = (inner: ts.Node): ts.Node =>
    ts.isParenthesizedExpression(inner.parent) ? getOuter(inner.parent) : inner;
  const outer = getOuter(node);
  return (
    (ts.isFunctionExpression(node) || ts.isArrowFunction(node)) &&
    ts.isCallExpression(outer.parent) &&
    outer.parent.expression === outer
  );
};

const isMethodShape = (node: ts.Node): node is ts.MethodDeclaration =>
  ts.isMethodDeclaration(node) && node.body !== undefined;

export const isPrivateMember = (node: ts.Node) =>
  (ts.isClassElement(node) || ts.isAccessor(node)) &&
  node.name !== undefined &&
  ts.isPrivateIdentifier(node.name);

const isPlainMethod = (node: ts.Node): node is ts.MethodDeclaration =>
  isMethodShape(node) && !isPrivateMember(node);

// A private method, which no property holds, so only its class can call it.
const isPrivateMethod = (node: ts.Node): node is ts.MethodDeclaration =>
  isMethodShape(node) && isPrivateMember(node);

const brands = new WeakMap<ts.Node, string>();

const getBrand = (owner: ts.Node, context: Context) => {
  const brand =
    brands.get(owner) ??
    context.names.getFresh(
      ts.isClassLike(owner) && owner.name !== undefined ? owner.name.text : "Class",
    );
  brands.set(owner, brand);
  return brand;
};

// The private key that marks the object of a class that a field holds, which a new of the field
// checks, as a script could replace what the field holds.
export const getClassKey = (node: ts.ClassLikeDeclaration, context: Context) =>
  `${getBrand(node, context)} class`;

// The key that an object's private names hold a private field's value under, or that marks it
// with its class's private methods and accessors, apart for the class's static ones. Two classes
// can name private members alike.
export const getPrivateKey = (member: ts.ClassElement, context: Context) => {
  const brand = getBrand(member.parent, context);
  return ts.isPropertyDeclaration(member) && ts.isPrivateIdentifier(member.name)
    ? `${brand}${member.name.text}`
    : isStatic(member)
      ? `${brand} static`
      : brand;
};

const isLiteralKey = (node: ts.Node) =>
  ts.isStringLiteral(node) || ts.isNumericLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node);

export const isPlainAccessor = (
  node: ts.Node,
): node is ts.GetAccessorDeclaration | ts.SetAccessorDeclaration =>
  (ts.isGetAccessorDeclaration(node) || ts.isSetAccessorDeclaration(node)) &&
  node.body !== undefined &&
  (ts.isIdentifier(node.name) ||
    isLiteralKey(node.name) ||
    ts.isPrivateIdentifier(node.name) ||
    (ts.isComputedPropertyName(node.name) &&
      (isLiteralKey(node.name.expression) || isWellKnownSymbol(node.name.expression))));

// A well-known symbol, such as Symbol.iterator.
const isWellKnownSymbol = (node: ts.Expression) =>
  ts.isPropertyAccessExpression(node) &&
  ts.isIdentifier(node.expression) &&
  node.expression.text === "Symbol";

// The key that obj.name, obj["name"], or obj[0] reads, as a property key.
export const getAccessKey = (node: ts.Expression) => {
  if (ts.isPropertyAccessExpression(node)) return node.name.text;
  if (!ts.isElementAccessExpression(node)) return undefined;
  const key = node.argumentExpression;
  if (ts.isNumericLiteral(key)) return String(Number(key.text));
  return ts.isStringLiteral(key) || ts.isNoSubstitutionTemplateLiteral(key) ? key.text : undefined;
};

// Whether tla-ts inlines an accessor: a plain one of a heap class, or of an object literal that a
// script makes once.
const isInlinedAccessor = (accessor: ts.Declaration, context: Context) =>
  isPlainAccessor(accessor) &&
  (ts.isObjectLiteralExpression(accessor.parent)
    ? isOnce(accessor.parent)
    : ts.isClassLike(accessor.parent) && isHeapClass(accessor.parent, context));

// The accessor of a heap class, or of an object literal that a script makes once, that a property
// access names, which the access checks the object still holds.
const getObjectAccessor = <T extends ts.GetAccessorDeclaration | ts.SetAccessorDeclaration>(
  node: ts.Expression,
  isKind: (declaration: ts.Declaration) => declaration is T,
  context: Context,
) => {
  if (
    context.heap === undefined ||
    getAccessKey(node) === undefined ||
    !(ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node))
  ) {
    return undefined;
  }
  const name = ts.isPropertyAccessExpression(node) ? node.name : node.argumentExpression;
  // A spread or a rest copies an accessor's value into a property of its own, which TypeScript
  // declares with the accessor still. A union's property is neither.
  const symbol = getSymbol(name, context.checker);
  const accessor =
    symbol !== undefined &&
    ((symbol.flags & ts.SymbolFlags.Accessor) !== 0 ||
      context.checker.getTypeAtLocation(node.expression).isUnionOrIntersection())
      ? symbol.declarations?.find(isKind)
      : undefined;
  return accessor !== undefined && isInlinedAccessor(accessor, context) ? accessor : undefined;
};

export const getObjectGetter = (node: ts.Expression, context: Context) =>
  getObjectAccessor(node, ts.isGetAccessorDeclaration, context);

// The setter that an assignment such as obj.name = value, or this.#name += value, runs. A compound
// or logical assignment reads the property through the getter first, which tla-ts runs only for
// private names.
export const getAssignedSetter = (node: ts.Node, context: Context) => {
  if (!ts.isBinaryExpression(node)) return undefined;
  const kind = node.operatorToken.kind;
  const setter =
    kind >= ts.SyntaxKind.FirstAssignment && kind <= ts.SyntaxKind.LastAssignment
      ? getObjectAccessor(node.left, ts.isSetAccessorDeclaration, context)
      : undefined;
  return kind === ts.SyntaxKind.EqualsToken || (setter !== undefined && isPrivateMember(setter))
    ? setter
    : undefined;
};

// A field that only types the instance, which JavaScript never defines.
export const isAmbient = (node: ts.Node) =>
  ts.canHaveModifiers(node) &&
  (ts.getModifiers(node) ?? []).some((modifier) => modifier.kind === ts.SyntaxKind.DeclareKeyword);

export const isStatic = (node: ts.Node) =>
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
    isWrittenBy(getPropertyTarget(property), symbol, context),
  );
};

// What a property of an object pattern assigns.
const getPropertyTarget = (property: ts.ObjectLiteralElementLike) =>
  ts.isPropertyAssignment(property)
    ? property.initializer
    : ts.isShorthandPropertyAssignment(property)
      ? property.name
      : ts.isSpreadAssignment(property)
        ? property.expression
        : property;

// The name of the variable that an object literal initializes, where the script evaluates it once
// and never assigns the variable again, so the name gives the object.
export const getLiteralName = (node: ts.ObjectLiteralExpression, context: Context) => {
  const declaration = node.parent;
  const symbol =
    ts.isVariableDeclaration(declaration) &&
    declaration.initializer === node &&
    ts.isIdentifier(declaration.name)
      ? getSymbol(declaration.name, context.checker)
      : undefined;
  return ts.isVariableDeclaration(declaration) &&
    ts.isIdentifier(declaration.name) &&
    symbol !== undefined &&
    isOnce(node) &&
    !isAssigned(symbol, node.getSourceFile(), context)
    ? declaration.name
    : undefined;
};

// The target that an assignment, an increment, or a for-in or for-of without a declaration writes.
const getAssignedTarget = (node: ts.Node) =>
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

// Whether a script assigns to a name anywhere.
export const isAssigned = (symbol: ts.Symbol, node: ts.Node, context: Context): boolean => {
  const target = getAssignedTarget(node);
  return (
    (target !== undefined && isWrittenBy(target, symbol, context)) ||
    (ts.forEachChild(node, (child) => isAssigned(symbol, child, context) || undefined) ?? false)
  );
};

// Whether a variable that a script declares without a type or a value is assigned only as the
// rest of object patterns, so that it holds undefined or an object.
export const isRestOnly = (symbol: ts.Symbol, context: Context) => {
  const declaration = symbol.valueDeclaration;
  if (
    declaration === undefined ||
    !ts.isVariableDeclaration(declaration) ||
    declaration.type !== undefined ||
    declaration.initializer !== undefined
  ) {
    return false;
  }
  const targets = findNodes(declaration.getSourceFile(), (inner): inner is ts.Node => {
    const target = getAssignedTarget(inner);
    return target !== undefined && isWrittenBy(target, symbol, context);
  }).map(getAssignedTarget);
  return (
    targets.length > 0 &&
    targets.every((target) => {
      if (target === undefined || !ts.isObjectLiteralExpression(target)) return false;
      const rest = target.properties.at(-1);
      return (
        rest !== undefined &&
        ts.isSpreadAssignment(rest) &&
        ts.isIdentifier(rest.expression) &&
        getSymbol(rest.expression, context.checker) === symbol &&
        !target.properties
          .slice(0, -1)
          .some((property) => isWrittenBy(getPropertyTarget(property), symbol, context))
      );
    })
  );
};

// The names that a function reads from the functions around it, through the functions it names,
// which a call of an enclosing function binds anew. A function that runs once that call returns
// keeps the bindings where the script made it, which tla-ts follows only if nothing assigns them.
export const getLocalCaptures = (node: FunctionNode, context: Context) => {
  const captured = new Set<ts.Symbol>();
  const visited = new Set<ts.Node>([node]);
  const visit = (current: ts.Node, owner: ts.Node) => {
    if (ts.isIdentifier(current)) {
      const symbol = getSymbol(current, context.checker);
      const declaration = symbol?.valueDeclaration ?? symbol?.declarations?.[0];
      const isLocal =
        declaration !== undefined &&
        (ts.isVariableDeclaration(declaration) ||
          ts.isParameter(declaration) ||
          ts.isBindingElement(declaration) ||
          ts.isFunctionDeclaration(declaration) ||
          ts.isClassDeclaration(declaration)) &&
        ts.findAncestor(declaration, (ancestor) => ancestor === owner) === undefined &&
        ts.findAncestor(
          declaration.parent,
          (ancestor) => ts.isFunctionLike(ancestor) || ts.isClassStaticBlockDeclaration(ancestor),
        ) !== undefined;
      if (symbol !== undefined && declaration !== undefined && isLocal) {
        if (isAssigned(symbol, current.getSourceFile(), context)) {
          throw new TlaTypeScriptError(
            "tla-ts can't follow a function that runs later and reads a local that changes",
            current,
          );
        }
        captured.add(symbol);
        const named = getAnyFunction(declaration);
        if (named !== undefined && !visited.has(named)) {
          visited.add(named);
          visit(named, named);
        }
      }
    }
    ts.forEachChild(current, (child) => visit(child, owner));
  };
  visit(node, node);
  return captured;
};

// The function that a script evaluates once, which is a value with one identity, either as the
// expression or through a name that its declaration gives it and nothing assigns, such as the name
// that a function expression gives itself.
export const getFunctionValue = (
  node: ts.Node,
  context: Context,
): ts.FunctionExpression | ts.ArrowFunction | ts.FunctionDeclaration | undefined => {
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
      : isNamed &&
          (ts.isFunctionDeclaration(declaration) ||
            (ts.isFunctionExpression(declaration) && !isNestedFunction(declaration, context)))
        ? declaration
        : node;
  return found !== undefined &&
    (ts.isFunctionExpression(found) ||
      ts.isArrowFunction(found) ||
      (ts.isFunctionDeclaration(found) && found.body !== undefined)) &&
    isOnce(found.parent) &&
    !isHeapFunction(found, context) &&
    !isFunctionObject(found, context) &&
    !isClosure(found, context)
    ? found
    : undefined;
};

export interface Binding {
  target: ts.FunctionExpression | ts.ArrowFunction | ts.FunctionDeclaration;
  receiver: ts.Expression | undefined;
  arguments: ts.Expression[];
  isSteady: boolean;
  isCall: boolean;
}

// A value that reads the same wherever a script reads it: a literal, or a name that nothing assigns
// and that holds its value by the time the node runs.
const isSteady = (value: ts.Expression, node: ts.Node, context: Context) => {
  if (
    ts.isLiteralExpression(value) ||
    value.getText() === "undefined" ||
    [ts.SyntaxKind.TrueKeyword, ts.SyntaxKind.FalseKeyword, ts.SyntaxKind.NullKeyword].includes(
      value.kind,
    )
  ) {
    return true;
  }
  const symbol = ts.isIdentifier(value) ? getSymbol(value, context.checker) : undefined;
  const declaration = symbol?.valueDeclaration;
  return (
    symbol !== undefined &&
    declaration !== undefined &&
    declaration.getSourceFile() === node.getSourceFile() &&
    (ts.isFunctionDeclaration(declaration) || declaration.end < node.getStart()) &&
    !isAssigned(symbol, node.getSourceFile(), context)
  );
};

// A call of Function.prototype.bind on a function that a script evaluates once, as f.bind(x, ...)
// or Function.prototype.bind.call(f, x, ...). A call of the bound function reads its receiver and
// arguments again, so it needs them steady, and an empty object can only be bound.
export const getBinding = (node: ts.Node, context: Context): Binding | undefined => {
  if (context.heap === undefined || !isMethodCall(node)) return undefined;
  const callee = node.expression;
  const isCall =
    callee.name.text === "call" && callee.expression.getText() === "Function.prototype.bind";
  if (!isCall && callee.name.text !== "bind") return undefined;
  const values = isCall ? [...node.arguments] : [callee.expression, ...node.arguments];
  const target = values[0] === undefined ? undefined : getFunctionValue(values[0], context);
  if (
    target === undefined ||
    (!ts.isArrowFunction(target) && target.asteriskToken !== undefined) ||
    (ts.getCombinedModifierFlags(target) & ts.ModifierFlags.Async) !== 0 ||
    values.some(
      (value) =>
        !isSteady(value, node, context) &&
        !(ts.isObjectLiteralExpression(value) && value.properties.length === 0),
    )
  ) {
    return undefined;
  }
  return {
    target,
    receiver: values[1],
    arguments: values.slice(2),
    isSteady: values.every((value) => isSteady(value, node, context)),
    isCall,
  };
};

// The binding that a value is: a call of bind, or a name that one gives and nothing assigns.
export const getBound = (node: ts.Expression, context: Context) => {
  const symbol = ts.isIdentifier(node) ? getSymbol(node, context.checker) : undefined;
  const declaration = symbol?.valueDeclaration;
  if (
    symbol === undefined ||
    declaration === undefined ||
    !ts.isVariableDeclaration(declaration) ||
    declaration.initializer === undefined
  ) {
    return getBinding(skipCasts(node), context);
  }
  // Only a name that a binding initializes needs the scan for assignments.
  const binding = getBinding(skipCasts(declaration.initializer), context);
  return binding !== undefined && !isAssigned(symbol, node.getSourceFile(), context)
    ? binding
    : undefined;
};

const hasExtends = (node: ts.ClassLikeDeclaration) =>
  (node.heritageClauses ?? []).some((clause) => clause.token === ts.SyntaxKind.ExtendsKeyword);

// A class that extends null, whose constructor has no this to give and can't call super.
export const isNullBased = (node: ts.ClassLikeDeclaration) =>
  node.heritageClauses?.find((clause) => clause.token === ts.SyntaxKind.ExtendsKeyword)?.types[0]
    ?.expression.kind === ts.SyntaxKind.NullKeyword;

// A class that extends null, whose constructor never reads this or super, or that nothing
// constructs, as its constructor without a body throws. Its instance fields never initialize.
const isNullSafe = (node: ts.ClassLikeDeclaration, context: Context) => {
  const isFielded = node.members.some(
    (member) => ts.isPropertyDeclaration(member) && !isStatic(member) && !isAmbient(member),
  );
  if (!isNullBased(node) || isFielded) return false;
  const constructor = node.members.find(ts.isConstructorDeclaration);
  if (constructor?.body !== undefined) {
    return (
      findNodes(
        constructor,
        (inner): inner is ts.Node =>
          inner.kind === ts.SyntaxKind.ThisKeyword || inner.kind === ts.SyntaxKind.SuperKeyword,
      ).length === 0
    );
  }
  const declared = ts.isClassExpression(node) ? node.parent : node;
  const name = ts.isVariableDeclaration(declared) ? declared.name : node.name;
  const symbol = name === undefined ? undefined : getSymbol(name, context.checker);
  return (
    constructor === undefined &&
    symbol !== undefined &&
    findNodes(node.getSourceFile(), ts.isIdentifier).every(
      (identifier) =>
        identifier === name ||
        getSymbol(identifier, context.checker) !== symbol ||
        !(ts.isNewExpression(identifier.parent) && identifier.parent.expression === identifier),
    )
  );
};

// The built-in constructor that makes the instances of a class without a constructor, which
// extends it or extends a class that does. Its default constructor passes new's arguments on. A
// class that extends a native error is one only where the script reads its prototype, as its
// errors are records otherwise.
export const getBuiltInBase = (
  node: ts.ClassLikeDeclaration,
  context: Context,
): "Object" | "Boolean" | "Number" | "String" | `${string}Error` | undefined => {
  if (node.members.some(ts.isConstructorDeclaration)) return undefined;
  const heritage = node.heritageClauses?.find(
    (clause) => clause.token === ts.SyntaxKind.ExtendsKeyword,
  )?.types[0]?.expression;
  const name = heritage === undefined ? undefined : getBuiltIn(heritage, context);
  if (name === "Object" || name === "Boolean" || name === "Number" || name === "String") {
    return name;
  }
  const symbol = node.name === undefined ? undefined : getSymbol(node.name, context.checker);
  if (
    name !== undefined &&
    isNativeErrorName(name) &&
    name !== "AggregateError" &&
    name !== "SuppressedError" &&
    symbol !== undefined &&
    isPrototypeRead(symbol, context.checker)
  ) {
    return name;
  }
  const base = getBaseClass(node, context);
  return base === undefined ? undefined : getBuiltInBase(base, context);
};

// An empty class that a class's extends clause makes, which the class makes its objects after.
export const isInlineBase = (node: ts.ClassLikeDeclaration): node is ts.ClassExpression =>
  ts.isClassExpression(node) &&
  ts.isExpressionWithTypeArguments(node.parent) &&
  node.heritageClauses === undefined &&
  node.members.length === 0;

// The class that a class extends, which the script defines before it or its extends clause makes.
export const getBaseClass = (node: ts.ClassLikeDeclaration, context: Context) => {
  const heritage = node.heritageClauses?.find(
    (clause) => clause.token === ts.SyntaxKind.ExtendsKeyword,
  )?.types[0]?.expression;
  if (heritage !== undefined && ts.isClassExpression(heritage)) {
    return isInlineBase(heritage) ? heritage : undefined;
  }
  const declaration =
    heritage === undefined || !ts.isIdentifier(heritage)
      ? undefined
      : getSymbol(heritage, context.checker)?.valueDeclaration;
  const found =
    declaration !== undefined && ts.isVariableDeclaration(declaration)
      ? declaration.initializer
      : declaration !== undefined &&
          ts.isPropertyDeclaration(declaration) &&
          declaration.initializer !== undefined &&
          ts.isClassExpression(declaration.initializer) &&
          isOnceField(declaration.initializer)
        ? declaration.initializer
        : declaration;
  return found !== undefined && ts.isClassLike(found) && found.end < node.getStart()
    ? found
    : undefined;
};

// Whether an expression that runs before a derived constructor's super(...) changes nothing and
// can't read this, since tla-ts starts the classes' fields first.
const isBeforeThis = (node: ts.Node) =>
  findNodes(
    node,
    (inner): inner is ts.Node =>
      ts.isCallExpression(inner) ||
      ts.isNewExpression(inner) ||
      ts.isPrefixUnaryExpression(inner) ||
      ts.isPostfixUnaryExpression(inner) ||
      ts.isDeleteExpression(inner) ||
      (ts.isBinaryExpression(inner) &&
        inner.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
        inner.operatorToken.kind <= ts.SyntaxKind.LastAssignment) ||
      inner.kind === ts.SyntaxKind.ThisKeyword ||
      inner.kind === ts.SyntaxKind.SuperKeyword,
  ).length === 0;

// The super(...) that a derived class's constructor starts with, after parameters and before
// arguments that change nothing and can't read this.
export const getSuperCall = (constructor: ts.ConstructorDeclaration) => {
  const first = constructor.body?.statements[0];
  const call =
    first !== undefined && ts.isExpressionStatement(first) && ts.isCallExpression(first.expression)
      ? first.expression
      : undefined;
  return call !== undefined &&
    call.expression.kind === ts.SyntaxKind.SuperKeyword &&
    findNodes(
      constructor.body ?? constructor,
      (node): node is ts.CallExpression =>
        ts.isCallExpression(node) && node.expression.kind === ts.SyntaxKind.SuperKeyword,
    ).length === 1 &&
    constructor.parameters.every(isBeforeThis) &&
    call.arguments.every(isBeforeThis)
    ? call
    : undefined;
};

// A derived class whose constructor starts with super(...), so its instance needs only the fields
// of each class in order. A class that adds fields or private names to the instance needs bases
// that run no constructor, since a base's constructor would see them before they exist.
const isDerivedSafe = (
  node: ts.ClassLikeDeclaration,
  base: ts.ClassLikeDeclaration,
  context: Context,
) => {
  const constructor = node.members.find(ts.isConstructorDeclaration);
  const isAdding =
    node.members.some(
      (member) =>
        !isStatic(member) &&
        ((ts.isPropertyDeclaration(member) && !isAmbient(member)) ||
          (isPrivateMember(member) && !ts.isConstructorDeclaration(member))),
    ) ||
    (constructor?.parameters.some((parameter) =>
      ts.isParameterPropertyDeclaration(parameter, constructor),
    ) ??
      false);
  return (
    (constructor === undefined ||
      (constructor.body !== undefined && getSuperCall(constructor) !== undefined)) &&
    (!isAdding || getRunConstructor(base, context) === undefined)
  );
};

const heapClasses = new WeakMap<ts.ClassLikeDeclaration, boolean>();

// A class that a script evaluates once into objects on the heap: a constructor object with the
// static methods, and its prototype with the other methods. Its name never changes, so a new or
// a method call can find the class it names.
// A class without static fields or blocks that an instance field of a class makes, where the
// script constructs that class at one place that runs once, and names the field only to construct
// what it holds, so that the class runs once.
export const isOnceField = (node: ts.ClassLikeDeclaration) => {
  const field = node.parent;
  if (
    !ts.isClassExpression(node) ||
    !ts.isPropertyDeclaration(field) ||
    field.initializer !== node ||
    isStatic(field) ||
    !ts.isIdentifier(field.name) ||
    // Nothing runs the static elements of a class that a field makes.
    node.members.some(
      (member) =>
        ts.isClassStaticBlockDeclaration(member) ||
        (ts.isPropertyDeclaration(member) && isStatic(member)),
    )
  ) {
    return false;
  }
  const owner = field.parent;
  const ownerName =
    ts.isClassExpression(owner) && ts.isVariableDeclaration(owner.parent)
      ? owner.parent.name
      : owner.name;
  if (ownerName === undefined || !ts.isIdentifier(ownerName)) return false;
  const getUses = (name: ts.Identifier) =>
    findNodes(
      node.getSourceFile(),
      (inner): inner is ts.Identifier =>
        ts.isIdentifier(inner) &&
        inner.text === name.text &&
        inner !== name &&
        // A base class's name is a value, though TypeScript parses it as a type's.
        ts.findAncestor(
          inner,
          (ancestor) => ts.isTypeNode(ancestor) && !ts.isExpressionWithTypeArguments(ancestor),
        ) === undefined,
    );
  const ownerUses = getUses(ownerName);
  const construction = ownerUses.length === 1 ? ownerUses[0].parent : undefined;
  return (
    construction !== undefined &&
    ts.isNewExpression(construction) &&
    construction.expression === ownerUses[0] &&
    ts.findAncestor(construction, (ancestor) => ancestor === owner) === undefined &&
    isOnce(construction) &&
    getUses(field.name).every(
      (use) =>
        ts.isPropertyAccessExpression(use.parent) &&
        use.parent.name === use &&
        ts.isNewExpression(use.parent.parent) &&
        use.parent.parent.expression === use.parent,
    )
  );
};

export const isHeapClass = (node: ts.ClassLikeDeclaration, context: Context): boolean => {
  if (context.heap === undefined) return false;
  const known = heapClasses.get(node);
  if (known !== undefined) return known;
  const declared = ts.isClassExpression(node) ? node.parent : node;
  const isField = isOnceField(node);
  const nameNode =
    ts.isVariableDeclaration(declared) || (isField && ts.isPropertyDeclaration(declared))
      ? declared.name
      : node.name;
  const symbol =
    nameNode === undefined || !ts.isIdentifier(nameNode)
      ? undefined
      : getSymbol(nameNode, context.checker);
  const base = getBaseClass(node, context);
  const isHeap =
    (base === undefined
      ? !hasExtends(node) ||
        isNullSafe(node, context) ||
        getBuiltInBase(node, context) !== undefined
      : (isInlineBase(base) || isHeapClass(base, context)) &&
        !isNullBased(base) &&
        isDerivedSafe(node, base, context) &&
        (getBuiltInBase(base, context) === undefined ||
          getBuiltInBase(node, context) !== undefined)) &&
    symbol !== undefined &&
    (ts.isClassDeclaration(node) || ts.isVariableDeclaration(declared) || isField) &&
    isOnce(node) &&
    node.members.every(
      (member) =>
        ts.isSemicolonClassElement(member) ||
        (ts.isConstructorDeclaration(member) && member.body !== undefined) ||
        isPlainMethod(member) ||
        isPrivateMethod(member) ||
        isPlainAccessor(member) ||
        ts.isClassStaticBlockDeclaration(member) ||
        (ts.isPropertyDeclaration(member) &&
          (ts.isIdentifier(member.name) ||
            ts.isPrivateIdentifier(member.name) ||
            isLiteralKey(member.name) ||
            (ts.isComputedPropertyName(member.name) && isLiteralKey(member.name.expression)))),
    ) &&
    !isAssigned(symbol, node.getSourceFile(), context);
  heapClasses.set(node, isHeap);
  return isHeap;
};

// The parameters that a call passes values to, without the this parameter that only types this.
export const getParameters = (node: ts.SignatureDeclaration) =>
  node.parameters.filter(
    (parameter) => !ts.isIdentifier(parameter.name) || parameter.name.text !== "this",
  );

// A function or a class that a parameter's or a pattern's default makes each time it runs, which
// a script can't call, only read, as its binding names it. A class must make nothing but its
// methods, which are plain functions with plain names, so it has no base class, no accessors, and
// no static fields or blocks.
export const isFunctionObject = (
  node: ts.Node,
  context: Context,
): node is ts.ArrowFunction | ts.FunctionExpression | ts.ClassExpression =>
  context.heap !== undefined &&
  (ts.isArrowFunction(node) ||
    ts.isFunctionExpression(node) ||
    (ts.isClassExpression(node) &&
      node.heritageClauses === undefined &&
      node.members.every(
        (member) =>
          ts.isSemicolonClassElement(member) ||
          (ts.isConstructorDeclaration(member) && member.body !== undefined) ||
          (isPlainMethod(member) &&
            (ts.getCombinedModifierFlags(member) & ts.ModifierFlags.Async) === 0 &&
            (ts.isIdentifier(member.name) || ts.isStringLiteral(member.name))) ||
          (ts.isPropertyDeclaration(member) && !isStatic(member) && ts.isIdentifier(member.name)),
      ))) &&
  (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Async) === 0 &&
  (isDefault(node) || (ts.isClassExpression(node) && isReadClass(node)));

// Whether a class expression is only read where it runs: the object of a property access, a
// call's argument, or the value of a logical assignment to a name.
const isReadClass = (node: ts.Node): boolean => {
  const parent = node.parent;
  if (ts.isParenthesizedExpression(parent)) return isReadClass(parent);
  return (
    (ts.isPropertyAccessExpression(parent) && parent.expression === node) ||
    (ts.isCallExpression(parent) && parent.arguments.some((argument) => argument === node)) ||
    (ts.isBinaryExpression(parent) &&
      parent.right === node &&
      ts.isIdentifier(parent.left) &&
      LOGICAL_ASSIGNMENTS.has(parent.operatorToken.kind))
  );
};

const LOGICAL_ASSIGNMENTS = new Set([
  ts.SyntaxKind.QuestionQuestionEqualsToken,
  ts.SyntaxKind.BarBarEqualsToken,
  ts.SyntaxKind.AmpersandAmpersandEqualsToken,
]);

export const getStackKind = (node: ts.Expression, context: Context) => {
  const name = context.checker.getTypeAtLocation(node).getSymbol()?.name;
  return name === "DisposableStack" || name === "AsyncDisposableStack" ? name : undefined;
};

// A function that a DisposableStack's adopt or defer takes, which the stack calls as it disposes.
const isDisposeCallback = (
  node: ts.Node,
  context: Context,
): node is ts.ArrowFunction | ts.FunctionExpression =>
  (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) &&
  ts.isCallExpression(node.parent) &&
  ts.isPropertyAccessExpression(node.parent.expression) &&
  getStackKind(node.parent.expression.expression, context) !== undefined &&
  (node.parent.expression.name.text === "adopt"
    ? node.parent.arguments.at(1)
    : node.parent.expression.name.text === "defer"
      ? node.parent.arguments.at(0)
      : undefined) === node;

// A function expression or a method that another function makes as the value of an object's
// property, a function expression that it returns, or a function that it passes to adopt or defer,
// each time it runs, which is an object of its own each time. It reads no name that the functions
// around it bind, so it runs the same wherever tla-ts inlines it, or it's a closure, which runs only
// in the call that made it.
export const isNestedFunction = (
  node: ts.Node,
  context: Context,
): node is
  | ts.FunctionExpression
  | ts.ArrowFunction
  | ts.MethodDeclaration
  | ts.GetAccessorDeclaration
  | ts.SetAccessorDeclaration =>
  context.heap !== undefined &&
  (((isPlainAccessor(node) || (ts.isMethodDeclaration(node) && node.body !== undefined)) &&
    ts.isObjectLiteralExpression(node.parent) &&
    !isOnce(node.parent)) ||
    (ts.isFunctionExpression(node) &&
      ((ts.isPropertyAssignment(node.parent) &&
        node.parent.initializer === node &&
        !isFunctionObject(node, context) &&
        getFunctionValue(node, context) === undefined) ||
        (ts.isReturnStatement(node.parent) &&
          node.parent.expression === node &&
          findNodes(node, ts.isIdentifier).every((name) => name.text !== "arguments")))) ||
    (isDisposeCallback(node, context) && !isOnce(node.parent))) &&
  node.asteriskToken === undefined &&
  // Of async functions, only methods, dispose callbacks, and what an asyncDispose getter returns,
  // which await using calls.
  ((ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Async) === 0 ||
    ts.isMethodDeclaration(node) ||
    (ts.isReturnStatement(node.parent) &&
      ts.isGetAccessorDeclaration(node.parent.parent.parent) &&
      ts.isComputedPropertyName(node.parent.parent.parent.name) &&
      node.parent.parent.parent.name.expression.getText() === "Symbol.asyncDispose") ||
    isDisposeCallback(node, context)) &&
  ts.findAncestor(node.parent, ts.isFunctionLike) !== undefined &&
  (getOuterLocals(node, context).length === 0 || getLiveMaker(node, context) !== undefined);

// The locals that a function reads from the functions around it, with the function that binds each.
const getOuterLocals = (node: ts.Node, context: Context) =>
  findNodes(node, ts.isIdentifier).flatMap((name) => {
    const symbol = getSymbol(name, context.checker);
    const declaration = symbol?.valueDeclaration;
    const owner =
      declaration === undefined
        ? undefined
        : ts.findAncestor(declaration.parent, ts.isFunctionLike);
    return symbol !== undefined &&
      declaration !== undefined &&
      owner !== undefined &&
      (ts.isVariableDeclaration(declaration) ||
        ts.isParameter(declaration) ||
        ts.isBindingElement(declaration) ||
        ts.isFunctionDeclaration(declaration) ||
        ts.isClassDeclaration(declaration)) &&
      ts.findAncestor(declaration, (ancestor) => ancestor === node) === undefined
      ? [{ symbol, owner }]
      : [];
  });

export type Closure = ts.FunctionExpression | ts.ArrowFunction;

// A function that a function makes and that outlives the call that made it, which reads the locals
// of that call from its environment: one that the function assigns to a name declared outside it,
// or an async one that it returns. An arrow reads the this of the function around it, which the
// environment doesn't hold, and an async closure that awaits would resume after its call returns.
export const isClosure = (node: ts.Node, context: Context): node is Closure => {
  if (
    context.heap === undefined ||
    !(ts.isFunctionExpression(node) || ts.isArrowFunction(node)) ||
    (ts.isFunctionExpression(node) && (node.name !== undefined || node.asteriskToken !== undefined))
  ) {
    return false;
  }
  const isAsync = (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Async) !== 0;
  const isLexical = (inner: ts.Node): inner is ts.Node =>
    inner.kind === ts.SyntaxKind.ThisKeyword ||
    inner.kind === ts.SyntaxKind.SuperKeyword ||
    ts.isMetaProperty(inner);
  const isAwaiting = (inner: ts.Node): inner is ts.Node =>
    ts.isAwaitExpression(inner) ||
    (ts.isForOfStatement(inner) && inner.awaitModifier !== undefined);
  const maker = ts.findAncestor(node.parent, ts.isFunctionLike);
  if (
    maker === undefined ||
    (ts.isArrowFunction(node) && findNodes(node, isLexical).length > 0) ||
    (isAsync && findNodes(node, isAwaiting).length > 0)
  ) {
    return false;
  }
  const assignment = node.parent;
  const declaration =
    ts.isBinaryExpression(assignment) &&
    assignment.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
    assignment.right === node &&
    ts.isIdentifier(assignment.left) &&
    ts.isExpressionStatement(assignment.parent)
      ? getSymbol(assignment.left, context.checker)?.valueDeclaration
      : undefined;
  return (
    (isAsync && ts.isReturnStatement(node.parent) && node.parent.expression === node) ||
    (declaration !== undefined &&
      ts.findAncestor(declaration, (ancestor) => ancestor === maker) === undefined)
  );
};

// The function around an arrow closure whose arguments object the closure reads, which must be the
// function that makes it.
export const getCapturedArguments = (node: Closure, context: Context) => {
  const owners = new Set(
    findNodes(node, ts.isIdentifier).flatMap((name) => {
      const owner = getArgumentsOwner(name, context.checker);
      return owner === undefined || ts.findAncestor(owner, (ancestor) => ancestor === node)
        ? []
        : [owner];
    }),
  );
  const maker = ts.findAncestor(node.parent, ts.isFunctionLike);
  if ([...owners].some((owner) => owner !== maker)) {
    throw new TlaTypeScriptError(
      "tla-ts can't follow a function that outlives its call and reads this arguments object",
      node,
    );
  }
  return [...owners].at(0);
};

// The locals of the function that makes a closure that the closure reads, each once. tla-ts copies
// them to the closure's environment where the function makes it, so each must hold its value by
// then, and keep it.
export const getCaptures = (node: Closure, context: Context) => {
  const maker = ts.findAncestor(node.parent, ts.isFunctionLike);
  // A loop between a node and the function that makes the closure, which runs it again.
  const isRepeated = (inner: ts.Node) =>
    ts.findAncestor(inner, (ancestor) =>
      ancestor === maker ? "quit" : ts.isIterationStatement(ancestor, false),
    ) !== undefined;
  const captures = findNodes(node, ts.isIdentifier).flatMap((name) => {
    const symbol = ts.isShorthandPropertyAssignment(name.parent)
      ? context.checker.getShorthandAssignmentValueSymbol(name.parent)
      : getSymbol(name, context.checker);
    const declaration = symbol?.valueDeclaration;
    return symbol !== undefined &&
      declaration !== undefined &&
      ts.findAncestor(declaration, (ancestor) => ancestor === node) === undefined &&
      ts.findAncestor(declaration.parent, ts.isFunctionLike) !== undefined &&
      (ts.isVariableDeclaration(declaration) ||
        ts.isParameter(declaration) ||
        ts.isBindingElement(declaration) ||
        ts.isFunctionDeclaration(declaration) ||
        ts.isFunctionExpression(declaration) ||
        ts.isClassLike(declaration))
      ? [{ name, symbol, declaration }]
      : [];
  });
  captures.forEach((capture) => {
    const declaration = capture.declaration;
    // A local that changes lives in the environment once the closure is made, so nothing but the
    // closure may name it after that.
    if (
      isAssigned(capture.symbol, node.getSourceFile(), context) &&
      maker !== undefined &&
      !findNodes(maker, ts.isIdentifier).every(
        (name) =>
          (ts.isShorthandPropertyAssignment(name.parent)
            ? context.checker.getShorthandAssignmentValueSymbol(name.parent)
            : getSymbol(name, context.checker)) !== capture.symbol ||
          ts.findAncestor(name, (ancestor) => ancestor === node) !== undefined ||
          (name.end <= node.getStart() &&
            ts.findAncestor(name.parent, ts.isFunctionLike) === maker),
      )
    ) {
      throw new TlaTypeScriptError(
        "tla-ts can't follow a function that outlives its call and shares a local that changes",
        capture.name,
      );
    }
    if (
      !(ts.isVariableDeclaration(declaration) || ts.isParameter(declaration)) ||
      !ts.isIdentifier(declaration.name) ||
      ts.findAncestor(declaration.parent, ts.isFunctionLike) !== maker ||
      isRepeated(node) ||
      (ts.isVariableDeclaration(declaration) &&
        (isRepeated(declaration) || declaration.end > node.getStart()))
    ) {
      throw new TlaTypeScriptError(
        "tla-ts can't follow a function that outlives its call and reads this name",
        capture.name,
      );
    }
  });
  return [...new Set(captures.map((capture) => capture.symbol))];
};

// The async function around a function that binds each local the function reads from outside it.
const getAsyncOwner = (node: ts.Node, context: Context) => {
  const enclosing = ts.findAncestor(node.parent, ts.isFunctionLike);
  const locals = getOuterLocals(node, context);
  return enclosing !== undefined &&
    (ts.isFunctionDeclaration(enclosing) ||
      ts.isFunctionExpression(enclosing) ||
      ts.isArrowFunction(enclosing) ||
      ts.isMethodDeclaration(enclosing)) &&
    isAsyncFunction(enclosing) &&
    locals.length > 0 &&
    locals.every((local) => local.owner === enclosing)
    ? enclosing
    : undefined;
};

// The async function whose locals a method of an object literal that it makes, or a function that
// it passes to adopt or defer, reads. Each call of the function makes the method anew, a closure
// that holds the call's environment, which runs only where that call runs, and reads the locals
// that the call binds there, unlike a closure that outlives its call.
export const getLiveMaker = (node: ts.Node, context: Context) =>
  ((ts.isMethodDeclaration(node) && ts.isObjectLiteralExpression(node.parent)) ||
    isDisposeCallback(node, context)) &&
  !isOnce(node.parent) &&
  node.asteriskToken === undefined
    ? getAsyncOwner(node, context)
    : undefined;

// The async function whose locals a function inside it reads from the one call that made it: the
// call whose environment a live method holds, the only call of a function that runs once, or the
// call that calls a function it declares by name.
export const getKeptMaker = (node: ts.Node, context: Context) => {
  const owner = getAsyncOwner(node, context);
  const declared = ts.isFunctionDeclaration(node) ? node.name : undefined;
  const symbol = declared === undefined ? undefined : getSymbol(declared, context.checker);
  return (
    getLiveMaker(node, context) ??
    (owner !== undefined &&
    (isOnce(owner) ||
      (symbol !== undefined &&
        findNodes(owner, ts.isIdentifier)
          .filter((name) => name !== declared && getSymbol(name, context.checker) === symbol)
          .every(
            (name) =>
              ts.isCallExpression(name.parent) &&
              name.parent.expression === name &&
              ts.findAncestor(name.parent, ts.isFunctionLike) === owner,
          )))
      ? owner
      : undefined)
  );
};

// The locals of an async function that functions inside it read, each with the key of its value in
// the environment of a call, which holds them while a body that runs later may read or change them.
export const getKeptLocals = (maker: ts.Node, context: Context) =>
  [
    ...new Set(
      findNodes(
        maker,
        (node): node is ts.SignatureDeclaration => node !== maker && ts.isFunctionLike(node),
      ).flatMap((inner) =>
        getOuterLocals(inner, context).flatMap((local) =>
          local.owner === maker ? [local.symbol] : [],
        ),
      ),
    ),
  ].map((symbol, position, locals) => ({
    symbol,
    key: locals.slice(0, position).some((other) => other.name === symbol.name)
      ? `${symbol.name}#${position}`
      : symbol.name,
  }));

// Whether a node gives a named binding's default, through parentheses and the commas that end in it.
const isDefault = (node: ts.Node): boolean =>
  ts.isParenthesizedExpression(node.parent) ||
  (ts.isBinaryExpression(node.parent) &&
    node.parent.operatorToken.kind === ts.SyntaxKind.CommaToken &&
    node.parent.right === node)
    ? isDefault(node.parent)
    : (ts.isBindingElement(node.parent) || ts.isParameter(node.parent)) &&
      node.parent.initializer === node &&
      ts.isIdentifier(node.parent.name);

export type HeapFunction = ts.FunctionDeclaration | ts.FunctionExpression;

// A function that a descriptor gives as its get or set, which an object literal may write as a
// method.
export type AccessorFunction = HeapFunction | ts.MethodDeclaration;

export type HeapClass = ts.ClassLikeDeclaration | HeapFunction;

const heapFunctions = new WeakMap<ts.Node, boolean>();

export const skipCasts = (node: ts.Expression): ts.Expression =>
  ts.isParenthesizedExpression(node) ||
  ts.isNonNullExpression(node) ||
  ts.isAsExpression(node) ||
  ts.isTypeAssertionExpression(node)
    ? skipCasts(node.expression)
    : node;

// Whether a function body returns a value, which a new gives in place of the instance when it's
// an object.
const isReturning = (node: ts.Node): boolean =>
  (ts.isReturnStatement(node) && node.expression !== undefined) ||
  (!ts.isFunctionLike(node) &&
    (ts.forEachChild(node, (child) => isReturning(child) || undefined) ?? false));

// A function that a script makes once and calls with new, which it makes into objects on the heap
// as it does a heap class: a constructor object, and the prototype that its instances inherit.
// Whether a function assigns a property or a variable it doesn't declare, itself or through the
// functions it calls.
// The built-in methods that change an array, a set, or a map in place.
const IN_PLACE_CHANGES = new Set([
  "push",
  "pop",
  "shift",
  "unshift",
  "splice",
  "sort",
  "reverse",
  "fill",
  "copyWithin",
  "add",
  "set",
  "delete",
  "clear",
]);

export const changesState = (
  callee: ts.Node,
  node: ts.Node,
  context: Context,
  visited: Set<ts.Node>,
): boolean => {
  const target =
    ts.isBinaryExpression(node) &&
    node.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
    node.operatorToken.kind <= ts.SyntaxKind.LastAssignment
      ? node.left
      : (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) &&
          (node.operator === ts.SyntaxKind.PlusPlusToken ||
            node.operator === ts.SyntaxKind.MinusMinusToken)
        ? node.operand
        : ts.isDeleteExpression(node)
          ? node.expression
          : undefined;
  const declaration =
    target !== undefined && ts.isIdentifier(skipCasts(target))
      ? context.checker.getSymbolAtLocation(skipCasts(target))?.valueDeclaration
      : undefined;
  if (
    target !== undefined &&
    (declaration === undefined ||
      declaration.getSourceFile() !== callee.getSourceFile() ||
      declaration.pos < callee.pos ||
      declaration.end > callee.end)
  ) {
    return true;
  }
  if (ts.isCallExpression(node)) {
    const called =
      getCallee(node.expression, context) ?? getCalledMethod(node.expression, context)?.method;
    if (called !== undefined && !visited.has(called)) {
      visited.add(called);
      if (changesState(called, called, context, visited)) return true;
    }
    // A built-in method that changes in place an array or a collection that isn't a local, or that
    // the heap holds, which a local may name.
    const receiver = isMethodCall(node) ? skipCasts(node.expression.expression) : undefined;
    const local =
      receiver !== undefined && ts.isIdentifier(receiver)
        ? context.checker.getSymbolAtLocation(receiver)?.valueDeclaration
        : undefined;
    if (
      called === undefined &&
      receiver !== undefined &&
      isMethodCall(node) &&
      IN_PLACE_CHANGES.has(node.expression.name.text) &&
      (local === undefined ||
        local.pos < callee.pos ||
        local.end > callee.end ||
        isHeapArray(receiver, context) ||
        isHeapSetOrMap(receiver, context))
    ) {
      return true;
    }
  }
  return (
    ts.forEachChild(node, (child) => changesState(callee, child, context, visited) || undefined) ??
    false
  );
};

const accessorFunctions = new WeakMap<ts.SourceFile, Map<string, AccessorFunction[]>>();

// The functions that a script writes as the get or the set of a property descriptor, which a read
// or a write of a property that tla-ts can't resolve may run.
export const getAccessorFunctions = (node: ts.Node, field: "get" | "set", context: Context) => {
  const file = node.getSourceFile();
  const known = accessorFunctions.get(file);
  if (known !== undefined) return known.get(field) ?? [];
  const found = new Map<string, AccessorFunction[]>([
    ["get", []],
    ["set", []],
  ]);
  // A descriptor's get or set, which an object literal, as a property or a method, an assignment,
  // or a definition's value gives it.
  const visit = (child: ts.Node) => {
    const isAssigned =
      ts.isBinaryExpression(child) &&
      child.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      ts.isPropertyAccessExpression(child.left);
    const definition =
      ts.isCallExpression(child) &&
      ts.isPropertyAccessExpression(child.expression) &&
      child.expression.name.text === "defineProperty"
        ? child.arguments
        : undefined;
    const attributes = definition?.at(2);
    const defined =
      attributes !== undefined && ts.isObjectLiteralExpression(attributes)
        ? attributes.properties.find(
            (property): property is ts.PropertyAssignment =>
              ts.isPropertyAssignment(property) &&
              ts.isIdentifier(property.name) &&
              property.name.text === "value",
          )
        : undefined;
    const name =
      ts.isPropertyAssignment(child) ||
      (ts.isMethodDeclaration(child) && ts.isObjectLiteralExpression(child.parent))
        ? child.name
        : isAssigned && ts.isPropertyAccessExpression(child.left)
          ? child.left.name
          : defined === undefined
            ? undefined
            : definition?.at(1);
    const list =
      name !== undefined && (ts.isIdentifier(name) || ts.isStringLiteral(name))
        ? found.get(name.text)
        : undefined;
    const value = ts.isPropertyAssignment(child)
      ? child.initializer
      : ts.isBinaryExpression(child)
        ? child.right
        : defined?.initializer;
    const accessor = ts.isMethodDeclaration(child)
      ? child
      : list === undefined || value === undefined
        ? undefined
        : getCallee(value, context);
    if (
      list !== undefined &&
      accessor !== undefined &&
      (ts.isFunctionDeclaration(accessor) ||
        ts.isFunctionExpression(accessor) ||
        ts.isMethodDeclaration(accessor)) &&
      getParameters(accessor).every((parameter) => parameter.dotDotDotToken === undefined) &&
      !list.includes(accessor)
    ) {
      list.push(accessor);
    }
    ts.forEachChild(child, visit);
  };
  visit(file);
  accessorFunctions.set(file, found);
  return found.get(field) ?? [];
};

const setAccessors = new WeakMap<ts.SourceFile, ts.SetAccessorDeclaration[]>();

// The setters that a script writes in object literals and classes under a key it names, of those
// that tla-ts inlines.
const getSetAccessors = (node: ts.Node, context: Context) => {
  const file = node.getSourceFile();
  const known = setAccessors.get(file);
  if (known !== undefined) return known;
  const found = findNodes(
    file,
    (inner): inner is ts.SetAccessorDeclaration =>
      ts.isSetAccessorDeclaration(inner) &&
      getNameKey(inner.name) !== undefined &&
      isInlinedAccessor(inner, context),
  );
  setAccessors.set(file, found);
  return found;
};

const getNameKey = (name: ts.Node) =>
  ts.isIdentifier(name) || ts.isStringLiteral(name)
    ? name.text
    : ts.isNumericLiteral(name)
      ? String(Number(name.text))
      : undefined;

// The keys that a write may pick, or undefined where its key's type allows any.
const getWrittenKeys = (node: ts.Node, context: Context) => {
  const target = ts.isBinaryExpression(node)
    ? skipCasts(node.left)
    : ts.isExpression(node)
      ? skipCasts(node)
      : undefined;
  if (target !== undefined && ts.isPropertyAccessExpression(target)) return [target.name.text];
  const key =
    target !== undefined && ts.isElementAccessExpression(target)
      ? context.checker.getTypeAtLocation(target.argumentExpression)
      : undefined;
  const types = key === undefined ? [] : key.isUnion() ? key.types : [key];
  const literals = types.flatMap((type) =>
    type.isStringLiteral() || type.isNumberLiteral() ? [String(type.value)] : [],
  );
  return literals.length > 0 && literals.length === types.length ? literals : undefined;
};

// The setters that a write may run, which take the value as their first parameter. A parameter
// after it holds undefined, which one that TypeScript types as given can't.
export const getSetters = (node: ts.Node, context: Context) => {
  const keys = getWrittenKeys(node, context);
  return [
    ...getAccessorFunctions(node, "set", context),
    ...getReturnedFunctions(node, context),
    ...getSetAccessors(node, context).filter(
      (setter) => keys === undefined || keys.includes(getNameKey(setter.name) ?? ""),
    ),
  ].filter((setter) =>
    getParameters(setter)
      .slice(1)
      .every(
        (parameter) =>
          parameter.type === undefined ||
          parameter.questionToken !== undefined ||
          parameter.initializer !== undefined,
      ),
  );
};

// The properties that an assignment's target writes, alone or in a pattern.
export const getWrittenProperties = (
  target: ts.Node,
): (ts.PropertyAccessExpression | ts.ElementAccessExpression)[] =>
  ts.isPropertyAccessExpression(target) || ts.isElementAccessExpression(target)
    ? [target]
    : ts.isParenthesizedExpression(target) ||
        ts.isSpreadElement(target) ||
        ts.isSpreadAssignment(target)
      ? getWrittenProperties(target.expression)
      : ts.isBinaryExpression(target) && target.operatorToken.kind === ts.SyntaxKind.EqualsToken
        ? getWrittenProperties(target.left)
        : ts.isArrayLiteralExpression(target)
          ? target.elements.flatMap(getWrittenProperties)
          : ts.isObjectLiteralExpression(target)
            ? target.properties.flatMap((property) =>
                ts.isPropertyAssignment(property) || ts.isSpreadAssignment(property)
                  ? getWrittenProperties(
                      ts.isPropertyAssignment(property) ? property.initializer : property,
                    )
                  : [],
              )
            : [];

// The setters that a write of a property may run: the one its type names, and those the script
// defines that it may find there.
export const getPropertySetters = (target: ts.Expression, context: Context) =>
  [
    getObjectAccessor(target, ts.isSetAccessorDeclaration, context) ?? [],
    getSetters(target, context),
  ].flat();

// Whether a node makes a function or an object, which only a statement can. A type, such as one
// with an index signature, makes nothing.
const isMaking = (node: ts.Node): boolean =>
  !ts.isTypeNode(node) &&
  (ts.isFunctionLike(node) ||
    ts.isClassLike(node) ||
    ts.isObjectLiteralExpression(node) ||
    ts.isNewExpression(node) ||
    (ts.forEachChild(node, (child) => isMaking(child) || undefined) ?? false));

const returnedFunctions = new WeakMap<ts.SourceFile, HeapFunction[]>();

// The function objects that functions return, as a function they make or one a name holds, which a
// descriptor may give as a getter or a setter.
export const getReturnedFunctions = (node: ts.Node, context: Context) => {
  const file = node.getSourceFile();
  const known = returnedFunctions.get(file);
  if (known !== undefined) return known;
  const found = findNodes(file, ts.isReturnStatement).flatMap((statement) => {
    const returned = statement.expression;
    const named =
      returned !== undefined && ts.isIdentifier(returned)
        ? getCallee(returned, context)
        : undefined;
    return returned !== undefined &&
      ts.isFunctionExpression(returned) &&
      isNestedFunction(returned, context)
      ? [returned]
      : named !== undefined && (ts.isFunctionExpression(named) || ts.isFunctionDeclaration(named))
        ? [named]
        : [];
  });
  const unique = [...new Set(found)];
  returnedFunctions.set(file, unique);
  return unique;
};

// The getters that a read can run as an expression, which take no argument, change nothing, and
// make no function or object.
export const getGetters = (node: ts.Node, context: Context) =>
  [...getAccessorFunctions(node, "get", context), ...getReturnedFunctions(node, context)].filter(
    (getter) =>
      getParameters(getter).length === 0 &&
      getter.body !== undefined &&
      !isMaking(getter.body) &&
      !changesState(getter, getter.body, context, new Set([getter])),
  );

export const isHeapFunction = (node: ts.Node, context: Context): node is HeapFunction => {
  if (context.heap === undefined) return false;
  if (!ts.isFunctionDeclaration(node) && !ts.isFunctionExpression(node)) return false;
  const known = heapFunctions.get(node);
  if (known !== undefined) return known;
  const nameNode = ts.isFunctionDeclaration(node)
    ? node.name
    : ts.isVariableDeclaration(node.parent) && node.parent.initializer === node
      ? node.parent.name
      : undefined;
  const symbol =
    nameNode === undefined || !ts.isIdentifier(nameNode)
      ? undefined
      : getSymbol(nameNode, context.checker);
  const sourceFile = node.getSourceFile();
  // A new or Reflect.construct constructs the function or takes it as newTarget, or an Object
  // function reads or changes it as an object.
  const isNewTarget = (child: ts.Node): boolean => {
    const construction = getConstruction(child, context);
    const targets =
      ts.isCallExpression(child) &&
      ts.isPropertyAccessExpression(child.expression) &&
      getBuiltIn(child.expression.expression, context) === "Object" &&
      OWN_PROPERTY_FUNCTIONS.has(child.expression.name.text)
        ? child.arguments.slice(0, 1)
        : construction === undefined
          ? []
          : [construction.callee, construction.newTarget];
    return (
      targets.some((target) => getSymbol(skipCasts(target), context.checker) === symbol) ||
      (ts.forEachChild(child, (inner) => isNewTarget(inner) || undefined) ?? false)
    );
  };
  const isHeap =
    symbol !== undefined &&
    node.body !== undefined &&
    isPlain(node) &&
    isOnce(node.parent) &&
    !isAssigned(symbol, sourceFile, context) &&
    (isNewTarget(sourceFile)
      ? !isReturning(node.body)
      : // An assignment writes one of its properties.
        findNodes(
          sourceFile,
          (child): child is ts.BinaryExpression =>
            ts.isBinaryExpression(child) &&
            child.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
            (ts.isPropertyAccessExpression(child.left) ||
              ts.isElementAccessExpression(child.left)) &&
            getSymbol(skipCasts(child.left.expression), context.checker) === symbol,
        ).length > 0);
  heapFunctions.set(node, isHeap);
  return isHeap;
};

// The heap class that a name names.
export const getHeapClass = (node: ts.Expression, context: Context): HeapClass | undefined => {
  const declaration = getSymbol(skipCasts(node), context.checker)?.valueDeclaration;
  const found =
    declaration !== undefined && ts.isVariableDeclaration(declaration)
      ? declaration.initializer
      : declaration !== undefined &&
          ts.isPropertyDeclaration(declaration) &&
          declaration.initializer !== undefined &&
          ts.isClassExpression(declaration.initializer) &&
          isOnceField(declaration.initializer)
        ? declaration.initializer
        : declaration;
  return found !== undefined &&
    ((ts.isClassLike(found) && isHeapClass(found, context)) || isHeapFunction(found, context))
    ? found
    : undefined;
};

// A value that evaluating can't throw or change.
export const isInertValue = (argument: ts.Expression): boolean =>
  ts.isLiteralExpression(argument) ||
  ts.isIdentifier(argument) ||
  ts.isFunctionExpression(argument) ||
  ts.isArrowFunction(argument) ||
  [ts.SyntaxKind.NullKeyword, ts.SyntaxKind.TrueKeyword, ts.SyntaxKind.FalseKeyword].includes(
    argument.kind,
  ) ||
  (ts.isArrayLiteralExpression(argument) && argument.elements.every(isInertValue)) ||
  (ts.isObjectLiteralExpression(argument) &&
    argument.properties.every(
      (property) =>
        ts.isPropertyAssignment(property) &&
        !ts.isComputedPropertyName(property.name) &&
        isInertValue(property.initializer),
    ));

// A file that exports nothing, which runs as JavaScript does rather than as a spec's model.
export const isScript = (sourceFile: ts.SourceFile) =>
  sourceFile.statements.every(
    (statement) =>
      !ts.canHaveModifiers(statement) ||
      !(ts.getModifiers(statement) ?? []).some(
        (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
      ),
  );

// What a new, or a Reflect.construct of a list of arguments, constructs, the arguments it passes,
// and the newTarget whose prototype property gives the instance its prototype.
export interface Construction {
  callee: ts.Expression;
  arguments: readonly ts.Expression[];
  newTarget: ts.Expression;
}

export const getConstruction = (node: ts.Node, context: Context): Construction | undefined => {
  if (ts.isNewExpression(node)) {
    return { callee: node.expression, arguments: node.arguments ?? [], newTarget: node.expression };
  }
  if (
    !ts.isCallExpression(node) ||
    !ts.isPropertyAccessExpression(node.expression) ||
    node.expression.name.text !== "construct" ||
    getBuiltIn(node.expression.expression, context) !== "Reflect" ||
    node.arguments.length > 3
  ) {
    return undefined;
  }
  const callee = node.arguments.at(0);
  const list = node.arguments.at(1);
  const newTarget = node.arguments.at(2) ?? callee;
  return callee !== undefined &&
    newTarget !== undefined &&
    ts.isIdentifier(newTarget) &&
    list !== undefined &&
    ts.isArrayLiteralExpression(list) &&
    list.elements.every(
      (element) => !ts.isSpreadElement(element) && !ts.isOmittedExpression(element),
    )
    ? { callee, arguments: list.elements, newTarget }
    : undefined;
};

// The Object functions that read or change only an object's own properties, its extensibility, and
// its prototype.
const OWN_PROPERTY_FUNCTIONS = new Set([
  "defineProperty",
  "freeze",
  "getOwnPropertyDescriptor",
  "getOwnPropertyNames",
  "getPrototypeOf",
  "hasOwn",
  "isExtensible",
  "isFrozen",
  "isSealed",
  "keys",
  "preventExtensions",
  "seal",
]);

// A new of a native error class, without a message or with a string, which a variable holds where
// each use reads it as an object: as an Object function's argument, as the object of a property
// access, in a comparison, typeof, or instanceof, or as the argument of a script's function whose
// parameter takes an object that isn't an error. The heap holds such an error as an object, with
// the slot that marks it as one. An error that a script throws, or keeps elsewhere, stays a record.
// A SuppressedError has own properties.
// It assumes that the errors it is already deciding are held, so two of them can be compared.
export const isHeldError = (
  node: ts.Node,
  context: Context,
  assumed: ReadonlySet<ts.Node> = new Set(),
): node is ts.NewExpression => {
  if (context.heap === undefined || !ts.isNewExpression(node)) return false;
  const name = getBuiltIn(node.expression, context);
  const holder = node.parent;
  const message = node.arguments?.at(0);
  if (
    name === undefined ||
    !NATIVE_ERRORS.has(name) ||
    name === "SuppressedError" ||
    (node.arguments ?? []).length > 1 ||
    (message !== undefined &&
      getTypeNames(context.checker.getTypeAtLocation(message), context.checker)?.join() !==
        "string") ||
    !ts.isVariableDeclaration(holder) ||
    holder.initializer !== node ||
    !ts.isIdentifier(holder.name)
  ) {
    return false;
  }
  const symbol = getSymbol(holder.name, context.checker);
  const isObjectParameter = (call: ts.CallExpression, position: number) => {
    const declaration = context.checker.getResolvedSignature(call)?.getDeclaration();
    const parameter =
      declaration === undefined || declaration.getSourceFile().isDeclarationFile
        ? undefined
        : declaration.parameters.at(position);
    const type =
      parameter === undefined || parameter.dotDotDotToken !== undefined
        ? undefined
        : context.checker.getTypeAtLocation(parameter);
    return (
      type !== undefined &&
      type.getCallSignatures().length === 0 &&
      getErrorClass(context.checker.getNonNullableType(type).getSymbol(), context.checker) ===
        undefined
    );
  };
  const isObjectUse = (name: ts.Identifier) => {
    const child = ts.findAncestor(
      name,
      (ancestor) =>
        !ts.isParenthesizedExpression(ancestor.parent) &&
        !ts.isAsExpression(ancestor.parent) &&
        !ts.isSatisfiesExpression(ancestor.parent) &&
        !ts.isNonNullExpression(ancestor.parent),
    );
    const parent = child?.parent;
    if (child === undefined || parent === undefined) return false;
    if (ts.isPropertyAccessExpression(parent) || ts.isElementAccessExpression(parent)) {
      return parent.expression === child;
    }
    if (ts.isTypeOfExpression(parent)) return true;
    if (ts.isBinaryExpression(parent)) {
      const kind = parent.operatorToken.kind;
      // An error that stays a record can't equal one that the heap holds.
      const other = skipCasts(parent.left === child ? parent.right : parent.left);
      return (
        ([
          ts.SyntaxKind.EqualsEqualsEqualsToken,
          ts.SyntaxKind.ExclamationEqualsEqualsToken,
          ts.SyntaxKind.EqualsEqualsToken,
          ts.SyntaxKind.ExclamationEqualsToken,
        ].includes(kind) &&
          (getErrorClass(
            context.checker
              .getNonNullableType(context.checker.getTypeAtLocation(other))
              .getSymbol(),
            context.checker,
          ) === undefined ||
            isHeldErrorName(other, context, new Set([...assumed, node])))) ||
        (kind === ts.SyntaxKind.InstanceOfKeyword && parent.left === child)
      );
    }
    if (!ts.isCallExpression(parent) || parent.expression === child) return false;
    const callee = parent.expression;
    return (
      (ts.isPropertyAccessExpression(callee) &&
        getBuiltIn(callee.expression, context) === "Object") ||
      (ts.isPropertyAccessExpression(callee) &&
        callee.name.text === "call" &&
        callee.expression.getText().startsWith("Object.prototype.")) ||
      isObjectParameter(
        parent,
        parent.arguments.findIndex((argument) => argument === child),
      )
    );
  };
  const isEveryUse = (child: ts.Node): boolean =>
    (child === holder.name ||
      !ts.isIdentifier(child) ||
      getSymbol(child, context.checker) !== symbol ||
      isObjectUse(child)) &&
    !(ts.forEachChild(child, (inner) => !isEveryUse(inner) || undefined) ?? false);
  return symbol !== undefined && isEveryUse(node.getSourceFile());
};

// A name whose variable holds such an error.
export const isHeldErrorName = (
  node: ts.Expression,
  context: Context,
  assumed: ReadonlySet<ts.Node> = new Set(),
) => {
  const declaration = ts.isIdentifier(node)
    ? getSymbol(node, context.checker)?.valueDeclaration
    : undefined;
  return (
    declaration !== undefined &&
    ts.isVariableDeclaration(declaration) &&
    declaration.initializer !== undefined &&
    (assumed.has(declaration.initializer) || isHeldError(declaration.initializer, context, assumed))
  );
};

// The heap class that a new names, or that Reflect.construct constructs with a newTarget that is
// a constructor, so that it can't throw.
export const getNewClass = (node: ts.Node, context: Context) => {
  const construction = getConstruction(node, context);
  if (construction === undefined) return undefined;
  const builtIn = getBuiltIn(construction.newTarget, context);
  return construction.newTarget === construction.callee ||
    getHeapClass(construction.newTarget, context) !== undefined ||
    (builtIn !== undefined && BUILT_INS[builtIn][4])
    ? getHeapClass(construction.callee, context)
    : undefined;
};

// A class's constructor, or a function, when its body runs statements, and else a class whose
// fields run a constructor. A derived class without a constructor runs its base's.
export const getRunConstructor = (
  node: HeapClass,
  context: Context,
): ts.ConstructorDeclaration | HeapClass | undefined => {
  if (!ts.isClassLike(node)) return (node.body?.statements.length ?? 0) > 0 ? node : undefined;
  const constructor = node.members.find(ts.isConstructorDeclaration);
  const base = getBaseClass(node, context);
  const run =
    constructor === undefined
      ? base && getRunConstructor(base, context)
      : (constructor.body?.statements.length ?? 0) > 0 || isNullBased(node)
        ? constructor
        : undefined;
  if (base !== undefined && run !== undefined && ts.isClassLike(run)) {
    throw new TlaTypeScriptError(
      "tla-ts can't extend a class whose fields run a constructor",
      node,
    );
  }
  return run ?? (getRunFields(node, context).length > 0 ? node : undefined);
};

// The fields of a class without a base that a new defines one at a time, as statements, from the
// first that runs a constructor.
export const getRunFields = (node: HeapClass, context: Context) => {
  if (!ts.isClassLike(node) || hasExtends(node)) return [];
  const fields = node.members.filter(
    (member): member is ts.PropertyDeclaration =>
      ts.isPropertyDeclaration(member) && !isStatic(member) && !isAmbient(member),
  );
  const first = fields.findIndex((field) => {
    const created = field.initializer && getNewClass(field.initializer, context);
    return created !== undefined && getRunConstructor(created, context) !== undefined;
  });
  return first === -1 ? [] : fields.slice(first);
};

// Whether a new is all that a statement evaluates, besides the variable it initializes or
// assigns, so the statement can run the constructor.
export const isStatementNew = (node: ts.Expression) => {
  const parent = node.parent;
  return (
    ts.isExpressionStatement(parent) ||
    ts.isReturnStatement(parent) ||
    ts.isThrowStatement(parent) ||
    (ts.isPropertyDeclaration(parent) &&
      parent.initializer === node &&
      (isStatic(parent) || !hasExtends(parent.parent))) ||
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

// The member of a heap class that a private name names.
// The private name that a statement's expression reads, writes, or calls on this or a name before
// it evaluates anything else, which throws a TypeError where the object lacks it.
export const getLeadingPrivate = (node: ts.Expression): ts.PropertyAccessExpression | undefined => {
  if (
    ts.isPropertyAccessExpression(node) &&
    ts.isPrivateIdentifier(node.name) &&
    (node.expression.kind === ts.SyntaxKind.ThisKeyword || ts.isIdentifier(node.expression))
  ) {
    return node;
  }
  if (
    ts.isParenthesizedExpression(node) ||
    ts.isAsExpression(node) ||
    ts.isNonNullExpression(node) ||
    ts.isPropertyAccessExpression(node) ||
    ts.isElementAccessExpression(node) ||
    ts.isCallExpression(node) ||
    ts.isAwaitExpression(node) ||
    ts.isTypeOfExpression(node) ||
    ts.isVoidExpression(node)
  ) {
    return getLeadingPrivate(node.expression);
  }
  if (ts.isPrefixUnaryExpression(node) || ts.isPostfixUnaryExpression(node)) {
    return getLeadingPrivate(node.operand);
  }
  if (!ts.isBinaryExpression(node)) return undefined;
  if (node.operatorToken.kind !== ts.SyntaxKind.EqualsToken) return getLeadingPrivate(node.left);
  // A plain assignment checks its target only after it evaluates its value, and a pattern its
  // first target after it reads the value's first element or property.
  const right = skipCasts(node.right);
  const first = ts.isArrayLiteralExpression(node.left)
    ? node.left.elements.at(0)
    : ts.isObjectLiteralExpression(node.left)
      ? node.left.properties.at(0)
      : node.left;
  const target =
    first === undefined
      ? undefined
      : ts.isSpreadElement(first)
        ? first.expression
        : ts.isPropertyAssignment(first)
          ? ts.isObjectLiteralExpression(right) &&
            right.properties.some((property) => property.name?.getText() === first.name.getText())
            ? first.initializer
            : undefined
          : ts.isExpression(first)
            ? first
            : undefined;
  return isInertValue(right) &&
    target !== undefined &&
    (target === node.left || !ts.isBinaryExpression(target))
    ? getLeadingPrivate(target)
    : undefined;
};

export const getPrivateMember = (name: ts.PrivateIdentifier, context: Context) => {
  const declaration = getSymbol(name, context.checker)?.valueDeclaration;
  return declaration !== undefined &&
    ts.isClassElement(declaration) &&
    ts.isClassLike(declaration.parent) &&
    isHeapClass(declaration.parent, context)
    ? declaration
    : undefined;
};

// A plain method that a script makes once, of an object literal or a heap class, which a value can
// name, since each call checks that the property still holds it.
// A method of an object literal may have a computed name, such as [Symbol.iterator].
export const getObjectMethod = (node: ts.Node | undefined, context: Context) => {
  if (node === undefined || !ts.isMethodDeclaration(node) || node.body === undefined) {
    return undefined;
  }
  if (ts.isObjectLiteralExpression(node.parent)) return isOnce(node.parent) ? node : undefined;
  return (isPlainMethod(node) || isPrivateMethod(node)) &&
    ts.isClassLike(node.parent) &&
    isHeapClass(node.parent, context)
    ? node
    : undefined;
};

export interface CalledMethod {
  method: ts.MethodDeclaration | ts.GetAccessorDeclaration;
  receiver: ts.Expression;
  key: string;
  // A getter like `get method() { return this.#method; }` that the call reads the method through.
  getter?: ts.GetAccessorDeclaration;
}

// The object method that a callee such as obj.name or obj["name"] reads, which the call checks
// the object still holds: a plain method, or a generator method where the call makes a generator.
export const getCalledMethod = (
  node: ts.Expression,
  context: Context,
  isKind: (node: FunctionNode) => boolean = isPlain,
): CalledMethod | undefined => {
  const isAccess =
    context.heap !== undefined &&
    (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node));
  if (!isAccess) return undefined;
  const name = ts.isPropertyAccessExpression(node) ? node.name : node.argumentExpression;
  if (!ts.isIdentifier(name) && !ts.isPrivateIdentifier(name) && !ts.isStringLiteralLike(name)) {
    return undefined;
  }
  const declaration = getSymbol(name, context.checker)?.valueDeclaration;
  const getter =
    declaration !== undefined &&
    ts.isGetAccessorDeclaration(declaration) &&
    isPlainAccessor(declaration) &&
    ts.isClassLike(declaration.parent) &&
    isHeapClass(declaration.parent, context)
      ? declaration
      : undefined;
  const returned = getter === undefined ? undefined : getReturnedMethod(getter, context);
  const method = getObjectMethod(returned ?? declaration, context);
  return method === undefined || !isKind(method)
    ? undefined
    : { method, receiver: node.expression, key: name.text, getter };
};

// A value that a literal writes, which reads the same wherever it runs.
export const isLiteral = (node: ts.Expression) =>
  ts.isLiteralExpression(node) ||
  [ts.SyntaxKind.NullKeyword, ts.SyntaxKind.TrueKeyword, ts.SyntaxKind.FalseKeyword].includes(
    node.kind,
  );

interface FactoryCall {
  closure: FunctionNode;
  bindings: [ts.Symbol, ts.Expression][];
  variables: ts.VariableDeclaration[];
}

// The function that a call to a factory returns, where the factory only declares functions before
// it returns one, and the call passes it literals. A constant that the call initializes stands for
// that function, which reads each parameter of the factory as the literal that the call passes.
// The factory may also declare variables that a literal or a parameter initializes, where a script
// calls it once, in a constant that it declares outside any function or block, so that the call's
// variables are the only ones.
export const getFactoryCall = (
  node: ts.Node | undefined,
  context: Context,
): FactoryCall | undefined => {
  if (node === undefined || !ts.isCallExpression(node)) return undefined;
  const factory = getAnyFunction(getSymbol(node.expression, context.checker)?.valueDeclaration);
  const body = factory?.body;
  if (factory === undefined || !isPlain(factory) || body === undefined || !ts.isBlock(body)) {
    return undefined;
  }
  const returned = body.statements.at(-1);
  const statements = body.statements.slice(0, -1);
  const variables = statements.flatMap((statement) =>
    ts.isVariableStatement(statement)
      ? statement.declarationList.declarations.filter(
          (declaration) =>
            (statement.declarationList.flags & ts.NodeFlags.Const) === 0 ||
            getAnyFunction(declaration) === undefined,
        )
      : [],
  );
  const parameters = factory.parameters.map((parameter) =>
    getSymbol(parameter.name, context.checker),
  );
  const factorySymbol = getSymbol(node.expression, context.checker);
  const statement = node.parent.parent?.parent;
  const isDeclaringFunctions =
    statements.every((inner) =>
      ts.isVariableStatement(inner)
        ? inner.declarationList.declarations.every((declaration) =>
            ts.isIdentifier(declaration.name),
          )
        : ts.isFunctionDeclaration(inner) && inner.body !== undefined,
    ) &&
    variables.every(
      (variable) =>
        variable.initializer !== undefined &&
        (isLiteral(variable.initializer) ||
          (ts.isIdentifier(variable.initializer) &&
            parameters.includes(getSymbol(variable.initializer, context.checker)))),
    ) &&
    (variables.length === 0 ||
      (isScript(node.getSourceFile()) &&
        factory.getSourceFile() === node.getSourceFile() &&
        ts.isVariableDeclaration(node.parent) &&
        node.parent.initializer === node &&
        statement !== undefined &&
        ts.isVariableStatement(statement) &&
        ts.isSourceFile(statement.parent) &&
        // Nothing else names the factory, not even a shorthand property, so nothing calls it again.
        findNodes(node.getSourceFile(), ts.isIdentifier).every(
          (inner) =>
            inner === node.expression ||
            (factorySymbol?.declarations ?? []).some(
              (declaration) => ts.getNameOfDeclaration(declaration) === inner,
            ) ||
            (ts.isShorthandPropertyAssignment(inner.parent)
              ? context.checker.getShorthandAssignmentValueSymbol(inner.parent)
              : getSymbol(inner, context.checker)) !== factorySymbol,
        )));
  const expression =
    returned !== undefined && ts.isReturnStatement(returned) ? returned.expression : undefined;
  const closure =
    expression === undefined
      ? undefined
      : (getAnyFunction(expression) ??
        getAnyFunction(getSymbol(expression, context.checker)?.valueDeclaration));
  if (
    !isDeclaringFunctions ||
    closure === undefined ||
    !isPlain(closure) ||
    ts.findAncestor(closure, (ancestor) => ancestor === body) === undefined ||
    node.arguments.length !== factory.parameters.length ||
    !node.arguments.every(isLiteral)
  ) {
    return undefined;
  }
  const bindings = factory.parameters.flatMap(
    (parameter, position): [ts.Symbol, ts.Expression][] => {
      const symbol = getSymbol(parameter.name, context.checker);
      return symbol === undefined ? [] : [[symbol, node.arguments[position]]];
    },
  );
  return bindings.length === factory.parameters.length &&
    factory.parameters.every(
      (parameter) =>
        ts.isIdentifier(parameter.name) &&
        parameter.initializer === undefined &&
        parameter.dotDotDotToken === undefined,
    )
    ? { closure, bindings, variables }
    : undefined;
};

// The function that a callee or callback names: one written in place, one declared elsewhere, one
// that a factory returns, or a method of a known class.
const resolve = (node: ts.Expression, context: Context) => {
  const declaration = getSymbol(skipCasts(node), context.checker)?.valueDeclaration;
  return (
    getAnyFunction(skipCasts(node)) ??
    getAnyFunction(declaration) ??
    (declaration !== undefined && ts.isVariableDeclaration(declaration)
      ? getFactoryCall(declaration.initializer, context)?.closure
      : undefined) ??
    getMethod(node, context)
  );
};

export const getCallee = (node: ts.Expression, context: Context) => {
  const found = resolve(node, context);
  return found !== undefined && isPlain(found) ? found : undefined;
};

export const getFunctionOfKind = (
  node: ts.Expression,
  context: Context,
  isKind: (node: FunctionNode) => boolean,
) => {
  const found = resolve(node, context);
  return found !== undefined && isKind(found) ? found : undefined;
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

export const getElement = (
  sequence: Expression,
  position: Expression,
  context: Context,
  missing = getUndefined(context),
) =>
  share(sequence, "sequence", context, (shared) =>
    share(position, "position", context, (at) =>
      ifExpression(apply("\\in", [at, apply("DOMAIN", [shared])]), index(shared, [at]), missing),
    ),
  );

// The nodes in a tree, its root included, that a test picks.
// Whether a function reads a name that it binds, directly or through its arguments object.
export const isNameRead = (name: ts.Identifier, within: ts.Node, context: Context) => {
  const symbol = getSymbol(name, context.checker);
  return findNodes(within, ts.isIdentifier).some(
    (other) =>
      other !== name &&
      (other.text === "arguments" || getSymbol(other, context.checker) === symbol),
  );
};

export const findNodes = <T extends ts.Node>(root: ts.Node, test: (node: ts.Node) => node is T) => {
  const found: T[] = [];
  const visit = (node: ts.Node) => {
    if (test(node)) found.push(node);
    ts.forEachChild(node, (child) => {
      visit(child);
    });
  };
  visit(root);
  return found;
};

const candidates = new WeakMap<ts.SourceFile, FunctionNode[]>();

// The functions that a value whose type has calls may hold, where tla-ts can't tell which: those
// that no other function encloses, whose type TypeScript lets the value hold.
export const getFunctionCandidates = (callee: ts.Expression, context: Context) => {
  if (isHeldBuiltInObject(callee, context)) return [];
  const sourceFile = callee.getSourceFile();
  const found =
    candidates.get(sourceFile) ??
    findNodes(sourceFile, (inner): inner is FunctionNode => {
      const candidate =
        ts.isFunctionDeclaration(inner) ||
        ts.isFunctionExpression(inner) ||
        ts.isArrowFunction(inner)
          ? inner
          : getObjectMethod(inner, context);
      return (
        candidate?.body !== undefined &&
        ts.findAncestor(candidate.parent, ts.isFunctionLike) === undefined
      );
    });
  candidates.set(sourceFile, found);
  const type = context.checker.getTypeAtLocation(callee);
  return found.filter((candidate) =>
    context.checker.isTypeAssignableTo(context.checker.getTypeAtLocation(candidate), type),
  );
};

// The closures that a value whose type has calls may hold, whose type TypeScript lets it hold.
export const getClosures = (callee: ts.Expression, context: Context) => {
  if (isHeldBuiltInObject(callee, context)) return [];
  const type = context.checker.getTypeAtLocation(callee);
  return findNodes(callee.getSourceFile(), (inner): inner is Closure =>
    isClosure(inner, context),
  ).filter((closure) =>
    context.checker.isTypeAssignableTo(context.checker.getTypeAtLocation(closure), type),
  );
};
