import ts from "@typescript/typescript6";
import { getWritten } from "./actions";
import { MUTATING_METHODS } from "./collections";
import { type Context, getCallee, getSymbol, isMethodCall } from "./context";
import { TlaTypeScriptError } from "../errors";
import { getKind, isHeapType } from "./types";

const COPYING_METHODS = new Set([
  "slice",
  "filter",
  "concat",
  "toSorted",
  "toReversed",
  "toSpliced",
  "with",
  "flat",
  "keys",
  "values",
  "entries",
  "union",
  "intersection",
  "difference",
  "symmetricDifference",
]);

const CALLBACK_METHODS = new Set([
  "map",
  "flatMap",
  "forEach",
  "reduce",
  "reduceRight",
  "some",
  "every",
  "findIndex",
  "findLastIndex",
  "indexOf",
  "lastIndexOf",
  "includes",
  "has",
  "join",
]);

const COPYING_CONSTRUCTORS = new Set(["Set", "Map", "Array"]);

// A place that may keep an object after a read: the variable, or undefined when tla-ts can't
// tell. The read object sits `source` levels below the top of the variable it came from, and
// lands `landing` levels below the top of the target.
interface Escape {
  target: ts.Symbol | undefined;
  source: number;
  landing: number;
}

interface Depths {
  source: number;
  landing: number;
}

interface Written {
  symbol: ts.Symbol;
  depth: number;
}

const isUpdate = (node: ts.Node, context: Context) =>
  isMethodCall(node) &&
  MUTATING_METHODS.has(node.expression.name.text) &&
  getKind(node.expression.expression, context) !== "other";

// A script's heap objects are references, which share as JavaScript objects do, so only the other
// objects that a value holds can be copied by mistake.
const holdsObject = (type: ts.Type, context: Context): boolean =>
  type.isUnion() || type.isIntersection()
    ? type.types.some((member) => holdsObject(member, context))
    : (type.flags & ts.TypeFlags.Object) !== 0 &&
      type.getCallSignatures().length === 0 &&
      type.getConstructSignatures().length === 0 &&
      !isHeapType(type, undefined, context);

const holdsObjectAt = (type: ts.Type, depth: number, context: Context): boolean => {
  const checker = context.checker;
  if (depth === 0) return holdsObject(type, context);
  if (type.isUnion() || type.isIntersection()) {
    return type.types.some((member) => holdsObjectAt(member, depth, context));
  }
  if (isHeapType(type, undefined, context)) return false;
  const typeArguments =
    (type.flags & ts.TypeFlags.Object) !== 0 &&
    ((type as ts.ObjectType).objectFlags & ts.ObjectFlags.Reference) !== 0
      ? checker.getTypeArguments(type as ts.TypeReference)
      : [];
  return [
    ...typeArguments,
    ...type.getProperties().map((property) => checker.getTypeOfSymbol(property)),
  ].some((member) => holdsObjectAt(member, depth - 1, context));
};

const strip = (node: ts.Expression): ts.Expression =>
  ts.isParenthesizedExpression(node) || ts.isNonNullExpression(node) || ts.isAsExpression(node)
    ? strip(node.expression)
    : node;

// The variable a target is part of, and how many steps below its top the target is. A property of
// a heap object is part of the heap, which counts as one variable.
const getPath = (target: ts.Expression, context: Context, depth = 0): Written | undefined => {
  const node = strip(target);
  if (ts.isIdentifier(node)) {
    const symbol = getSymbol(node, context.checker);
    return symbol === undefined ? undefined : { symbol, depth };
  }
  if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
    return context.heap !== undefined && getKind(node.expression, context) === "object"
      ? { symbol: context.heap, depth }
      : getPath(node.expression, context, depth + 1);
  }
  return isMethodCall(node) && node.expression.name.text === "get"
    ? getPath(node.expression.expression, context, depth + 1)
    : undefined;
};

const getChangedInPlace = (target: ts.Expression, context: Context): Written[] => {
  const node = strip(target);
  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.flatMap((element) =>
      getChangedInPlace(ts.isSpreadElement(element) ? element.expression : element, context),
    );
  }
  if (ts.isObjectLiteralExpression(node)) {
    return node.properties.flatMap((property) =>
      ts.isPropertyAssignment(property) ? getChangedInPlace(property.initializer, context) : [],
    );
  }
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
    return getChangedInPlace(node.left, context);
  }
  const path = getPath(node, context);
  return path === undefined || path.depth === 0 ? [] : [{ ...path, depth: path.depth - 1 }];
};

const getBoundSymbols = (name: ts.BindingName, context: Context): ts.Symbol[] =>
  ts.isIdentifier(name)
    ? [getSymbol(name, context.checker) ?? []].flat()
    : name.elements.flatMap((element) =>
        ts.isBindingElement(element) ? getBoundSymbols(element.name, context) : [],
      );

const getReferences = (symbol: ts.Symbol, body: ts.Node, context: Context) => {
  const found: ts.Identifier[] = [];
  const visit = (node: ts.Node) => {
    const isName =
      (ts.isParameter(node.parent) ||
        ts.isVariableDeclaration(node.parent) ||
        ts.isBindingElement(node.parent)) &&
      node.parent.name === node;
    if (ts.isIdentifier(node) && !isName && getSymbol(node, context.checker) === symbol) {
      found.push(node);
    }
    ts.forEachChild(node, visit);
  };
  visit(body);
  return found;
};

const getPart = (depths: Depths): Depths =>
  depths.landing === 0
    ? { source: depths.source + 1, landing: 0 }
    : { source: depths.source, landing: depths.landing - 1 };

const getCopy = (depths: Depths): Depths =>
  depths.landing === 0 ? { source: depths.source + 1, landing: 1 } : depths;

const getContainer = (depths: Depths): Depths => ({ ...depths, landing: depths.landing + 1 });

const land = (target: ts.Symbol[] | Written | undefined, depths: Depths): Escape[] =>
  target === undefined
    ? [{ target: undefined, ...depths }]
    : Array.isArray(target)
      ? target.map((symbol) => ({ target: symbol, ...depths }))
      : [{ target: target.symbol, source: depths.source, landing: depths.landing + target.depth }];

// The places that may keep the object a node evaluates to.
// Whether a return gives the caller the only name for a local's object: the local belongs to the
// returning function, no function inside it keeps the local, and no finally block runs after.
const getOwner = (node: ts.Node) => ts.findAncestor(node.parent, ts.isFunctionLike);

// Whether a function runs only during a call of the owner: it is the owner, or a function the owner
// declares and only calls by name from functions that themselves run only then.
const isRunByOwner = (
  node: ts.Node | undefined,
  owner: ts.Node,
  context: Context,
  visited: Set<ts.Node>,
): boolean => {
  if (node === owner || (node !== undefined && visited.has(node))) return true;
  if (
    node === undefined ||
    !(ts.isArrowFunction(node) || ts.isFunctionExpression(node) || ts.isFunctionDeclaration(node))
  ) {
    return false;
  }
  visited.add(node);
  const declaration = ts.isFunctionDeclaration(node) ? node : node.parent;
  const isConstant =
    ts.isFunctionDeclaration(declaration) ||
    (ts.isVariableDeclaration(declaration) &&
      declaration.initializer === node &&
      (declaration.parent.flags & ts.NodeFlags.Const) !== 0);
  const isDeferred =
    node.asteriskToken !== undefined ||
    (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Async) !== 0;
  const name =
    ts.isFunctionDeclaration(declaration) || ts.isVariableDeclaration(declaration)
      ? declaration.name
      : undefined;
  const symbol =
    name !== undefined && ts.isIdentifier(name) ? getSymbol(name, context.checker) : undefined;
  return (
    isConstant &&
    !isDeferred &&
    symbol !== undefined &&
    isRunByOwner(getOwner(node), owner, context, visited) &&
    getReferences(symbol, owner, context).every(
      (reference) =>
        ts.isCallExpression(reference.parent) &&
        reference.parent.expression === reference &&
        isRunByOwner(getOwner(reference), owner, context, visited),
    )
  );
};

const isOnlyName = (node: ts.Identifier, statement: ts.ReturnStatement, context: Context) => {
  const symbol = getSymbol(node, context.checker);
  const declaration = symbol?.valueDeclaration;
  const owner = getOwner(statement);
  if (
    symbol === undefined ||
    declaration === undefined ||
    owner === undefined ||
    !ts.isVariableDeclaration(declaration) ||
    getOwner(declaration) !== owner
  ) {
    return false;
  }
  const isFinallyAfter = (child: ts.Node): boolean =>
    child.parent !== owner &&
    ((ts.isTryStatement(child.parent) &&
      child.parent.finallyBlock !== undefined &&
      child.parent.finallyBlock !== child) ||
      isFinallyAfter(child.parent));
  return (
    !isFinallyAfter(statement) &&
    getReferences(symbol, owner, context).every((reference) =>
      isRunByOwner(getOwner(reference), owner, context, new Set()),
    )
  );
};

const getEscapes = (
  node: ts.Expression,
  depths: Depths,
  context: Context,
  visited: Set<ts.Node>,
): Escape[] => {
  const type = context.checker.getTypeAtLocation(node);
  if (!holdsObjectAt(type, depths.landing, context)) return [];
  const parent = node.parent;
  const getFrom = (from: ts.Node, fromDepths: Depths) =>
    getEscapes(from as ts.Expression, fromDepths, context, visited);
  const getFromReferences = (symbols: ts.Symbol[], body: ts.Node, fromDepths: Depths) =>
    symbols
      .flatMap((symbol) => getReferences(symbol, body, context))
      .flatMap((reference) => getFrom(reference, fromDepths));
  const getFromParameter = (parameter: ts.ParameterDeclaration | undefined, body: ts.Node) => {
    if (parameter === undefined || visited.has(parameter)) return [];
    visited.add(parameter);
    return getFromReferences(getBoundSymbols(parameter.name, context), body, depths);
  };
  if (
    ts.isParenthesizedExpression(parent) ||
    ts.isNonNullExpression(parent) ||
    ts.isAsExpression(parent) ||
    ts.isSatisfiesExpression(parent) ||
    (ts.isConditionalExpression(parent) && parent.condition !== node)
  ) {
    return getFrom(parent, depths);
  }
  if (ts.isArrayLiteralExpression(parent)) return getFrom(parent, getContainer(depths));
  if (ts.isPropertyAssignment(parent) || ts.isShorthandPropertyAssignment(parent)) {
    if (parent.name === node && ts.isPropertyAssignment(parent)) return [];
    const literal = parent.parent;
    // A heap object's fields are part of the heap, as where an assignment sets one.
    if (context.heap !== undefined && getKind(literal, context) === "object") {
      return land([context.heap], depths);
    }
    // A local that a returned object literal holds, as one that a return gives, ends with the
    // caller holding its only name.
    const returned = ts.findAncestor(
      literal.parent,
      (ancestor) => !ts.isParenthesizedExpression(ancestor) && !ts.isAsExpression(ancestor),
    );
    if (
      ts.isIdentifier(node) &&
      returned !== undefined &&
      ts.isReturnStatement(returned) &&
      returned.expression !== undefined &&
      strip(returned.expression) === literal &&
      isOnlyName(node, returned, context)
    ) {
      return [];
    }
    return getFrom(literal, getContainer(depths));
  }
  if (ts.isSpreadElement(parent) || ts.isSpreadAssignment(parent)) {
    return getFrom(parent.parent, getCopy(depths));
  }
  if (ts.isBinaryExpression(parent)) {
    const kind = parent.operatorToken.kind;
    if (kind === ts.SyntaxKind.EqualsToken) {
      return parent.left === node ? [] : land(getPath(parent.left, context), depths);
    }
    const isValue =
      kind === ts.SyntaxKind.QuestionQuestionToken ||
      kind === ts.SyntaxKind.BarBarToken ||
      kind === ts.SyntaxKind.AmpersandAmpersandToken ||
      (kind === ts.SyntaxKind.CommaToken && parent.right === node);
    return isValue ? getFrom(parent, depths) : [];
  }
  if (ts.isVariableDeclaration(parent)) {
    if (parent.initializer !== node) return [];
    return land(
      getBoundSymbols(parent.name, context),
      ts.isIdentifier(parent.name) ? depths : getPart(depths),
    );
  }
  if (ts.isForOfStatement(parent)) {
    if (parent.expression !== node) return [];
    const initializer = parent.initializer;
    const element = getPart(depths);
    if (!ts.isVariableDeclarationList(initializer)) {
      return land(getPath(initializer, context), element);
    }
    const symbols = initializer.declarations.flatMap((declaration) =>
      getBoundSymbols(declaration.name, context),
    );
    return [
      ...((initializer.flags & ts.NodeFlags.Const) === 0 ? land(symbols, element) : []),
      ...getFromReferences(symbols, parent.statement, element),
    ];
  }
  if (
    (ts.isPropertyAccessExpression(parent) || ts.isElementAccessExpression(parent)) &&
    parent.expression === node
  ) {
    const call = parent.parent;
    if (
      !(ts.isPropertyAccessExpression(parent) && isMethodCall(call) && call.expression === parent)
    ) {
      return getWritten(parent.parent) === parent ? [] : getFrom(parent, getPart(depths));
    }
    const method = parent.name.text;
    if (isUpdate(call, context)) return [];
    const fromCallbacks = call.arguments.flatMap((argument) => {
      const callback = getCallee(argument, context);
      const parameter = callback?.parameters[0];
      if (callback === undefined || parameter === undefined || visited.has(parameter)) return [];
      visited.add(parameter);
      return getFromReferences(getBoundSymbols(parameter.name, context), callback, getPart(depths));
    });
    if (CALLBACK_METHODS.has(method)) return fromCallbacks;
    return [
      ...fromCallbacks,
      ...getFrom(call, COPYING_METHODS.has(method) ? getCopy(depths) : getPart(depths)),
    ];
  }
  if (ts.isCallExpression(parent) && parent.arguments.includes(node)) {
    if (isMethodCall(parent)) {
      const method = parent.expression.name.text;
      if (isUpdate(parent, context)) {
        return land(getPath(parent.expression.expression, context), getContainer(depths));
      }
      if (COPYING_METHODS.has(method)) return getFrom(parent, getCopy(depths));
    }
    const callee = getCallee(parent.expression, context);
    return callee === undefined
      ? getFrom(parent, depths)
      : getFromParameter(callee.parameters[parent.arguments.indexOf(node)], callee);
  }
  if (ts.isNewExpression(parent) && parent.arguments?.includes(node)) {
    return ts.isIdentifier(parent.expression) && COPYING_CONSTRUCTORS.has(parent.expression.text)
      ? getFrom(parent, getCopy(depths))
      : land(undefined, depths);
  }
  if (ts.isReturnStatement(parent) && ts.isIdentifier(node) && isOnlyName(node, parent, context)) {
    return [];
  }
  const isRead =
    ts.isExpressionStatement(parent) ||
    ts.isIfStatement(parent) ||
    ts.isWhileStatement(parent) ||
    ts.isDoStatement(parent) ||
    ts.isForStatement(parent) ||
    ts.isPrefixUnaryExpression(parent) ||
    ts.isTypeOfExpression(parent) ||
    ts.isTemplateSpan(parent) ||
    ts.isSwitchStatement(parent) ||
    ts.isCaseClause(parent);
  return isRead ? [] : land(undefined, depths);
};

// TLA+ values have no identity, so tla-ts copies an object wherever JavaScript would share it.
// The copy only differs from the original once one of them changes in place, so reject sharing
// an object that a variable changes in place.
// The model's file, with the declarations in other files that it names and that they name in turn,
// which hold every function of another file that the model may run.
export const getReached = (roots: readonly ts.Node[], context: Context) => {
  const reached = [...roots];
  const seen = new Set<ts.Node>(reached);
  const visit = (node: ts.Node): void => {
    const declarations = ts.isIdentifier(node)
      ? (getSymbol(node, context.checker)?.declarations ?? [])
      : [];
    for (const declaration of declarations) {
      const file = declaration.getSourceFile();
      if (seen.has(file) || file.isDeclarationFile || seen.has(declaration)) continue;
      seen.add(declaration);
      reached.push(declaration);
      visit(declaration);
    }
    ts.forEachChild(node, visit);
  };
  roots.forEach(visit);
  return reached;
};

// Whether a call gives a new object each time: its callee returns only object literals, which
// nothing else can name, though the objects inside them may still be shared.
const isFreshCall = (node: ts.Node, context: Context) => {
  const callee = ts.isCallExpression(node) ? getCallee(node.expression, context) : undefined;
  if (callee?.body === undefined || callee.asteriskToken !== undefined) return false;
  const body = callee.body;
  if (!ts.isBlock(body)) return ts.isObjectLiteralExpression(strip(body));
  const returns: ts.ReturnStatement[] = [];
  const visit = (node: ts.Node): void => {
    if (ts.isReturnStatement(node)) returns.push(node);
    if (!ts.isFunctionLike(node)) ts.forEachChild(node, visit);
  };
  ts.forEachChild(body, visit);
  return (
    returns.length > 0 &&
    returns.every(
      (statement) =>
        statement.expression !== undefined &&
        ts.isObjectLiteralExpression(strip(statement.expression)),
    )
  );
};

export const rejectSharing = (roots: readonly ts.Node[], context: Context) => {
  const reached = getReached(roots, context);
  const changed = new Map<ts.Symbol, number>();
  const addChanged = (written: Written[]) =>
    written.forEach((entry) =>
      changed.set(entry.symbol, Math.max(changed.get(entry.symbol) ?? -1, entry.depth)),
    );
  const collect = (node: ts.Node) => {
    const written = getWritten(node);
    if (isUpdate(node, context)) {
      const path = written && getPath(written, context);
      if (path !== undefined) addChanged([path]);
    } else if (written !== undefined && !isMethodCall(node)) {
      addChanged(getChangedInPlace(written, context));
    }
    if (ts.isForOfStatement(node) && !ts.isVariableDeclarationList(node.initializer)) {
      addChanged(getChangedInPlace(node.initializer, context));
    }
    ts.forEachChild(node, collect);
  };
  reached.forEach(collect);
  if (changed.size === 0) return;
  const visit = (node: ts.Node) => {
    if (ts.isTypeNode(node)) return;
    const isName = ts.getNameOfDeclaration(node.parent as ts.Declaration) === node;
    const isHeapRead =
      (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) &&
      getKind(node.expression, context) === "object";
    const symbol =
      ts.isIdentifier(node) && !isName
        ? getSymbol(node, context.checker)
        : isHeapRead
          ? context.heap
          : undefined;
    if (symbol !== undefined || (ts.isCallExpression(node) && !isMethodCall(node))) {
      const escapes = getEscapes(
        node as ts.Expression,
        { source: 0, landing: 0 },
        context,
        new Set(),
      );
      const sourceDepth = symbol === undefined ? undefined : changed.get(symbol);
      // A target may change the top of a new object, which only it names.
      const freshDepth = isFreshCall(node, context) ? 1 : 0;
      const isShared = escapes.some((escape) => {
        const targetDepth =
          escape.target === undefined || escape.target === symbol
            ? undefined
            : changed.get(escape.target);
        return (
          (sourceDepth !== undefined && sourceDepth >= escape.source) ||
          (targetDepth !== undefined && targetDepth >= escape.landing + freshDepth)
        );
      });
      if (isShared) {
        throw new TlaTypeScriptError(
          `${node.getText()} would share an object that changes in place, so copy it`,
          node,
        );
      }
    }
    ts.forEachChild(node, visit);
  };
  reached.forEach(visit);
};
