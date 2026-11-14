import ts from "@typescript/typescript6";
import type { Expression, SourceLocation } from "../ast";
import {
  bindCall,
  bindOnce,
  findChanged,
  type Frame,
  type Path,
  type Thrown,
  throwOnDestructured,
  translateStatements,
} from "./actions";
import {
  type Context,
  findNodes,
  type FunctionNode,
  getAnyFunction,
  getParameters,
  getSymbol,
  getUndefined,
  isClosure,
  isPlain,
  type SharedCall,
} from "./context";
import { forceHeap } from "./functions";
import { type Formula, ifThenElse, leaf, letIn, render } from "./formula";
import { link } from "./regions";
import { type Bound, createStateScope, type Receiver } from "./scope";
import {
  apply,
  boolean,
  call,
  defineAt,
  identifier,
  ifExpression,
  index,
  locate,
  number,
  string,
  tuple,
  UNLOCATED,
} from "./tla";

// The built-ins that queue jobs or hold values weakly, which a helper's operator doesn't follow.
const TASK_NAMES = new Set([
  "Promise",
  "queueMicrotask",
  "setTimeout",
  "setInterval",
  "setImmediate",
  "WeakRef",
  "FinalizationRegistry",
]);

// The function that a declaration always holds: a function declaration's, or a const's.
const getFixedFunction = (declaration: ts.Node) =>
  ts.isFunctionDeclaration(declaration)
    ? declaration
    : ts.isVariableDeclaration(declaration) &&
        (ts.getCombinedNodeFlags(declaration) & ts.NodeFlags.Const) !== 0
      ? getAnyFunction(declaration.initializer)
      : undefined;

// Whether a node of a reached function runs only as that function's own code would inline: no
// this, arguments, or new.target of a function around it, no yield, await, or using, and no
// function that it makes but a callback that a call takes.
const isOwnCode = (node: ts.Node): boolean => {
  // A type runs nothing, though an instantiation expression, which TypeScript parses as one, runs.
  if (ts.isTypeNode(node) && !ts.isExpressionWithTypeArguments(node)) return true;
  if (
    node.kind === ts.SyntaxKind.ThisKeyword ||
    node.kind === ts.SyntaxKind.SuperKeyword ||
    ts.isMetaProperty(node) ||
    ts.isYieldExpression(node) ||
    ts.isAwaitExpression(node) ||
    (ts.isIdentifier(node) && node.text === "arguments") ||
    (ts.isVariableDeclarationList(node) && (node.flags & ts.NodeFlags.Using) !== 0)
  ) {
    return false;
  }
  if (ts.isFunctionLike(node) || ts.isClassLike(node)) {
    return (
      (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) &&
      ts.isCallExpression(node.parent) &&
      node.parent.arguments.includes(node) &&
      isPlain(node) &&
      ts.forEachChild(node, (child) => !isOwnCode(child) || undefined) === undefined
    );
  }
  return ts.forEachChild(node, (child) => !isOwnCode(child) || undefined) === undefined;
};

// The message of a throw that nothing catches, which an operator gives on to its caller.
export const getThrownMessage = (thrown: Thrown, node: ts.Node) =>
  thrown.shared?.message ??
  (thrown.uncaught.kind === "Apply" && thrown.uncaught.operator === "Assert"
    ? (thrown.uncaught.args[1] ?? string(""))
    : string(node.getText()));

// The state that an operator takes and gives: the script's variables and its heap.
const getState = (context: Context) => [
  ...context.variables.keys(),
  ...(context.heap === undefined ? [] : [context.heap]),
];

// What one function or class tells of the helpers that run it: the functions and classes that it
// names, the names of values that it reads, with their declarations, whether it names a built-in
// that queues jobs, and whether its code runs as an operator's would.
interface Unit {
  runs: Set<ts.Node>;
  read: Map<ts.Symbol, ts.Node>;
  isTaskNamed: boolean;
  isOwn: boolean;
}

const getUnit = (unit: ts.Node, context: Context): Unit => {
  const runs = new Set<ts.Node>();
  const read = new Map<ts.Symbol, ts.Node>();
  const isTaskNamed = { value: false };
  findNodes(unit, ts.isIdentifier).forEach((name) => {
    const named = getSymbol(name, context.checker);
    const symbol =
      named !== undefined && (named.flags & ts.SymbolFlags.Alias) !== 0
        ? context.checker.getAliasedSymbol(named)
        : named;
    const declaration = symbol?.valueDeclaration;
    if (symbol === undefined || declaration === undefined) return;
    if (declaration.getSourceFile().isDeclarationFile) {
      if (TASK_NAMES.has(symbol.name)) isTaskNamed.value = true;
      return;
    }
    const run =
      getFixedFunction(declaration) ??
      (ts.isClassLike(declaration) || ts.isFunctionLike(declaration) ? declaration : undefined);
    if (run === undefined) {
      if (
        ts.isVariableDeclaration(declaration) ||
        ts.isParameter(declaration) ||
        ts.isBindingElement(declaration)
      ) {
        read.set(symbol, declaration);
      }
      return;
    }
    // A function declaration's own name doesn't run it again.
    if (!(run === unit && ts.isFunctionDeclaration(unit) && name === unit.name)) runs.add(run);
  });
  return {
    runs,
    read,
    isTaskNamed: isTaskNamed.value,
    isOwn:
      (!ts.isFunctionLike(unit) || isPlain(unit as FunctionNode)) &&
      (ts.isClassLike(unit) ||
        ts.forEachChild(unit, (child) => !isOwnCode(child) || undefined) === undefined),
  };
};

// Finds, before the model's code compiles, each helper that can run as an operator: a function
// that a const or a declaration holds, whose parameters are names of values, that makes no closure
// and calls itself nowhere, and that reads no function from outside itself.
export const classifySharedHelpers = (reached: readonly ts.Node[], context: Context) => {
  if (context.heap === undefined) return;
  const found = reached.flatMap((node) =>
    findNodes(
      node,
      (inner): inner is ts.ArrowFunction | ts.FunctionDeclaration =>
        (ts.isArrowFunction(inner) || ts.isFunctionDeclaration(inner)) &&
        getFixedFunction(ts.isVariableDeclaration(inner.parent) ? inner.parent : inner) === inner &&
        isPlain(inner) &&
        inner.body !== undefined &&
        !isClosure(inner, context) &&
        getParameters(inner).every(
          (parameter) =>
            ts.isIdentifier(parameter.name) &&
            parameter.dotDotDotToken === undefined &&
            context.checker.getTypeAtLocation(parameter.name).getCallSignatures().length === 0,
        ),
    ),
  );
  const candidates = [...new Set(found)];
  // The units that the candidates run, each found once.
  const units = new Map<ts.Node, Unit>();
  const pending: ts.Node[] = [...candidates];
  while (pending.length > 0) {
    const node = pending.pop() ?? candidates[0];
    if (units.has(node)) continue;
    const unit = getUnit(node, context);
    units.set(node, unit);
    pending.push(...unit.runs);
  }
  const state = getState(context);
  candidates.forEach((callee) => {
    const reach = new Set<ts.Node>([callee]);
    const queued: ts.Node[] = [callee];
    const read = new Map<ts.Symbol, ts.Node>();
    while (queued.length > 0) {
      units.get(queued.pop() ?? callee)?.runs.forEach((run) => {
        if (reach.has(run)) return;
        reach.add(run);
        queued.push(run);
      });
    }
    const reached = [...reach].flatMap((node) => units.get(node) ?? []);
    reached.forEach((unit) =>
      unit.read.forEach((declaration, symbol) => read.set(symbol, declaration)),
    );
    const outside = [...read].filter(
      (entry) => ts.findAncestor(entry[1], (ancestor) => reach.has(ancestor)) === undefined,
    );
    if (
      reached.some((unit) => unit.isTaskNamed || !unit.isOwn || unit.runs.has(callee)) ||
      outside.some(
        (entry) =>
          context.checker.getTypeOfSymbolAtLocation(entry[0], entry[1]).getCallSignatures().length >
          0,
      )
    ) {
      return;
    }
    // The operator gives back the state and the names from outside that the helper changes.
    const changed = findChanged(callee, new Map(), context);
    const outsideNames = outside.map((entry) => entry[0]);
    context.sharedHelpers.set(callee, {
      read: outsideNames,
      changed: [...new Set([...state, ...outsideNames])].filter((symbol) => changed.has(symbol)),
    });
  });
};

// The shared call that a statement's call of a helper makes, where the helper runs as its inlined
// body would: where the call binds each name that the helper reads from a function around it.
const getSharedCall = (
  node: ts.Node,
  callee: FunctionNode,
  argumentNodes: readonly ts.Expression[],
  receiver: Receiver | undefined,
  path: Path,
  context: Context,
  frame: Frame,
) => {
  const helper = context.sharedHelpers.get(callee);
  if (
    helper === undefined ||
    receiver !== undefined ||
    !ts.isCallExpression(node) ||
    argumentNodes !== node.arguments ||
    argumentNodes.some(ts.isSpreadElement) ||
    argumentNodes.length > getParameters(callee).length ||
    frame.inlining.has(callee) ||
    context.inProgress.has(callee)
  ) {
    return undefined;
  }
  const isCatching = path.scope.isCatching;
  const isThrowing = frame.throwTo !== undefined;
  const captured = helper.read.filter(
    (symbol) => !context.variables.has(symbol) && path.scope.bindings.has(symbol),
  );
  const isReadable = (symbol: ts.Symbol) => {
    const declaration = symbol.valueDeclaration;
    return (
      declaration !== undefined &&
      !path.scope.uninitialized.has(symbol) &&
      (captured.includes(symbol) ||
        context.variables.has(symbol) ||
        ts.findAncestor(declaration.parent, ts.isFunctionLike) === undefined)
    );
  };
  // A name from outside that the helper changes is one that the call binds and takes back.
  if (
    !helper.read.every(isReadable) ||
    !helper.changed.every((symbol) => context.variables.has(symbol) || captured.includes(symbol))
  ) {
    return undefined;
  }
  const calls = context.sharedCalls.get(callee) ?? [];
  const defined = calls.find(
    (shared) =>
      shared.isCatching === isCatching &&
      shared.isThrowing === isThrowing &&
      shared.captured.length === captured.length &&
      shared.captured.every((symbol) => captured.includes(symbol)),
  );
  if (defined !== undefined) return { helper, shared: defined };
  const shared: SharedCall = {
    name: context.names.getFresh(
      ts.isVariableDeclaration(callee.parent) && ts.isIdentifier(callee.parent.name)
        ? callee.parent.name.text
        : (callee.name?.getText() ?? "helper"),
    ),
    isCatching,
    isThrowing,
    captured,
    throws: [],
  };
  defineShared(callee, helper.changed, shared, context);
  context.sharedCalls.set(callee, [...calls, shared]);
  return { helper, shared };
};

// Compiles a helper's body once, as an operator that gives how the body ended: its kind, its value
// or what it threw, the message and the place of the throw, and the state that it changed.
const defineShared = (
  callee: FunctionNode,
  changed: readonly ts.Symbol[],
  shared: SharedCall,
  context: Context,
) => {
  const parameters = getParameters(callee);
  const state = getState(context);
  const named = [
    ...parameters.map((parameter) => ({
      symbol: getSymbol(parameter.name, context.checker),
      name: context.names.getFresh(parameter.name.getText()),
    })),
    ...shared.captured.map((symbol) => ({ symbol, name: context.names.getFresh(symbol.name) })),
    ...state.map((symbol) => ({ symbol, name: context.names.getFresh(symbol.name) })),
  ];
  const base = createStateScope(context);
  const scope = {
    ...base,
    isCatching: shared.isCatching,
    bindings: new Map([
      ...base.bindings,
      ...named.flatMap((item): [ts.Symbol, Expression][] =>
        item.symbol === undefined ? [] : [[item.symbol, identifier(item.name)]],
      ),
    ]),
  };
  const end = (
    current: Path,
    kind: string,
    value: Expression,
    message: Expression,
    place: Expression,
  ) =>
    leaf(
      tuple([
        string(kind),
        value,
        message,
        place,
        ...changed.map((symbol) => current.scope.bindings.get(symbol) ?? getUndefined(context)),
      ]),
    );
  const inner: Path = {
    scope,
    mutable: new Set([
      ...state,
      ...changed,
      ...parameters.flatMap((parameter) => getSymbol(parameter.name, context.checker) ?? []),
    ]),
    isAssigned: false,
    isLast: false,
    isLooping: true,
    generators: new Map(),
    tasks: undefined,
  };
  const outer = context.inProgress;
  context.inProgress = new Set([...outer, callee]);
  const body = callee.body;
  const statements =
    body === undefined
      ? []
      : ts.isBlock(body)
        ? body.statements
        : [ts.factory.createReturnStatement(body)];
  const translated = translateStatements(statements, inner, context, {
    next: (current) => end(current, "return", getUndefined(context), string(""), number(0)),
    exit: (current, returned) =>
      returned === undefined
        ? end(current, "return", getUndefined(context), string(""), number(0))
        : end(current, "returnValue", returned, string(""), number(0)),
    breakTo: undefined,
    continueTo: undefined,
    // Where nothing can catch what the body throws, it stops there, as the inlined body would.
    throwTo: shared.isThrowing
      ? (current, thrown) => {
          // The place of a throw among the operator's, which it adds where it's new.
          const getPlace = (location: SourceLocation) => {
            const known = shared.throws.findIndex(
              (place) => place.line === location.line && place.column === location.column,
            );
            if (known !== -1) return known + 1;
            shared.throws.push(location);
            return shared.throws.length;
          };
          const passed = thrown.shared;
          return passed === undefined
            ? end(
                current,
                "throw",
                thrown.value,
                getThrownMessage(thrown, callee),
                number(getPlace(thrown.uncaught.location)),
              )
            : end(
                current,
                "throw",
                thrown.value,
                passed.message,
                passed.throws.reduceRight<Expression>(
                  (rest, location, position) =>
                    ifExpression(
                      apply("=", [passed.place, number(position + 1)]),
                      number(getPlace(location)),
                      rest,
                    ),
                  number(getPlace(UNLOCATED)),
                ),
              );
        }
      : undefined,
    yieldTo: undefined,
    awaitTo: undefined,
    inlining: new Set([callee]),
  });
  context.inProgress = outer;
  context.output.push(
    link(
      context,
      "definition",
      shared.name,
      callee,
      defineAt(
        callee,
        shared.name,
        named.map((item) => ({ name: item.name, arity: 0 })),
        render(translated),
      ),
    ),
  );
};

// A statement's call of a helper, which runs as the helper's shared operator where the call binds
// a value to each parameter, and inlines the helper's body otherwise, as where a parameter takes a
// function that the body calls by name.
export const translateSharedCall = (
  node: ts.Node,
  callee: FunctionNode,
  argumentNodes: readonly ts.Expression[],
  receiver: Receiver | undefined,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value?: Expression) => Formula,
  inlineCall: (bound: Bound, inner: Path) => Formula,
): Formula =>
  bindCall(node, callee, argumentNodes, receiver, path, context, frame, (bound, inner) => {
    const parameters = getParameters(callee);
    const found = parameters.some((parameter) => {
      const symbol = getSymbol(parameter.name, context.checker);
      return symbol === undefined || bound.scope.functions.has(symbol);
    })
      ? undefined
      : getSharedCall(node, callee, argumentNodes, receiver, path, context, frame);
    if (found === undefined) return inlineCall(bound, inner);
    const shared = found.shared;
    const changed = found.helper.changed;
    const state = getState(context);
    // What the call evaluated of the helper's own code, such as a default, belongs to that call.
    const isOwn = (entry: [ts.Node, Expression]) =>
      ts.findAncestor(entry[0], (ancestor) => ancestor === callee) !== undefined;
    const caller: Path = {
      ...inner,
      scope: {
        ...inner.scope,
        previous: path.scope.previous,
        entered: path.scope.entered,
        results: new Map([...inner.scope.results].filter((entry) => !isOwn(entry))),
        allocated: new Map([...inner.scope.allocated].filter((entry) => !isOwn(entry))),
      },
    };
    const result = context.names.getFresh("result");
    const kind = index(identifier(result), [number(1)]);
    const value = index(identifier(result), [number(2)]);
    const message = index(identifier(result), [number(3)]);
    const place = index(identifier(result), [number(4)]);
    const after: Path = {
      ...caller,
      scope: {
        ...caller.scope,
        bindings: new Map([
          ...caller.scope.bindings,
          ...changed.map((symbol, position): [ts.Symbol, Expression] => [
            symbol,
            index(identifier(result), [number(position + 5)]),
          ]),
        ]),
      },
      isAssigned: caller.isAssigned || changed.some((symbol) => context.variables.has(symbol)),
    };
    // The throw that nothing catches reports where the helper threw it.
    const uncaught = shared.throws.reduceRight<Expression>(
      (rest, location, position) =>
        ifExpression(
          apply("=", [place, number(position + 1)]),
          locate(apply("Assert", [boolean(false), message]), location),
          rest,
        ),
      apply("Assert", [boolean(false), message]),
    );
    const throwTo = frame.throwTo;
    const returned = continueWith(
      after,
      ifExpression(apply("=", [kind, string("returnValue")]), value, getUndefined(context)),
    );
    const ended =
      throwTo === undefined
        ? returned
        : ifThenElse(
            apply("=", [kind, string("throw")]),
            throwTo(after, {
              value,
              uncaught,
              shared: { message, place, throws: shared.throws },
            }),
            returned,
          );
    const operands = [
      ...parameters.map((parameter) => {
        const symbol = getSymbol(parameter.name, context.checker);
        return (symbol && bound.scope.bindings.get(symbol)) ?? getUndefined(context);
      }),
      ...shared.captured.map((symbol) => bound.scope.bindings.get(symbol) ?? getUndefined(context)),
      ...state.map(
        (symbol) =>
          bound.scope.bindings.get(symbol) ??
          context.variables.get(symbol) ??
          getUndefined(context),
      ),
    ];
    return letIn(
      bound.definitions,
      throwOnDestructured(
        bound.scope,
        inner,
        context,
        frame,
        forceHeap(
          inner.scope,
          bound.scope,
          bindOnce(path, result, call(shared.name, operands), ended),
          leaf(boolean(false)),
          context,
        ),
      ),
    );
  });
