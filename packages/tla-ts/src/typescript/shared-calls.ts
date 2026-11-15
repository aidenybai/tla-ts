import ts from "@typescript/typescript6";
import type { Expression, SourceLocation } from "../ast";
import { TlaTypeScriptError } from "../errors";
import {
  bindCall,
  bindOnce,
  findChanged,
  type Frame,
  getDeferredDefaults,
  getPassedCallbacks,
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
  type SharedHelper,
  skipCasts,
} from "./context";
import { forceHeap } from "./functions";
import { type Formula, ifThenElse, leaf, letIn, render } from "./formula";
import { link } from "./regions";
import { type Bound, bindValues, createStateScope, type Receiver } from "./scope";
import { getStackCall, isStackConstruction } from "./stacks";
import {
  apply,
  boolean,
  call,
  define,
  defineAt,
  identifier,
  ifExpression,
  index,
  locate,
  number,
  string,
  tuple,
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
// function that it makes but a callback that a call takes, a parameter's default, or a function
// that a const or a declaration holds and that only calls run or take.
const isOwnCode = (node: ts.Node, context: Context): boolean => {
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
    const name = ts.isFunctionDeclaration(node)
      ? node.name
      : ts.isVariableDeclaration(node.parent) && getFixedFunction(node.parent) === node
        ? node.parent.name
        : undefined;
    const symbol = name === undefined ? undefined : getSymbol(name, context.checker);
    const isCalledOnly = () =>
      findNodes(
        ts.findAncestor(node.parent, ts.isFunctionLike) ?? node.getSourceFile(),
        ts.isIdentifier,
      ).every(
        (reference) =>
          reference === name ||
          getSymbol(reference, context.checker) !== symbol ||
          (ts.isCallExpression(reference.parent) &&
            (reference.parent.expression === reference ||
              reference.parent.arguments.includes(reference))),
      );
    return (
      (ts.isArrowFunction(node) ||
        ts.isFunctionExpression(node) ||
        ts.isFunctionDeclaration(node)) &&
      ((!ts.isFunctionDeclaration(node) &&
        ((ts.isCallExpression(node.parent) && node.parent.arguments.includes(node)) ||
          (ts.isParameter(node.parent) && node.parent.initializer === node))) ||
        (symbol !== undefined && !isClosure(node, context) && isCalledOnly())) &&
      isPlain(node) &&
      ts.forEachChild(node, (child) => !isOwnCode(child, context) || undefined) === undefined
    );
  }
  return ts.forEachChild(node, (child) => !isOwnCode(child, context) || undefined) === undefined;
};

// The message of a throw that nothing catches, which an operator gives on to its caller.
export const getThrownMessage = (thrown: Thrown, node: ts.Node) =>
  thrown.shared?.message ??
  (thrown.uncaught.kind === "Apply" && thrown.uncaught.operator === "Assert"
    ? (thrown.uncaught.args[1] ?? string(""))
    : string(node.getText()));

// What one function or class tells of the helpers that run it: the functions and classes that it
// names, the names of values that it reads, with their declarations, whether it names a built-in
// that queues jobs or makes or calls a DisposableStack, which only the path that runs it follows,
// and whether its code runs as an operator's would.
interface Unit {
  runs: Set<ts.Node>;
  read: Map<ts.Symbol, ts.Node>;
  isTasked: boolean;
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
    isTasked:
      isTaskNamed.value ||
      findNodes(unit, ts.isNewExpression).some((node) => isStackConstruction(node, context)) ||
      findNodes(unit, ts.isCallExpression).some(
        (node) => getStackCall(node, context) !== undefined,
      ),
    isOwn:
      (!ts.isFunctionLike(unit) || isPlain(unit as FunctionNode)) &&
      (ts.isClassLike(unit) ||
        ts.forEachChild(unit, (child) => !isOwnCode(child, context) || undefined) === undefined),
  };
};

// Finds, before the model's code compiles, each helper that can run as an operator: a function
// that a const or a declaration holds, whose parameters are names, that makes no closure, and that
// reads no function from outside itself but through a parameter. One that calls itself, through
// itself or through the functions it runs, calls its own operator. A function that a call passes a
// helper's parameter, written there or named, runs inside the operator where it reads the same.
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
        getParameters(inner).every((parameter) => ts.isIdentifier(parameter.name)),
    ),
  );
  const candidates = [...new Set(found)];
  const isCandidate = new Set<ts.Node>(candidates);
  const callbacks = [
    ...new Set(
      reached.flatMap((node) =>
        findNodes(node, ts.isCallExpression).flatMap((call) => {
          const declaration = getSymbol(call.expression, context.checker)?.valueDeclaration;
          const callee = declaration === undefined ? undefined : getFixedFunction(declaration);
          return callee === undefined || !isCandidate.has(callee)
            ? []
            : call.arguments.flatMap((argument) => {
                const passed = skipCasts(argument);
                const named = ts.isIdentifier(passed)
                  ? getSymbol(passed, context.checker)?.valueDeclaration
                  : undefined;
                const callback =
                  ts.isArrowFunction(passed) || ts.isFunctionExpression(passed)
                    ? passed
                    : named === undefined
                      ? undefined
                      : getFixedFunction(named);
                return callback?.body !== undefined && isPlain(callback) ? [callback] : [];
              });
        }),
      ),
    ),
  ];
  // A call that tla-ts can't tell by name may run any function or class of the script, so every
  // helper's operator takes each variable that one names.
  const namedInside = new Set(
    [...new Set(reached.map((node) => node.getSourceFile()))].flatMap((sourceFile) =>
      findNodes(
        sourceFile,
        (inner): inner is ts.Identifier =>
          ts.isIdentifier(inner) &&
          ts.findAncestor(
            inner.parent,
            (ancestor) => ts.isFunctionLike(ancestor) || ts.isClassLike(ancestor),
          ) !== undefined,
      ).flatMap((name) => {
        const symbol = getSymbol(name, context.checker);
        return symbol === undefined
          ? []
          : (symbol.flags & ts.SymbolFlags.Alias) !== 0
            ? [context.checker.getAliasedSymbol(symbol)]
            : [symbol];
      }),
    ),
  );
  const sharedState = [...context.variables.keys()].filter((symbol) => namedInside.has(symbol));
  // The units that the candidates and the callbacks run, each found once.
  const units = new Map<ts.Node, Unit>();
  const pending: ts.Node[] = [...candidates, ...callbacks];
  while (pending.length > 0) {
    const node = pending.pop() ?? candidates[0];
    if (units.has(node)) continue;
    const unit = getUnit(node, context);
    units.set(node, unit);
    pending.push(...unit.runs);
  }
  // What a function and the functions it runs read from outside it and change, where all of their
  // code runs as an operator's would.
  const getHelper = (callee: ts.Node): SharedHelper | undefined => {
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
    const reachedUnits = [...reach].flatMap((node) => units.get(node) ?? []);
    reachedUnits.forEach((unit) =>
      unit.read.forEach((declaration, symbol) => read.set(symbol, declaration)),
    );
    // A name that a function around the helper declares comes from outside, though the helper runs
    // that function again: the helper's call sees the name of the call that made it.
    const outside = [...read].filter(
      (entry) =>
        ts.findAncestor(
          entry[1],
          (ancestor) =>
            reach.has(ancestor) &&
            (ancestor === callee ||
              ts.findAncestor(callee, (inner) => inner === ancestor) === undefined),
        ) === undefined,
    );
    if (
      reachedUnits.some((unit) => unit.isTasked || !unit.isOwn) ||
      outside.some(
        (entry) =>
          context.checker.getTypeOfSymbolAtLocation(entry[0], entry[1]).getCallSignatures().length >
          0,
      )
    ) {
      return undefined;
    }
    // The operator gives back the state and the names from outside that the helper changes.
    const changed = findChanged(callee, new Map(), context);
    const outsideNames = outside.map((entry) => entry[0]);
    // A script's class that the helper runs is also a binding that its declaration initializes.
    const classes = [...reach].flatMap((node) =>
      ts.isClassDeclaration(node) && ts.isSourceFile(node.parent) && node.name !== undefined
        ? (getSymbol(node.name, context.checker) ?? [])
        : [],
    );
    return {
      read: [...outsideNames, ...classes],
      state: sharedState,
      changed: [...new Set([...context.variables.keys(), ...outsideNames])].filter((symbol) =>
        changed.has(symbol),
      ),
    };
  };
  candidates.forEach((callee) => {
    const helper = getHelper(callee);
    if (helper !== undefined) context.sharedHelpers.set(callee, helper);
  });
  callbacks.forEach((callback) => {
    const helper = getHelper(callback);
    if (helper !== undefined) context.sharedCallbacks.set(callback, helper);
  });
};

// Whether a statement's call of a helper may run as the helper's operator: a call by name with no
// more arguments than the helper takes, but where a rest parameter takes them, none of which
// spreads.
export const isSharedCall = (
  node: ts.Node,
  callee: FunctionNode,
  argumentNodes: readonly ts.Expression[],
  receiver: Receiver | undefined,
  context: Context,
) =>
  context.sharedHelpers.has(callee) &&
  receiver === undefined &&
  ts.isCallExpression(node) &&
  argumentNodes === node.arguments &&
  !argumentNodes.some(ts.isSpreadElement) &&
  (argumentNodes.length <= getParameters(callee).length ||
    getParameters(callee).some((parameter) => parameter.dotDotDotToken !== undefined));

// The operator that a call of a helper runs, where the helper runs as its inlined body would: where
// the call binds each name that the helper reads from a function around it, and takes back each
// one that it changes. A call inside the helper's own operator calls that operator.
const getSharedCall = (
  callee: FunctionNode,
  callbacks: ReadonlyMap<ts.Symbol, FunctionNode>,
  path: Path,
  context: Context,
) => {
  const helper = context.sharedHelpers.get(callee);
  const passed = [...callbacks.values()].map((callback) => context.sharedCallbacks.get(callback));
  if (helper === undefined || passed.some((callback) => callback === undefined)) return undefined;
  const runs = [helper, ...passed.flatMap((callback) => callback ?? [])];
  const read = [...new Set(runs.flatMap((run) => run.read))];
  const changed = [...new Set(runs.flatMap((run) => run.changed))];
  const captured = read.filter(
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
  // The generators that the caller made live in its path, which an operator, compiled once, can't
  // resume or close.
  if (
    path.generators.size > 0 ||
    !read.every(isReadable) ||
    !changed.every((symbol) => context.variables.has(symbol) || captured.includes(symbol))
  ) {
    return undefined;
  }
  const named = new Set(runs.flatMap((run) => run.state));
  const held = new Map(
    [...path.scope.functions].filter((entry) => read.includes(entry[0]) || named.has(entry[0])),
  );
  const defined = (context.sharedCalls.get(callee) ?? []).find(
    (shared) =>
      shared.captured.length === captured.length &&
      shared.captured.every((symbol) => captured.includes(symbol)) &&
      [...callbacks].every((entry) => shared.callbacks.get(entry[0]) === entry[1]) &&
      shared.held.size === held.size &&
      [...held].every((entry) => shared.held.get(entry[0]) === entry[1]),
  );
  if (defined !== undefined && context.inProgress.has(callee)) defined.isRecursive = true;
  if (defined !== undefined) return defined;
  // The operator takes the heap, which is a variable, and only the others that its code may read or
  // change.
  const state = [...context.variables.keys()].filter(
    (symbol) => symbol === context.heap || named.has(symbol) || changed.includes(symbol),
  );
  return defineShared(callee, { changed, captured, callbacks, held, state }, context);
};

// The parameters that take values, not the functions that the operator calls.
const getValueParameters = (
  callee: FunctionNode,
  callbacks: ReadonlyMap<ts.Symbol, FunctionNode>,
  context: Context,
) =>
  getParameters(callee).filter((parameter) => {
    const symbol = getSymbol(parameter.name, context.checker);
    return symbol === undefined || !callbacks.has(symbol);
  });

// The place of a throw that an operator gives its caller, among every operator's.
const getPlace = (location: SourceLocation, context: Context) => {
  const known = context.throwPlaces.findIndex(
    (place) =>
      place.line === location.line &&
      place.column === location.column &&
      place.range?.module === location.range?.module,
  );
  if (known !== -1) return number(known + 1);
  context.throwPlaces.push(location);
  return number(context.throwPlaces.length);
};

// The operator that stops where an operator's throw that nothing catches is, with its message.
const getThrown = (place: Expression, message: Expression, context: Context) => {
  if (context.thrownName === undefined) context.thrownName = context.names.getFresh("Thrown");
  return call(context.thrownName, [place, message]);
};

// Defines the operator that stops at each place, before the operators that call it.
export const defineThrown = (context: Context) =>
  context.thrownName === undefined
    ? []
    : [
        define(
          context.thrownName,
          [
            { name: "place", arity: 0 },
            { name: "message", arity: 0 },
          ],
          context.throwPlaces.reduceRight<Expression>(
            (rest, location, position) =>
              ifExpression(
                apply("=", [identifier("place"), number(position + 1)]),
                locate(apply("Assert", [boolean(false), identifier("message")]), location),
                rest,
              ),
            apply("Assert", [boolean(false), identifier("message")]),
          ),
        ),
      ];

// Compiles a helper's body once, as an operator that gives how the body ended: its kind, its value
// or what it threw, the message and the place of the throw, and the state that it changed.
const defineShared = (
  callee: FunctionNode,
  variant: Pick<SharedCall, "changed" | "captured" | "callbacks" | "held" | "state">,
  context: Context,
) => {
  const parameters = getParameters(callee);
  const changed = variant.changed;
  const named = [
    ...getValueParameters(callee, variant.callbacks, context).map((parameter) => ({
      symbol: getSymbol(parameter.name, context.checker),
      name: context.names.getFresh(parameter.name.getText()),
    })),
    ...variant.captured.map((symbol) => ({ symbol, name: context.names.getFresh(symbol.name) })),
    ...variant.state.map((symbol) => ({ symbol, name: context.names.getFresh(symbol.name) })),
  ];
  const shared: SharedCall = {
    name: context.names.getFresh(
      ts.isVariableDeclaration(callee.parent) && ts.isIdentifier(callee.parent.name)
        ? callee.parent.name.text
        : (callee.name?.getText() ?? "helper"),
    ),
    ...variant,
    parameters: named.map((item) => ({ name: item.name, arity: 0 })),
    isRecursive: false,
    isReturning: true,
    isThrowing: true,
  };
  // A call inside the body that the operator runs calls the operator itself.
  context.sharedCalls.set(callee, [...(context.sharedCalls.get(callee) ?? []), shared]);
  const base = createStateScope(context);
  const scope = {
    ...base,
    // The body runs as inside a try, so that each caller catches or stops at what it throws.
    isCatching: true,
    functions: new Map([...base.functions, ...variant.held, ...variant.callbacks]),
    // A variable that the operator doesn't take has no binding, so its code can't read it stale.
    bindings: new Map(
      named.flatMap((item): [ts.Symbol, Expression][] =>
        item.symbol === undefined ? [] : [[item.symbol, identifier(item.name)]],
      ),
    ),
  };
  // The defaults that the operator evaluates where its call passes undefined, in order, as each
  // may read the parameters before it.
  const deferred = getDeferredDefaults(callee, context);
  const defaulted = parameters.reduce<Bound>(
    (current, parameter) => {
      const symbol = getSymbol(parameter.name, context.checker);
      const passed = symbol && current.scope.bindings.get(symbol);
      if (!deferred.has(parameter) || passed === undefined) return current;
      const bound = bindValues([parameter], [passed], current.scope, context);
      return { definitions: [...current.definitions, ...bound.definitions], scope: bound.scope };
    },
    { definitions: [], scope },
  );
  const kinds = new Set<string>();
  const end = (
    current: Path,
    kind: string,
    value: Expression,
    message: Expression,
    place: Expression,
  ) => {
    kinds.add(kind);
    return leaf(
      tuple([
        string(kind),
        value,
        message,
        place,
        ...changed.map((symbol) => current.scope.bindings.get(symbol) ?? getUndefined(context)),
      ]),
    );
  };
  const inner: Path = {
    scope: defaulted.scope,
    mutable: new Set([
      ...variant.state,
      ...changed,
      ...parameters.flatMap((parameter) => getSymbol(parameter.name, context.checker) ?? []),
    ]),
    isAssigned: false,
    isLast: false,
    isLooping: true,
    generators: new Map(),
    tasks: undefined,
  };
  // The operator is a top-level definition, which can't call the operators of a recursive
  // function's call that it runs inside.
  const outer = { inProgress: context.inProgress, selfCalls: context.selfCalls };
  context.inProgress = new Set([...outer.inProgress, callee]);
  context.selfCalls = new Map();
  const body = callee.body;
  const statements =
    body === undefined
      ? []
      : ts.isBlock(body)
        ? body.statements
        : [ts.factory.createReturnStatement(body)];
  const translated = letIn(
    defaulted.definitions,
    translateStatements(statements, inner, context, {
      next: (current) => end(current, "return", getUndefined(context), string(""), number(0)),
      exit: (current, returned) =>
        returned === undefined
          ? end(current, "return", getUndefined(context), string(""), number(0))
          : end(current, "returnValue", returned, string(""), number(0)),
      breakTo: undefined,
      continueTo: undefined,
      // The caller catches what the body throws, or stops where the body threw it.
      throwTo: (current, thrown) =>
        end(
          current,
          "throw",
          thrown.value,
          getThrownMessage(thrown, callee),
          thrown.shared?.place ?? getPlace(thrown.uncaught.location, context),
        ),
      yieldTo: undefined,
      awaitTo: undefined,
      inlining: new Set([callee]),
    }),
  );
  shared.isReturning = [...kinds].some((kind) => kind !== "throw");
  shared.isThrowing = kinds.has("throw");
  context.inProgress = outer.inProgress;
  context.selfCalls = outer.selfCalls;
  context.output.push(
    link(
      context,
      "definition",
      shared.name,
      callee,
      defineAt(callee, shared.name, shared.parameters, render(translated)),
    ),
  );
  return shared;
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
): Formula => {
  // A call inside the helper's own operator binds its arguments as any other call does.
  const outside = {
    ...frame,
    inlining: new Set([...frame.inlining].filter((inlined) => inlined !== callee)),
  };
  const parameters = getParameters(callee);
  // A parameter whose type is a function takes the function that the call passes it, which the
  // operator runs as the inlined body would.
  const callbacks = new Map(getPassedCallbacks(parameters, argumentNodes, path, context));
  const shared = parameters.every((parameter) => {
    const symbol = getSymbol(parameter.name, context.checker);
    return (
      symbol !== undefined &&
      context.checker.getTypeAtLocation(parameter).getCallSignatures().length > 0 ===
        callbacks.has(symbol)
    );
  })
    ? getSharedCall(callee, callbacks, path, context)
    : undefined;
  if (shared === undefined) {
    return bindCall(node, callee, argumentNodes, receiver, path, context, outside, inlineCall);
  }
  // The operator evaluates the parameters' defaults, so the call passes what it has as it is.
  return bindCall(
    node,
    callee,
    argumentNodes,
    receiver,
    path,
    context,
    outside,
    (bound, inner) => {
      const changed = shared.changed;
      // What the call evaluated of the helper's own code, such as a default, belongs to that call,
      // though a call inside the helper's body keeps what its caller evaluated before it.
      const isOwn = (entry: [ts.Node, Expression], before: ReadonlyMap<ts.Node, Expression>) =>
        !before.has(entry[0]) &&
        ts.findAncestor(entry[0], (ancestor) => ancestor === callee) !== undefined;
      const caller: Path = {
        ...inner,
        scope: {
          ...inner.scope,
          previous: path.scope.previous,
          entered: path.scope.entered,
          results: new Map(
            [...inner.scope.results].filter((entry) => !isOwn(entry, path.scope.results)),
          ),
          allocated: new Map(
            [...inner.scope.allocated].filter((entry) => !isOwn(entry, path.scope.allocated)),
          ),
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
      const throwTo = frame.throwTo;
      // Where the helper only throws, as the inlined body would, the caller doesn't go on.
      const returned = shared.isReturning
        ? continueWith(
            after,
            ifExpression(apply("=", [kind, string("returnValue")]), value, getUndefined(context)),
          )
        : leaf(boolean(false));
      // The throw that nothing catches reports where the helper threw it.
      const uncaught = getThrown(place, message, context);
      const ended = shared.isThrowing
        ? ifThenElse(
            apply("=", [kind, string("throw")]),
            throwTo === undefined
              ? leaf(uncaught)
              : throwTo(after, { value, uncaught, shared: { message, place } }),
            returned,
          )
        : returned;
      const operands = [
        ...getValueParameters(callee, shared.callbacks, context).map((parameter) => {
          const symbol = getSymbol(parameter.name, context.checker);
          return (symbol && bound.scope.bindings.get(symbol)) ?? getUndefined(context);
        }),
        ...shared.captured.map(
          (symbol) => bound.scope.bindings.get(symbol) ?? getUndefined(context),
        ),
        ...shared.state.map((symbol) => {
          const value = bound.scope.bindings.get(symbol);
          if (value === undefined) {
            throw new TlaTypeScriptError(`${symbol.name} can't be read here`, node);
          }
          return value;
        }),
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
    },
    getDeferredDefaults(callee, context),
  );
};
