import ts from "@typescript/typescript6";
import { getWritten } from "./actions";
import { getReplacers, getStringifyGetters } from "./json";
import { isSelfReturning, MUTATING_METHODS } from "./collections";
import {
  type Context,
  findNodes,
  findReferences,
  getCallee,
  getSymbol,
  isDeclarationOnly,
  isHeldError,
  isMethodCall,
} from "./context";
import { TlaTypeScriptError } from "../errors";
import { isAllocation } from "./heap";
import { getPosition } from "./program-nodes";
import { forEachReachedName, isSkippedForReach } from "./reach-graph";
import { type Scope } from "./scope";
import {
  getKind,
  isArrayConstruction,
  isHeapArray,
  isHeapSetOrMap,
  isHeapType,
  isHeldCollectionType,
  isSetOrMapType,
  REORDER_METHODS,
} from "./types";

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

const COPYING_CONSTRUCTORS = new Set(["Set", "Map"]);

// The methods of arrays, sets, and maps that call a callback only while they run.
const RUNNING_CALLBACK_METHODS = new Set([
  "map",
  "flatMap",
  "forEach",
  "filter",
  "reduce",
  "reduceRight",
  "some",
  "every",
  "find",
  "findIndex",
  "findLast",
  "findLastIndex",
]);

// The call of a built-in method of an array, a set, or a map that calls a function written in
// place as its callback, only while the call runs.
const getRunningCall = (node: ts.Node, context: Context) => {
  const call = node.parent;
  return (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) &&
    call !== undefined &&
    isMethodCall(call) &&
    call.arguments[0] === node &&
    RUNNING_CALLBACK_METHODS.has(call.expression.name.text) &&
    (context.checker.isArrayType(
      context.checker.getNonNullableType(
        context.checker.getTypeAtLocation(call.expression.expression),
      ),
    ) ||
      isSetOrMapType(call.expression.expression, context))
    ? call
    : undefined;
};

// The function whose call runs a node, past the callbacks that run while a call in it runs.
const getRunningFunction = (node: ts.Node, context: Context): ts.Node => {
  const enclosing = ts.findAncestor(node.parent, ts.isFunctionLike);
  const call = enclosing === undefined ? undefined : getRunningCall(enclosing, context);
  return call !== undefined
    ? getRunningFunction(call, context)
    : (enclosing ?? node.getSourceFile());
};

// A place that may keep an object after a read: the variable, or undefined when tla-ts can't
// tell. The read object sits `source` levels below the top of the variable it came from, and
// lands `landing` levels below the top of the target.
interface Escape {
  target: ts.Symbol | undefined;
  source: number;
  landing: number;
  // The field of a heap object that the value lands in, where the target is the heap.
  field?: string;
}

interface Sharing {
  node: ts.Node;
  symbol: ts.Symbol | undefined;
}

interface Depths {
  source: number;
  landing: number;
}

interface Written {
  symbol: ts.Symbol;
  depth: number;
  // The field of a heap object that the path names, where it names one.
  field?: string;
}

const isUpdate = (node: ts.Node, context: Context) =>
  isMethodCall(node) &&
  MUTATING_METHODS.has(node.expression.name.text) &&
  getKind(node.expression.expression, context) !== "other";

// Whether a type is lib's Function, which every function is.
const isFunctionInterface = (type: ts.Type, context: Context) =>
  type.getSymbol()?.name === "Function" &&
  (type.getSymbol()?.declarations ?? []).some((declaration) =>
    context.defaultLibraries.has(declaration.getSourceFile()),
  );

// A script's heap objects are references, which share as JavaScript objects do, so only the other
// objects that a value holds can be copied by mistake. Where the heap holds every array, set, and
// map, {} tells no more than unknown does, as NonNullable gives it to a type parameter. A function
// is no such object, though lib's Function type declares no calls.
const holdsObject = (type: ts.Type, context: Context): boolean =>
  type.isUnion() || type.isIntersection()
    ? type.types.some((member) => holdsObject(member, context))
    : (type.flags & ts.TypeFlags.Object) !== 0 &&
      type.getCallSignatures().length === 0 &&
      type.getConstructSignatures().length === 0 &&
      !isFunctionInterface(type, context) &&
      !isHeapType(type, context) &&
      !isHeldCollectionType(type, context) &&
      !(context.isEveryCollectionHeld && type.getProperties().length === 0);

const holdsObjectAt = (type: ts.Type, depth: number, context: Context): boolean => {
  const checker = context.checker;
  if (depth === 0) return holdsObject(type, context);
  if (type.isUnion() || type.isIntersection()) {
    return type.types.some((member) => holdsObjectAt(member, depth, context));
  }
  if (isHeapType(type, context) || isHeldCollectionType(type, context)) return false;
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
      ? {
          symbol: context.heap,
          depth,
          field: ts.isPropertyAccessExpression(node) ? node.name.text : undefined,
        }
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
      : [
          {
            target: target.symbol,
            source: depths.source,
            landing: depths.landing + target.depth,
            field: target.field,
          },
        ];

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
      return land(
        {
          symbol: context.heap,
          depth: 0,
          field: ts.isIdentifier(parent.name) ? parent.name.text : undefined,
        },
        depths,
      );
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
  // A for-in reads only the keys of what it iterates.
  if (ts.isForInStatement(parent)) return [];
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
    if (isUpdate(call, context)) return isSelfReturning(call, context) ? getFrom(call, depths) : [];
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
  if (isArrayConstruction(parent, context) && parent.arguments?.includes(node)) {
    return getFrom(parent, getCopy(depths));
  }
  if (ts.isCallExpression(parent) && parent.arguments.includes(node)) {
    if (isMethodCall(parent)) {
      const method = parent.expression.name.text;
      if (isUpdate(parent, context)) {
        return land(getPath(parent.expression.expression, context), getContainer(depths));
      }
      if (COPYING_METHODS.has(method)) return getFrom(parent, getCopy(depths));
    }
    // A replacer or a getter may change what JSON.stringify's value holds while JSON.stringify
    // walks it.
    if (
      parent.arguments[0] === node &&
      (getReplacers(parent, context) !== undefined ||
        getStringifyGetters(parent, context).length > 0)
    ) {
      return land(undefined, depths);
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
  const table = context.nodes;
  const graph = context.reachGraph;
  const reached = [...roots];
  // The walk's mark on each node of the program's files that it has seen, and the few nodes that no
  // file walks to, such as JSDoc's.
  table.generation += 1;
  const generation = table.generation;
  const seenElsewhere = new Set<ts.Node>();
  roots.forEach((root) => {
    const position = getPosition(table, root);
    if (position < 0) seenElsewhere.add(root);
    else table.marks[position] = generation;
  });
  // A declaration of the program's files follows its run in the reach graph, whose declarations
  // it meets in the order that a walk of its subtree would.
  const reachPosition = (position: number): void => {
    if (table.marks[table.files[position]] === generation || table.marks[position] === generation) {
      return;
    }
    table.marks[position] = generation;
    reached.push(table.nodes[position]);
    for (let index = graph.starts[position]; index < graph.ends[position]; index += 1) {
      const target = graph.targets[index];
      if (target >= 0) reachPosition(target);
      else reachElsewhere(graph.elsewhere[-1 - target]);
    }
  };
  // A module's namespace object reaches only the exports that a script reads through it.
  const reachElsewhere = (declaration: ts.Node) => {
    const file = declaration.getSourceFile();
    const filePosition = getPosition(table, file);
    if (
      (filePosition < 0 ? seenElsewhere.has(file) : table.marks[filePosition] === generation) ||
      file.isDeclarationFile ||
      seenElsewhere.has(declaration)
    ) {
      return;
    }
    seenElsewhere.add(declaration);
    reached.push(declaration);
    visit(declaration);
  };
  const reach = (symbol: ts.Symbol | undefined) =>
    symbol?.declarations?.forEach((declaration) => {
      if (ts.isSourceFile(declaration)) return;
      const position = getPosition(table, declaration);
      if (position < 0) reachElsewhere(declaration);
      else reachPosition(position);
    });
  // A walk of a root scans its subtree in the table, past the subtrees it skips.
  const visit = (node: ts.Node): void => {
    const start = getPosition(table, node);
    if (start < 0) {
      if (isSkippedForReach(node)) return;
      if (ts.isIdentifier(node)) reach(getSymbol(node, context.checker));
      ts.forEachChild(node, visit);
      return;
    }
    forEachReachedName(table, context.references, start, (declaration, position) => {
      if (position < 0) reachElsewhere(declaration);
      else reachPosition(position);
    });
  };
  roots.forEach(visit);
  return reached;
};

// Whether code, or a function that it names, reads a let or a const of the script whose declaration
// hasn't run yet, which the state doesn't hold, as a getter of an object that the script makes
// later may.
export const readsUninitialized = (roots: readonly ts.Node[], scope: Scope, context: Context) =>
  scope.uninitialized.size > 0 &&
  getReached(roots, context).some((reached) =>
    findNodes(reached, ts.isIdentifier).some((name) => {
      const symbol = getSymbol(name, context.checker);
      return symbol !== undefined && scope.uninitialized.has(symbol);
    }),
  );

// Whether a node may make an object, as an object or a regexp literal or a built-in that makes
// one does, itself or through a function that it names.
export const isMakingObjects = (node: ts.Node, context: Context) => {
  const isMaking = (inner: ts.Node): boolean =>
    ts.isObjectLiteralExpression(inner) ||
    ts.isRegularExpressionLiteral(inner) ||
    isAllocation(inner, context) ||
    (ts.forEachChild(inner, isMaking) ?? false);
  return getReached([node], context).some(isMaking);
};

// Whether a call gives a new object each time: Array(...), or a callee that returns only object
// literals, which nothing else can name, though the objects inside them may still be shared.
const isFreshCall = (node: ts.Node, context: Context) => {
  if (isArrayConstruction(node, context)) return true;
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

// The first read that would share an object that changes in place, which a TLA+ value would copy,
// with the variable that it reads, where it reads one, in the code that getReached finds.
export const findSharing = (reached: readonly ts.Node[], context: Context) => {
  // Whether a reference to a function's own variable is the last that runs, so that nothing
  // changes the variable's array after the reference shares it.
  const isLastUse = (node: ts.Node, symbol: ts.Symbol) => {
    const declaration = symbol.valueDeclaration;
    if (
      declaration === undefined ||
      !ts.isVariableDeclaration(declaration) ||
      (ts.getCombinedModifierFlags(declaration) & ts.ModifierFlags.Export) !== 0
    ) {
      return false;
    }
    const owner = ts.findAncestor(declaration, ts.isFunctionLike) ?? declaration.getSourceFile();
    // A callback that runs while a call runs, which may run again for each element, runs its
    // references as the call does.
    const getOwnerFunction = (reference: ts.Node) => getRunningFunction(reference, context);
    // A return ends its function's call, unless a finally block runs after it, so only the rest
    // of the return and the functions that the call makes run after it with the same variable. A
    // call of the function itself, as in a recursive descent, binds a new one.
    const returned = ts.findAncestor(node, (inner) =>
      ts.isFunctionLike(inner) ? "quit" : ts.isReturnStatement(inner),
    );
    if (
      returned !== undefined &&
      getOwnerFunction(returned) === owner &&
      ts.findAncestor(returned, (inner) =>
        inner === owner ? "quit" : ts.isTryStatement(inner) && inner.finallyBlock !== undefined,
      ) === undefined
    ) {
      // The two branches of a conditional in the return never both run.
      const isOtherBranch = (reference: ts.Node) =>
        ts.findAncestor(node, (inner) => {
          if (inner === returned) return "quit";
          const parent = inner.parent;
          if (!ts.isConditionalExpression(parent) || inner === parent.condition) return false;
          const other = inner === parent.whenTrue ? parent.whenFalse : parent.whenTrue;
          return ts.findAncestor(reference, (outer) => outer === other) !== undefined;
        }) !== undefined;
      return findReferences(symbol, declaration.getSourceFile(), context).every(
        (reference) =>
          reference === declaration.name ||
          reference === node ||
          (getOwnerFunction(reference) === owner &&
            (reference.end <= node.getStart() ||
              isOtherBranch(reference) ||
              ts.findAncestor(reference, (inner) => inner === returned) === undefined)),
      );
    }
    const isRepeated =
      ts.findAncestor(node, (inner) =>
        inner === owner
          ? "quit"
          : (ts.isIterationStatement(inner, false) ||
              getRunningCall(inner, context) !== undefined) &&
            ts.findAncestor(declaration, (outer) => outer === inner) === undefined,
      ) !== undefined;
    // A variable that no file exports has its references only in the function that declares it.
    return (
      !isRepeated &&
      findReferences(symbol, declaration.getSourceFile(), context).every(
        (reference) =>
          reference === declaration.name ||
          reference === node ||
          (reference.end <= node.getStart() && getOwnerFunction(reference) === owner),
      )
    );
  };

  const changed = new Map<ts.Symbol, number>();
  const changeCounts = new Map<ts.Symbol, number>();
  // The heap objects' fields that change in place, by name, as one object may have many types.
  const changedFields = new Map<string, number>();
  const addChanged = (written: Written[]) =>
    written.forEach((entry) => {
      changeCounts.set(entry.symbol, (changeCounts.get(entry.symbol) ?? 0) + 1);
      if (entry.field === undefined) {
        changed.set(entry.symbol, Math.max(changed.get(entry.symbol) ?? -1, entry.depth));
        return;
      }
      changedFields.set(entry.field, Math.max(changedFields.get(entry.field) ?? -1, entry.depth));
    });
  // How deep a symbol's object changes, where a read of a heap object's field sees only that
  // field's changes, and any other read of the heap sees every field's.
  const getChangedDepth = (symbol: ts.Symbol, field: string | undefined) => {
    const depths = [
      changed.get(symbol),
      ...(symbol !== context.heap
        ? []
        : field === undefined
          ? changedFields.values()
          : [changedFields.get(field)]),
    ].filter((depth) => depth !== undefined);
    return depths.length === 0 ? undefined : Math.max(...depths);
  };
  const collect = (node: ts.Node) => {
    const written = getWritten(node);
    // An array that the heap holds keeps its identity as it changes in place.
    const isHeapChange =
      written !== undefined &&
      (isHeapArray(written, context) ||
        isHeapSetOrMap(written, context) ||
        ((ts.isPropertyAccessExpression(written) || ts.isElementAccessExpression(written)) &&
          isHeapArray(written.expression, context)));
    if (isHeapChange) {
      ts.forEachChild(node, collect);
      return;
    }
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
  if (changed.size === 0 && changedFields.size === 0) return undefined;
  const visit = (node: ts.Node): Sharing | undefined => {
    if (ts.isTypeNode(node)) return undefined;
    // A shorthand property's name also reads the variable that it names.
    const isName =
      ts.getNameOfDeclaration(node.parent as ts.Declaration) === node &&
      !ts.isShorthandPropertyAssignment(node.parent);
    const isHeapRead =
      (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) &&
      getKind(node.expression, context) === "object";
    // An array that the heap holds goes by reference, as JavaScript shares it.
    const symbol =
      ts.isExpression(node) &&
      !isName &&
      (isHeapArray(node, context) || isHeapSetOrMap(node, context))
        ? undefined
        : ts.isIdentifier(node) && !isName
          ? getSymbol(node, context.checker)
          : isHeapRead
            ? context.heap
            : undefined;
    if (
      symbol !== undefined ||
      (ts.isCallExpression(node) && !isMethodCall(node) && !isHeldError(node, context))
    ) {
      const escapes = getEscapes(
        node as ts.Expression,
        { source: 0, landing: 0 },
        context,
        new Set(),
      );
      // A sort, reverse, fill, or copyWithin that runs once, as the only change to its receiver,
      // shares the array only as it is once changed.
      const isOnlyReorder =
        symbol !== undefined &&
        changeCounts.get(symbol) === 1 &&
        ts.isPropertyAccessExpression(node.parent) &&
        isMethodCall(node.parent.parent) &&
        REORDER_METHODS.has(node.parent.name.text) &&
        ts.findAncestor(
          node,
          (inner) => ts.isFunctionLike(inner) || ts.isIterationStatement(inner, false),
        ) === undefined;
      const changedDepth =
        symbol === undefined
          ? undefined
          : getChangedDepth(
              symbol,
              isHeapRead && ts.isPropertyAccessExpression(node) ? node.name.text : undefined,
            );
      const sourceDepth =
        symbol === undefined ||
        changedDepth === undefined ||
        isOnlyReorder ||
        isLastUse(node, symbol)
          ? undefined
          : changedDepth;
      // A target may change the top of a new object, which only it names.
      const freshDepth = isFreshCall(node, context) ? 1 : 0;
      const isShared = escapes.some((escape) => {
        // A heap object's field that takes another's shares what changes in either.
        const targetDepth =
          escape.target === undefined ||
          (escape.target === symbol && escape.target !== context.heap)
            ? undefined
            : getChangedDepth(escape.target, escape.field);
        return (
          (sourceDepth !== undefined && sourceDepth >= escape.source) ||
          (targetDepth !== undefined && targetDepth >= escape.landing + freshDepth)
        );
      });
      if (isShared) return { node, symbol };
    }
    return ts.forEachChild(node, visit);
  };
  return reached.reduce<Sharing | undefined>((found, node) => found ?? visit(node), undefined);
};

// Rejects what still shares an object that changes in place where the heap would hold it.
export const rejectSharing = (reached: readonly ts.Node[], context: Context) => {
  const sharing = findSharing(reached, context);
  if (sharing === undefined) return;
  const text = sharing.node.getText();
  // A copy of what only a declaration gives would still have no code to run.
  if (
    ts.isIdentifier(sharing.node) &&
    sharing.symbol !== undefined &&
    isDeclarationOnly(sharing.symbol, context)
  ) {
    throw new TlaTypeScriptError(
      `tla-ts can't run ${text}, which only a declaration gives`,
      sharing.node,
    );
  }
  throw new TlaTypeScriptError(
    `tla-ts can't hold ${text} on the heap, which would share an object that changes in place`,
    sharing.node,
  );
};
