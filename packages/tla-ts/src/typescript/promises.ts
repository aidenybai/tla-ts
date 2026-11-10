import ts from "@typescript/typescript6";
import type { Expression } from "../ast";
import {
  bindCall,
  bindOnce,
  enterBody,
  type Frame,
  getChanged,
  leaveBody,
  getBody,
  getCallback,
  getCast,
  isSameExpression,
  type Path,
  translateCallStatement,
  translateStatements,
} from "./actions";
import {
  type Context,
  type FunctionNode,
  getLocalCaptures,
  getSymbol,
  getUndefined,
} from "./context";
import { TlaTypeScriptError } from "../errors";
import { translateExpression } from "./expressions";
import { type Formula, ifThenElse, leaf, letIn } from "./formula";
import { getHeap } from "./heap";
import { getBuiltIn, translateBuiltInValue } from "./intrinsics";
import { useJavaScript } from "./javascript";
import { bindValues } from "./scope";
import { apply, boolean, identifier, string } from "./tla";

// The jobs and timers that a script queues, and the promises it makes, which tla-ts follows as it
// compiles, as JavaScript runs each job once the script and the jobs before it finish.
export interface Tasks {
  jobs: readonly Job[];
  timers: readonly Job[];
  promises: ReadonlyMap<string, TrackedPromise>;
  // The code that last ran each async function's body, by the body's promise, which the body
  // leaves to when it awaits or finishes: the call, and then the job that resumed it.
  callers: ReadonlyMap<string, Caller>;
}

interface Caller {
  path: Path;
  resume: (path: Path) => Formula;
}

interface Job {
  run: (path: Path, next: (path: Path) => Formula) => Formula;
}

interface TrackedPromise {
  ref: Expression;
  state: "pending" | "fulfilled" | "rejected";
  // Whether its resolving functions ran, after which they do nothing, though a promise that it
  // follows may not have settled.
  isResolved: boolean;
  value: Expression | undefined;
  reactions: readonly Reaction[];
}

// What a job does once a promise settles: call a handler, or pass the value on, and settle the
// derived promise with what that gives.
interface Reaction {
  onFulfilled: Handler | undefined;
  onRejected: Handler | undefined;
  derived: string | undefined;
}

interface Handler {
  run: (
    path: Path,
    value: Expression,
    onReturn: (path: Path, result: Expression) => Formula,
    onThrow: (path: Path, thrown: Expression) => Formula,
  ) => Formula;
}

export const EMPTY_TASKS: Tasks = { jobs: [], timers: [], promises: new Map(), callers: new Map() };

const getTasks = (path: Path, node: ts.Node) => {
  if (path.tasks === undefined) {
    throw new TlaTypeScriptError("tla-ts can't follow a promise in a loop", node);
  }
  return path.tasks;
};

const withTasks = (path: Path, tasks: Tasks): Path => ({ ...path, tasks });

const enqueue = (path: Path, node: ts.Node, job: Job) => {
  const tasks = getTasks(path, node);
  return withTasks(path, { ...tasks, jobs: [...tasks.jobs, job] });
};

const setPromise = (path: Path, node: ts.Node, name: string, promise: TrackedPromise) => {
  const tasks = getTasks(path, node);
  return withTasks(path, { ...tasks, promises: new Map([...tasks.promises, [name, promise]]) });
};

const getPromise = (path: Path, node: ts.Node, name: string) => {
  const promise = getTasks(path, node).promises.get(name);
  if (promise === undefined) throw new TlaTypeScriptError("tla-ts can't follow this promise", node);
  return promise;
};

// The job that a reaction runs once its promise settles with a value.
const getReactionJob = (
  reaction: Reaction,
  value: Expression,
  isRejected: boolean,
  node: ts.Node,
  context: Context,
): Job => ({
  run: (path, next) => {
    const handler = isRejected ? reaction.onRejected : reaction.onFulfilled;
    const derived = reaction.derived;
    const settleDerived = (current: Path, result: Expression, isThrown: boolean) =>
      derived === undefined
        ? next(current)
        : isThrown
          ? next(settle(current, node, derived, result, true, context))
          : resolve(current, node, derived, result, undefined, context, next);
    return handler === undefined
      ? settleDerived(path, value, isRejected)
      : handler.run(
          path,
          value,
          (current, result) => settleDerived(current, result, false),
          (current, thrown) => settleDerived(current, thrown, true),
        );
  },
});

// Fulfills or rejects a pending promise, which queues the jobs of its reactions.
const settle = (
  path: Path,
  node: ts.Node,
  name: string,
  value: Expression,
  isRejected: boolean,
  context: Context,
): Path => {
  const promise = getPromise(path, node, name);
  if (promise.state !== "pending") return path;
  const settled = setPromise(path, node, name, {
    ...promise,
    state: isRejected ? "rejected" : "fulfilled",
    isResolved: true,
    value,
    reactions: [],
  });
  return promise.reactions.reduce(
    (current, reaction) =>
      enqueue(current, node, getReactionJob(reaction, value, isRejected, node, context)),
    settled,
  );
};

const findPromise = (path: Path, node: ts.Node, value: Expression) =>
  [...getTasks(path, node).promises].find((entry) => isSameExpression(entry[1].ref, value))?.[0];

const isPromiseType = (node: ts.Expression, context: Context) => {
  const type = context.checker.getTypeAtLocation(node);
  return [type, ...(type.isUnion() ? type.types : [])].some(
    (member) => member.getSymbol()?.name === "Promise",
  );
};

// The promise that a value is: one that its expression names, or, where TypeScript types the value
// as a promise, any that the path follows, which the value may hold.
const dispatchPromise = (
  path: Path,
  node: ts.Node,
  value: Expression,
  valueNode: ts.Expression | undefined,
  context: Context,
  onPromise: (name: string) => Formula,
  otherwise: () => Formula,
): Formula => {
  const found = findPromise(path, node, value);
  if (found !== undefined) return onPromise(found);
  if (valueNode === undefined || !isPromiseType(valueNode, context)) return otherwise();
  return [...getTasks(path, node).promises].reduceRight(
    (rest, entry) =>
      ifThenElse(
        useJavaScript("SameValue", [value, entry[1].ref], context),
        onPromise(entry[0]),
        rest,
      ),
    otherwise(),
  );
};

// Resolves a promise with a value: a promise that tla-ts follows, which the promise then follows
// a job later, or a value that it fulfills the promise with. tla-ts doesn't call the then of an
// object that isn't a promise.
const resolve = (
  path: Path,
  node: ts.Node,
  name: string,
  value: Expression,
  valueNode: ts.Expression | undefined,
  context: Context,
  continueWith: (path: Path) => Formula,
): Formula => {
  const follow = (followed: string) => {
    if (followed === name) {
      return leaf(
        apply("Assert", [
          boolean(false),
          string("tla-ts can't throw the TypeError of resolving a promise with itself"),
        ]),
      );
    }
    const reaction: Reaction = {
      onFulfilled: settler(name, false, node, context),
      onRejected: settler(name, true, node, context),
      derived: undefined,
    };
    return continueWith(
      enqueue(path, node, {
        run: (current, next) => next(addReaction(current, node, followed, reaction, context)),
      }),
    );
  };
  return dispatchPromise(path, node, value, valueNode, context, follow, () =>
    ifThenElse(
      useJavaScript("IsThenable", [getHeap(path.scope, node, context), value], context),
      leaf(
        apply("Assert", [
          boolean(false),
          string("tla-ts can't resolve a promise with an object that has a then"),
        ]),
      ),
      continueWith(settle(path, node, name, value, false, context)),
    ),
  );
};

const settler = (name: string, isRejected: boolean, node: ts.Node, context: Context): Handler => ({
  run: (path, value, onReturn) =>
    onReturn(settle(path, node, name, value, isRejected, context), getUndefined(context)),
});

// Adds a reaction to a promise, or queues its job where the promise has settled.
const addReaction = (
  path: Path,
  node: ts.Node,
  name: string,
  reaction: Reaction,
  context: Context,
): Path => {
  const promise = getPromise(path, node, name);
  if (promise.state === "pending") {
    return setPromise(path, node, name, {
      ...promise,
      reactions: [...promise.reactions, reaction],
    });
  }
  return enqueue(
    path,
    node,
    getReactionJob(
      reaction,
      promise.value ?? getUndefined(context),
      promise.state === "rejected",
      node,
      context,
    ),
  );
};

// Makes a pending promise on the heap.
const makePromise = (
  path: Path,
  node: ts.Node,
  context: Context,
  continueWith: (path: Path, name: string) => Formula,
) => {
  const heapSymbol = context.heap;
  if (heapSymbol === undefined) throw new TlaTypeScriptError("Use promises only in scripts", node);
  const name = context.names.getFresh("promise");
  const heap = useJavaScript(
    "Allocate",
    [getHeap(path.scope, node, context), identifier("PromiseObject")],
    context,
  );
  const made: Path = {
    ...path,
    scope: {
      ...path.scope,
      bindings: new Map([...path.scope.bindings, [heapSymbol, identifier(name)]]),
    },
  };
  return bindOnce(
    path,
    name,
    heap,
    continueWith(
      setPromise(made, node, name, {
        ref: useJavaScript("Allocated", [identifier(name)], context),
        state: "pending",
        isResolved: false,
        value: undefined,
        reactions: [],
      }),
      name,
    ),
  );
};

// A function that a then or a catch takes, which runs as a job with the promise's value.
const getHandler = (
  node: ts.Expression | undefined,
  path: Path,
  context: Context,
  frame: Frame,
): Handler | undefined => {
  if (node === undefined) return undefined;
  const cast = getCast(node);
  if (
    cast.kind === ts.SyntaxKind.UndefinedKeyword ||
    (ts.isIdentifier(cast) && cast.text === "undefined")
  ) {
    return undefined;
  }
  const resolver = getResolver(cast, context);
  if (resolver !== undefined) {
    const binding = path.scope.bindings.get(resolver.symbol);
    return {
      run: (current, value, onReturn) =>
        callResolver(
          node,
          binding,
          resolver.isRejecting,
          value,
          undefined,
          current,
          context,
          (after) => onReturn(after, getUndefined(context)),
        ),
    };
  }
  const callee = getCallback(cast, path, context);
  if (callee === undefined) {
    throw new TlaTypeScriptError("Pass then a function that tla-ts can follow", node);
  }
  const captured = getLocalCaptures(callee, context);
  const made = path.scope;
  const keep = <Value>(runtime: Map<ts.Symbol, Value>, kept: Map<ts.Symbol, Value>) =>
    new Map([...runtime, ...[...kept].filter((entry) => captured.has(entry[0]))]);
  return {
    run: (current, value, onReturn, onThrow) =>
      callHandler(
        callee,
        value,
        {
          ...current,
          scope: {
            ...current.scope,
            bindings: keep(current.scope.bindings, made.bindings),
            functions: keep(current.scope.functions, made.functions),
            receiver: ts.isArrowFunction(callee) ? made.receiver : undefined,
          },
        },
        context,
        frame,
        onReturn,
        onThrow,
      ),
  };
};

const callHandler = (
  callee: FunctionNode,
  value: Expression,
  path: Path,
  context: Context,
  frame: Frame,
  onReturn: (path: Path, result: Expression) => Formula,
  onThrow: (path: Path, thrown: Expression) => Formula,
): Formula => {
  if (frame.inlining.has(callee)) {
    throw new TlaTypeScriptError("Functions that change state can't call themselves", callee);
  }
  const bound = bindValues(callee.parameters, [value], path.scope, context);
  const back = (after: Path, result?: Expression) =>
    onReturn(
      { ...after, scope: { ...after.scope, previous: path.scope.previous } },
      result ?? getUndefined(context),
    );
  return letIn(
    bound.definitions,
    translateStatements(getBody(callee), { ...path, scope: bound.scope }, context, {
      next: back,
      exit: back,
      breakTo: undefined,
      continueTo: undefined,
      throwTo: (after, thrown) => onThrow(after, thrown.value),
      yieldTo: undefined,
      awaitTo: undefined,
      inlining: new Set([...frame.inlining, callee]),
    }),
  );
};

// Promise.resolve(value) or Promise.reject(value).
const getPromiseFunction = (node: ts.CallExpression, context: Context) => {
  const callee = node.expression;
  return ts.isPropertyAccessExpression(callee) &&
    getBuiltIn(callee.expression, context) === "Promise" &&
    (callee.name.text === "resolve" || callee.name.text === "reject")
    ? callee.name.text
    : undefined;
};

// A call of a promise's then or catch.
const getPromiseMethod = (node: ts.CallExpression, context: Context) => {
  const callee = node.expression;
  return ts.isPropertyAccessExpression(callee) &&
    (callee.name.text === "then" || callee.name.text === "catch") &&
    isPromiseType(callee.expression, context)
    ? { method: callee.name.text, receiver: getCast(callee.expression) }
    : undefined;
};

// setTimeout(callback), which runs the callback once the jobs before it finish.
const isTimerCall = (node: ts.CallExpression, context: Context) => {
  const symbol = getSymbol(node.expression, context.checker);
  return (
    ts.isIdentifier(node.expression) &&
    node.expression.text === "setTimeout" &&
    (symbol?.declarations ?? []).every(
      (declaration) =>
        declaration.getSourceFile().isDeclarationFile ||
        (ts.isFunctionDeclaration(declaration) && declaration.body === undefined),
    )
  );
};

export const isPromiseConstruction = (
  node: ts.Expression,
  context: Context,
): node is ts.NewExpression =>
  ts.isNewExpression(node) && getBuiltIn(node.expression, context) === "Promise";

// A parameter of an executor that new Promise takes in place: its resolve, or its reject.
const getResolver = (node: ts.Expression, context: Context) => {
  const symbol = ts.isIdentifier(node) ? getSymbol(node, context.checker) : undefined;
  const declaration = symbol?.valueDeclaration;
  if (symbol === undefined || declaration === undefined || !ts.isParameter(declaration)) {
    return undefined;
  }
  const executor = declaration.parent;
  const construction = ts.findAncestor(
    executor.parent,
    (ancestor) => !ts.isParenthesizedExpression(ancestor),
  );
  const position = executor.parameters.indexOf(declaration);
  return (ts.isArrowFunction(executor) || ts.isFunctionExpression(executor)) &&
    construction !== undefined &&
    ts.isNewExpression(construction) &&
    isPromiseConstruction(construction, context) &&
    construction.arguments?.[0] !== undefined &&
    getCast(construction.arguments[0]) === executor &&
    position <= 1
    ? { symbol, isRejecting: position === 1 }
    : undefined;
};

// Calls a promise's resolve or reject, which does nothing once either has run.
const callResolver = (
  node: ts.Node,
  binding: Expression | undefined,
  isRejecting: boolean,
  value: Expression,
  valueNode: ts.Expression | undefined,
  path: Path,
  context: Context,
  continueWith: (path: Path) => Formula,
): Formula => {
  const name = binding === undefined ? undefined : findPromise(path, node, binding);
  if (name === undefined) throw new TlaTypeScriptError("tla-ts can't follow this promise", node);
  const promise = getPromise(path, node, name);
  if (promise.isResolved) return continueWith(path);
  const resolved = setPromise(path, node, name, { ...promise, isResolved: true });
  return isRejecting
    ? continueWith(settle(resolved, node, name, value, true, context))
    : resolve(resolved, node, name, value, valueNode, context, continueWith);
};

// new Promise(executor), which runs the executor with the promise's resolve and reject.
export const translatePromiseConstruction = (
  node: ts.NewExpression,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value?: Expression) => Formula,
): Formula => {
  const argument = node.arguments?.length === 1 ? getCast(node.arguments[0]) : undefined;
  if (
    argument === undefined ||
    !(ts.isArrowFunction(argument) || ts.isFunctionExpression(argument))
  ) {
    throw new TlaTypeScriptError("Pass new Promise a function written in place", node);
  }
  const executor = argument;
  if (
    executor.parameters.length > 2 ||
    executor.parameters.some(
      (parameter) =>
        !ts.isIdentifier(parameter.name) ||
        parameter.initializer !== undefined ||
        parameter.dotDotDotToken !== undefined,
    )
  ) {
    throw new TlaTypeScriptError("Name the executor's resolve and reject", executor);
  }
  // A resolving function that the executor uses as a value, which tla-ts doesn't follow, only
  // calls or passes to then.
  const visit = (current: ts.Node): void => {
    const resolver = ts.isIdentifier(current) ? getResolver(current, context) : undefined;
    const parent = current.parent;
    const isUsed =
      ts.isCallExpression(parent) &&
      (parent.expression === current ||
        (getPromiseMethod(parent, context) !== undefined &&
          parent.arguments.some((argument) => getCast(argument) === current)));
    if (resolver !== undefined && !ts.isParameter(parent) && !isUsed) {
      throw new TlaTypeScriptError("tla-ts can't follow a promise's resolve as a value", current);
    }
    ts.forEachChild(current, visit);
  };
  visit(executor.body);
  return makePromise(path, node, context, (made, name) => {
    const ref = getPromise(made, node, name).ref;
    const back = (after: Path) =>
      continueWith(
        {
          ...after,
          scope: {
            ...after.scope,
            previous: made.scope.previous,
            isCatching: made.scope.isCatching,
            receiver: made.scope.receiver,
          },
        },
        ref,
      );
    const bindings = new Map([
      ...made.scope.bindings,
      ...executor.parameters.flatMap((parameter): [ts.Symbol, Expression][] => {
        const symbol = getSymbol(parameter.name, context.checker);
        return symbol === undefined ? [] : [[symbol, ref]];
      }),
    ]);
    return translateStatements(
      getBody(executor),
      {
        ...made,
        scope: {
          ...made.scope,
          bindings,
          isCatching: true,
          receiver: ts.isArrowFunction(executor) ? made.scope.receiver : undefined,
        },
      },
      context,
      {
        next: back,
        exit: back,
        breakTo: undefined,
        continueTo: undefined,
        throwTo: (after, thrown) =>
          callResolver(node, ref, true, thrown.value, undefined, after, context, back),
        yieldTo: undefined,
        awaitTo: undefined,
        inlining: new Set([...frame.inlining, executor]),
      },
    );
  });
};

export const isPromiseCall = (node: ts.CallExpression, context: Context) =>
  getResolver(node.expression, context) !== undefined ||
  getPromiseFunction(node, context) !== undefined ||
  getPromiseMethod(node, context) !== undefined ||
  isTimerCall(node, context);

// Runs the rest where the built-in functions that a call runs are still where it reads them.
const guardBuiltIns = (
  node: ts.Node,
  owner: "Promise" | "Promise.prototype",
  keys: string[],
  path: Path,
  context: Context,
  rest: Formula,
) => {
  const heap = getHeap(path.scope, node, context);
  const ref = translateBuiltInValue(owner, node, context);
  return keys.reduceRight(
    (inner, key) =>
      ifThenElse(
        key === "constructor"
          ? useJavaScript(
              "SameValue",
              [
                useJavaScript("Get", [heap, ref, string(key)], context),
                translateBuiltInValue("Promise", node, context),
              ],
              context,
            )
          : useJavaScript(
              "HoldsBuiltIn",
              [heap, ref, string(key), string(`${owner}.${key}`)],
              context,
            ),
        inner,
        leaf(
          apply("Assert", [
            boolean(false),
            string(`tla-ts can't call ${owner}.${key} where a script replaced it`),
          ]),
        ),
      ),
    rest,
  );
};

// A call that makes a promise or reacts to one, which gives the promise it makes.
export const translatePromiseCall = (
  node: ts.CallExpression,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value?: Expression) => Formula,
): Formula => {
  const argument = node.arguments.at(0);
  if (node.arguments.some(ts.isSpreadElement)) {
    throw new TlaTypeScriptError("Pass a promise's functions without spreads", node);
  }
  const resolver = getResolver(node.expression, context);
  if (resolver !== undefined) {
    return callResolver(
      node,
      path.scope.bindings.get(resolver.symbol),
      resolver.isRejecting,
      argument === undefined
        ? getUndefined(context)
        : translateExpression(argument, path.scope, context),
      argument,
      path,
      context,
      (after) => continueWith(after, getUndefined(context)),
    );
  }
  if (isTimerCall(node, context)) {
    const delay = node.arguments.at(1);
    if (
      node.arguments.length > 2 ||
      (delay !== undefined && !(ts.isNumericLiteral(delay) && delay.text === "0"))
    ) {
      throw new TlaTypeScriptError("Pass setTimeout only a callback", node);
    }
    const handler = getHandler(argument, path, context, frame);
    if (handler === undefined) throw new TlaTypeScriptError("Pass setTimeout a callback", node);
    const tasks = getTasks(path, node);
    const timer: Job = {
      run: (current, next) =>
        handler.run(
          current,
          getUndefined(context),
          (after) => next(after),
          () => leaf(apply("Assert", [boolean(false), string("A timer threw an exception")])),
        ),
    };
    return continueWith(
      withTasks(path, { ...tasks, timers: [...tasks.timers, timer] }),
      getUndefined(context),
    );
  }
  const promiseFunction = getPromiseFunction(node, context);
  if (promiseFunction !== undefined) {
    const value =
      argument === undefined
        ? getUndefined(context)
        : translateExpression(argument, path.scope, context);
    const make = () =>
      makePromise(path, node, context, (made, name) => {
        const ref = getPromise(made, node, name).ref;
        return promiseFunction === "reject"
          ? continueWith(settle(made, node, name, value, true, context), ref)
          : resolve(made, node, name, value, undefined, context, (resolved) =>
              continueWith(resolved, ref),
            );
      });
    return guardBuiltIns(
      node,
      "Promise",
      [promiseFunction],
      path,
      context,
      promiseFunction === "reject"
        ? make()
        : dispatchPromise(
            path,
            node,
            value,
            argument,
            context,
            (followed) => continueWith(path, getPromise(path, node, followed).ref),
            make,
          ),
    );
  }
  const promiseMethod = getPromiseMethod(node, context);
  if (promiseMethod === undefined) throw new TlaTypeScriptError("Unsupported promise call", node);
  const receiver = promiseMethod.receiver;
  if (isPromiseConstruction(receiver, context) && !path.scope.results.has(receiver)) {
    return translatePromiseConstruction(receiver, path, context, frame, (after, value) =>
      translatePromiseCall(
        node,
        {
          ...after,
          scope: {
            ...after.scope,
            results: new Map([...after.scope.results, [receiver, value ?? getUndefined(context)]]),
          },
        },
        context,
        frame,
        continueWith,
      ),
    );
  }
  if (ts.isCallExpression(receiver) && !path.scope.results.has(receiver)) {
    return translateCallStatement(receiver, path, context, frame, (after, value) =>
      translatePromiseCall(
        node,
        {
          ...after,
          scope: {
            ...after.scope,
            results: new Map([...after.scope.results, [receiver, value ?? getUndefined(context)]]),
          },
        },
        context,
        frame,
        continueWith,
      ),
    );
  }
  const received = translateExpression(receiver, path.scope, context);
  const handlers =
    promiseMethod.method === "then"
      ? [
          getHandler(argument, path, context, frame),
          getHandler(node.arguments.at(1), path, context, frame),
        ]
      : [undefined, getHandler(argument, path, context, frame)];
  const react = (current: Path, name: string) =>
    makePromise(current, node, context, (made, derived) =>
      continueWith(
        addReaction(
          made,
          node,
          name,
          { onFulfilled: handlers[0], onRejected: handlers[1], derived },
          context,
        ),
        getPromise(made, node, derived).ref,
      ),
    );
  return guardBuiltIns(
    node,
    "Promise.prototype",
    promiseMethod.method === "then" ? ["then", "constructor"] : ["catch", "then", "constructor"],
    path,
    context,
    dispatchPromise(
      path,
      node,
      received,
      receiver,
      context,
      (held) => react(path, held),
      () =>
        leaf(apply("Assert", [boolean(false), string("tla-ts can't tell which promise this is")])),
    ),
  );
};

// Runs the jobs that the path queued, in order, and then its timers, each with the jobs it queues.
export const drainTasks = (path: Path, finish: (path: Path) => Formula): Formula => {
  const tasks = path.tasks;
  if (tasks === undefined) return finish(path);
  const job = tasks.jobs.at(0);
  if (job !== undefined) {
    return job.run(withTasks(path, { ...tasks, jobs: tasks.jobs.slice(1) }), (after) =>
      drainTasks(after, finish),
    );
  }
  const timer = tasks.timers.at(0);
  return timer === undefined
    ? finish(path)
    : timer.run(withTasks(path, { ...tasks, timers: tasks.timers.slice(1) }), (after) =>
        drainTasks(after, finish),
      );
};

// The promise that an await follows: the promise it awaits, or one that the value fulfills.
const awaitValue = (
  path: Path,
  node: ts.Node,
  value: Expression,
  valueNode: ts.Expression | undefined,
  context: Context,
  continueWith: (path: Path, name: string) => Formula,
): Formula =>
  dispatchPromise(
    path,
    node,
    value,
    valueNode,
    context,
    (followed) =>
      guardBuiltIns(
        node,
        "Promise.prototype",
        ["constructor"],
        path,
        context,
        continueWith(path, followed),
      ),
    () =>
      makePromise(path, node, context, (made, name) =>
        resolve(made, node, name, value, undefined, context, (resolved) =>
          continueWith(resolved, name),
        ),
      ),
  );

// A call of an async function, which runs the body until it awaits and gives the promise that the
// body settles once it returns or throws. The body leaves to the code that last ran it: the call,
// and then the job that resumed it once a promise it awaited settled.
export const translateAsyncCall = (
  node: ts.CallExpression,
  callee: FunctionNode,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value?: Expression) => Formula,
): Formula =>
  makePromise(path, node, context, (made, name) => {
    const ref = getPromise(made, node, name).ref;
    const captured = getLocalCaptures(callee, context);
    const isOuter = (symbol: ts.Symbol) =>
      !(symbol.declarations ?? []).some(
        (declaration) =>
          ts.findAncestor(declaration, (ancestor) => ancestor === callee) !== undefined,
      );
    const setCaller = (current: Path, caller: Caller) => {
      const tasks = getTasks(current, node);
      return withTasks(current, {
        ...tasks,
        callers: new Map([...tasks.callers, [name, caller]]),
      });
    };
    const getCaller = (current: Path) => {
      const caller = getTasks(current, node).callers.get(name);
      if (caller === undefined) throw new TlaTypeScriptError("Unsupported async call", node);
      return caller;
    };
    const rejectFrame: Frame = {
      ...frame,
      throwTo: (current, thrown) =>
        continueWith(settle(current, node, name, thrown.value, true, context), ref),
    };
    const catching = { ...made, scope: { ...made.scope, isCatching: true } };
    return bindCall(
      node,
      callee,
      node.arguments,
      undefined,
      catching,
      context,
      rejectFrame,
      (bound, inner) => {
        // The heap changes as the body awaits, which makes promises.
        const changed = [
          ...new Set([
            ...getChanged(callee, inner, context),
            ...(context.heap === undefined ? [] : [context.heap]),
          ]),
        ];
        const leave = (current: Path) => {
          const caller = getCaller(current);
          return { caller, left: leaveBody(current, caller.path, changed, isOuter) };
        };
        const finish = (current: Path, value: Expression, isThrown: boolean) => {
          const left = leave(current);
          return isThrown
            ? left.caller.resume(settle(left.left, node, name, value, true, context))
            : resolve(left.left, node, name, value, undefined, context, left.caller.resume);
        };
        const bodyFrame: Frame = {
          next: (current) => finish(current, getUndefined(context), false),
          exit: (current, value) => finish(current, value ?? getUndefined(context), false),
          breakTo: undefined,
          continueTo: undefined,
          throwTo: (current, thrown) => finish(current, thrown.value, true),
          yieldTo: undefined,
          awaitTo: (current, value, operand, onFulfilled, onRejected) => {
            const left = leave(current);
            const resumeWith = (
              onSettled: (path: Path, value: Expression) => Formula,
            ): Handler => ({
              run: (resumer, settled, onReturn) =>
                onSettled(
                  setCaller(
                    enterBody(
                      resumer,
                      current,
                      (symbol) => isOuter(symbol) && !captured.has(symbol),
                    ),
                    { path: resumer, resume: (after) => onReturn(after, getUndefined(context)) },
                  ),
                  settled,
                ),
            });
            return awaitValue(left.left, node, value, operand, context, (awaited, awaitedName) =>
              left.caller.resume(
                addReaction(
                  awaited,
                  node,
                  awaitedName,
                  {
                    onFulfilled: resumeWith(onFulfilled),
                    onRejected: resumeWith(onRejected),
                    derived: undefined,
                  },
                  context,
                ),
              ),
            );
          },
          inlining: new Set([...frame.inlining, callee]),
        };
        return letIn(
          bound.definitions,
          translateStatements(
            getBody(callee),
            setCaller(
              { ...inner, scope: bound.scope },
              { path: made, resume: (after) => continueWith(after, ref) },
            ),
            context,
            bodyFrame,
          ),
        );
      },
    );
  });
