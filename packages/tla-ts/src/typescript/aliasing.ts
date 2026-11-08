import ts from "@typescript/typescript6";
import { getWritten } from "./actions";
import { MUTATING_METHODS } from "./collections";
import { type Context, getCallee, getSymbol, isMethodCall } from "./context";
import { TlaTypeScriptError } from "../errors";
import { getKind } from "./types";

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

const holdsObject = (type: ts.Type): boolean =>
  type.isUnion() || type.isIntersection()
    ? type.types.some(holdsObject)
    : (type.flags & ts.TypeFlags.Object) !== 0 &&
      type.getCallSignatures().length === 0 &&
      type.getConstructSignatures().length === 0;

const holdsObjectAt = (type: ts.Type, depth: number, checker: ts.TypeChecker): boolean => {
  if (depth === 0) return holdsObject(type);
  if (type.isUnion() || type.isIntersection()) {
    return type.types.some((member) => holdsObjectAt(member, depth, checker));
  }
  const typeArguments =
    (type.flags & ts.TypeFlags.Object) !== 0 &&
    ((type as ts.ObjectType).objectFlags & ts.ObjectFlags.Reference) !== 0
      ? checker.getTypeArguments(type as ts.TypeReference)
      : [];
  return [
    ...typeArguments,
    ...type.getProperties().map((property) => checker.getTypeOfSymbol(property)),
  ].some((member) => holdsObjectAt(member, depth - 1, checker));
};

const strip = (node: ts.Expression): ts.Expression =>
  ts.isParenthesizedExpression(node) || ts.isNonNullExpression(node) || ts.isAsExpression(node)
    ? strip(node.expression)
    : node;

// The variable a target is part of, and how many steps below its top the target is.
const getPath = (target: ts.Expression, context: Context, depth = 0): Written | undefined => {
  const node = strip(target);
  if (ts.isIdentifier(node)) {
    const symbol = getSymbol(node, context.checker);
    return symbol === undefined ? undefined : { symbol, depth };
  }
  if (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) {
    return getPath(node.expression, context, depth + 1);
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
const getEscapes = (
  node: ts.Expression,
  depths: Depths,
  context: Context,
  visited: Set<ts.Node>,
): Escape[] => {
  const type = context.checker.getTypeAtLocation(node);
  if (!holdsObjectAt(type, depths.landing, context.checker)) return [];
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
    return parent.name === node && ts.isPropertyAssignment(parent)
      ? []
      : getFrom(parent.parent, getContainer(depths));
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
export const rejectSharing = (sourceFile: ts.SourceFile, context: Context) => {
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
  collect(sourceFile);
  if (changed.size === 0) return;
  const visit = (node: ts.Node) => {
    if (ts.isTypeNode(node)) return;
    const isName = ts.getNameOfDeclaration(node.parent as ts.Declaration) === node;
    const symbol = ts.isIdentifier(node) && !isName ? getSymbol(node, context.checker) : undefined;
    if (symbol !== undefined || (ts.isCallExpression(node) && !isMethodCall(node))) {
      const escapes = getEscapes(
        node as ts.Expression,
        { source: 0, landing: 0 },
        context,
        new Set(),
      );
      const sourceDepth = symbol === undefined ? undefined : changed.get(symbol);
      const isShared = escapes.some((escape) => {
        const targetDepth =
          escape.target === undefined || escape.target === symbol
            ? undefined
            : changed.get(escape.target);
        return (
          (sourceDepth !== undefined && sourceDepth >= escape.source) ||
          (targetDepth !== undefined && targetDepth >= escape.landing)
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
  visit(sourceFile);
};
