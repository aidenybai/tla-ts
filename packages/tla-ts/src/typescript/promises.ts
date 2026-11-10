import ts from "@typescript/typescript6";
import type { Expression } from "../ast";
import {
  bindOnce,
  type Frame,
  getBody,
  getCallback,
  getCast,
  isSameExpression,
  type Path,
  translateCallStatement,
  translateStatements,
} from "./actions";
import { type Context, type FunctionNode, getSymbol, getUndefined } from "./context";
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
}

interface Job {
  run: (path: Path, next: (path: Path) => Formula) => Formula;
}

interface TrackedPromise {
  ref: Expression;
  state: "pending" | "fulfilled" | "rejected";
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

export const EMPTY_TASKS: Tasks = { jobs: [], timers: [], promises: new Map() };

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
          : resolve(current, node, derived, result, context, next);
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

// Resolves a promise with a value: a promise that tla-ts follows, which the promise then follows
// a job later, or a value that it fulfills the promise with. tla-ts doesn't call the then of an
// object that isn't a promise.
const resolve = (
  path: Path,
  node: ts.Node,
  name: string,
  value: Expression,
  context: Context,
  continueWith: (path: Path) => Formula,
): Formula => {
  const followed = findPromise(path, node, value);
  if (followed === name) {
    return leaf(
      apply("Assert", [
        boolean(false),
        string("tla-ts can't throw the TypeError of resolving a promise with itself"),
      ]),
    );
  }
  if (followed !== undefined) {
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
  }
  return ifThenElse(
    useJavaScript("IsThenable", [getHeap(path.scope, node, context), value], context),
    leaf(
      apply("Assert", [
        boolean(false),
        string("tla-ts can't resolve a promise with an object that has a then"),
      ]),
    ),
    continueWith(settle(path, node, name, value, false, context)),
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
  const callee = getCallback(cast, path, context);
  if (callee === undefined) {
    throw new TlaTypeScriptError("Pass then a function that tla-ts can follow", node);
  }
  return {
    run: (current, value, onReturn, onThrow) =>
      callHandler(callee, value, current, context, frame, onReturn, onThrow),
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
      inlining: new Set([...frame.inlining, callee]),
    }),
  );
};

const isPromiseType = (node: ts.Expression, context: Context) =>
  context.checker.getTypeAtLocation(node).getSymbol()?.name === "Promise";

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

export const isPromiseCall = (node: ts.CallExpression, context: Context) =>
  getPromiseFunction(node, context) !== undefined ||
  getPromiseMethod(node, context) !== undefined ||
  isTimerCall(node, context);

// Runs the rest where the built-in functions that a call runs are still where it reads them.
const guardBuiltIns = (
  node: ts.CallExpression,
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
    const followed = promiseFunction === "resolve" ? findPromise(path, node, value) : undefined;
    return guardBuiltIns(
      node,
      "Promise",
      [promiseFunction],
      path,
      context,
      followed !== undefined
        ? continueWith(path, getPromise(path, node, followed).ref)
        : makePromise(path, node, context, (made, name) => {
            const ref = getPromise(made, node, name).ref;
            return promiseFunction === "reject"
              ? continueWith(settle(made, node, name, value, true, context), ref)
              : resolve(made, node, name, value, context, (resolved) =>
                  continueWith(resolved, ref),
                );
          }),
    );
  }
  const promiseMethod = getPromiseMethod(node, context);
  if (promiseMethod === undefined) throw new TlaTypeScriptError("Unsupported promise call", node);
  const receiver = promiseMethod.receiver;
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
  const held = findPromise(path, node, received);
  return guardBuiltIns(
    node,
    "Promise.prototype",
    promiseMethod.method === "then" ? ["then", "constructor"] : ["catch", "then", "constructor"],
    path,
    context,
    held !== undefined
      ? react(path, held)
      : // A promise that a variable holds, which may be any that the path follows.
        [...getTasks(path, node).promises].reduceRight(
          (rest, entry) =>
            ifThenElse(apply("=", [received, entry[1].ref]), react(path, entry[0]), rest),
          leaf(
            apply("Assert", [boolean(false), string("tla-ts can't tell which promise this is")]),
          ),
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
