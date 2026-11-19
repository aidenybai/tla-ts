import ts from "@typescript/typescript6";

// A function's bindings that only its own code reads or writes, which a compiled spec holds as the
// slots of the function's frame rather than in environment records. A binding is such a local
// when the function declares it, no function or class inside the function names it, and nothing
// else can reach the environment that would hold it: no with statement, no arguments object, which
// aliases the parameters, no delete of a name, and no pattern, whose binding ESCore's operators do
// through the environment. An environment record is unobservable but through those, so holding
// the binding elsewhere changes nothing a program sees.

export interface Locals {
  // The slot, from 1, of each name that declares a local and of each identifier that reads or
  // writes one.
  slots: ReadonlyMap<ts.Node, number>;
  // Whether each slot's binding is a const's, which an assignment throws at.
  constant: readonly boolean[];
  // The slots of the parameters, the vars, and the lexical declarations of the function's body,
  // by name.
  top: ReadonlyMap<string, number>;
}

const isNested = (node: ts.Node) => ts.isFunctionLike(node) || ts.isClassLike(node);

// Whether a node is only a type, which reads no binding. A class's extends clause is an expression
// with type arguments, whose expression a class evaluates.
const isType = (node: ts.Node) => ts.isTypeNode(node) && !ts.isExpressionWithTypeArguments(node);

// Whether an identifier reads or writes a binding, rather than naming a property, a label, or a
// declaration.
const isReference = (node: ts.Identifier) => {
  const parent = node.parent;
  return !(
    (ts.isPropertyAccessExpression(parent) && parent.name === node) ||
    (ts.isPropertyAssignment(parent) && parent.name === node) ||
    ((ts.isLabeledStatement(parent) || ts.isBreakOrContinueStatement(parent)) &&
      parent.label === node) ||
    ts.isMetaProperty(parent) ||
    ((ts.isVariableDeclaration(parent) ||
      ts.isParameter(parent) ||
      ts.isFunctionDeclaration(parent) ||
      ts.isClassDeclaration(parent) ||
      ts.isBindingElement(parent)) &&
      parent.name === node)
  );
};

// The names that the functions and classes inside a node read or write.
const getCaptured = (node: ts.Node, names = new Set<string>(), isInside = false): Set<string> => {
  if (ts.isIdentifier(node)) {
    if (isInside && isReference(node)) names.add(node.text);
  } else if (!isType(node)) {
    ts.forEachChild(node, (child) => {
      getCaptured(child, names, isInside || isNested(node));
    });
  }
  return names;
};

// Whether a function's own code, outside the functions and classes in it, reaches environments
// other than by reading and writing names.
const isReaching = (node: ts.Node, isArrow: boolean): boolean => {
  if (isNested(node) || isType(node)) return false;
  if (
    ts.isWithStatement(node) ||
    ts.isObjectBindingPattern(node) ||
    ts.isArrayBindingPattern(node) ||
    (ts.isDeleteExpression(node) && ts.isIdentifier(node.expression)) ||
    (!isArrow && ts.isIdentifier(node) && node.text === "arguments" && isReference(node)) ||
    (ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      (ts.isObjectLiteralExpression(node.left) || ts.isArrayLiteralExpression(node.left))) ||
    ((ts.isForInStatement(node) || ts.isForOfStatement(node)) &&
      (ts.isObjectLiteralExpression(node.initializer) ||
        ts.isArrayLiteralExpression(node.initializer))) ||
    ts.isEnumDeclaration(node) ||
    ts.isModuleDeclaration(node)
  ) {
    return true;
  }
  return ts.forEachChild(node, (child) => (isReaching(child, isArrow) ? true : undefined)) ?? false;
};

interface Declared {
  names: string[];
  isConst: boolean;
}

// The locals of a function whose parameters are distinct names, whose body's vars, functions, and
// lexical declarations its own code declares (the top scope), or undefined where its code may
// reach an environment.
export const getLocals = (
  node: ts.Node,
  parameters: readonly ts.ParameterDeclaration[],
  body: ts.ConciseBody,
  top: Declared[],
  getBlockDeclarations: (statements: readonly ts.Statement[]) => Declared[],
): Locals | undefined => {
  const isArrow = ts.isArrowFunction(node);
  if (parameters.some((parameter) => isReaching(parameter, isArrow)) || isReaching(body, isArrow)) {
    return undefined;
  }
  const captured = getCaptured(body);
  parameters.forEach((parameter) => getCaptured(parameter, captured, true));
  const slots = new Map<ts.Node, number>();
  const constant: boolean[] = [];
  // Each scope's names, with the slot of each local, or 0 for a binding that an environment holds.
  const scopes: Map<string, number>[] = [];
  const declare = (declared: Declared[]) =>
    new Map(
      declared.flatMap((declaration) =>
        declaration.names.map((name) => {
          if (captured.has(name)) return [name, 0] as const;
          constant.push(declaration.isConst);
          return [name, constant.length] as const;
        }),
      ),
    );
  const resolve = (name: string) => scopes.findLast((scope) => scope.has(name))?.get(name) ?? 0;
  const inScope = (declared: Declared[], visit: () => void) => {
    scopes.push(declare(declared));
    visit();
    scopes.pop();
  };
  const visit = (child: ts.Node): void => {
    if (isType(child)) return;
    if (ts.isIdentifier(child)) {
      const slot = resolve(child.text);
      const parent = child.parent;
      const isDeclaration =
        (ts.isVariableDeclaration(parent) ||
          ts.isParameter(parent) ||
          ts.isFunctionDeclaration(parent) ||
          ts.isClassDeclaration(parent)) &&
        parent.name === child;
      if (slot !== 0 && (isDeclaration || isReference(child))) slots.set(child, slot);
      return;
    }
    if (isNested(child)) {
      // A declaration's name is its scope's; what it holds is the function's or class's own.
      if ((ts.isFunctionDeclaration(child) || ts.isClassDeclaration(child)) && child.name) {
        visit(child.name);
      }
      return;
    }
    if (ts.isBlock(child) || ts.isModuleBlock(child)) {
      inScope(getBlockDeclarations(child.statements), () => ts.forEachChild(child, visit));
      return;
    }
    if (ts.isCaseBlock(child)) {
      inScope(getBlockDeclarations(child.clauses.flatMap((clause) => [...clause.statements])), () =>
        ts.forEachChild(child, visit),
      );
      return;
    }
    if (
      (ts.isForStatement(child) || ts.isForInStatement(child) || ts.isForOfStatement(child)) &&
      child.initializer !== undefined &&
      ts.isVariableDeclarationList(child.initializer) &&
      (child.initializer.flags & ts.NodeFlags.BlockScoped) !== 0
    ) {
      const names = child.initializer.declarations.flatMap((declaration) =>
        ts.isIdentifier(declaration.name) ? [declaration.name.text] : [],
      );
      const isConst = (child.initializer.flags & ts.NodeFlags.BlockScoped) === ts.NodeFlags.Const;
      inScope([{ names, isConst }], () => ts.forEachChild(child, visit));
      return;
    }
    if (ts.isCatchClause(child) && child.variableDeclaration !== undefined) {
      const name = child.variableDeclaration.name;
      inScope([{ names: ts.isIdentifier(name) ? [name.text] : [], isConst: false }], () =>
        ts.forEachChild(child, visit),
      );
      return;
    }
    ts.forEachChild(child, visit);
  };
  scopes.push(declare(top));
  parameters.forEach(visit);
  if (ts.isBlock(body)) body.statements.forEach(visit);
  else visit(body);
  return { slots, constant, top: scopes[0] };
};
