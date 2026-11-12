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
  allocate,
  getAsyncCallee,
  getCallback,
  getCast,
  inlineValues,
  isSameExpression,
  type Path,
  runLeadingCall,
  throwError,
  translateCallStatement,
  translateStatements,
} from "./actions";
import {
  type Context,
  type FunctionNode,
  findNodes,
  getLocalCaptures,
  getParameters,
  getSymbol,
  getUndefined,
  isAsyncFunction,
} from "./context";
import { getCallbackReceiver } from "./collections";
import { TlaTypeScriptError } from "../errors";
import { translateEngineError } from "./exceptions";
import { translateExpression } from "./expressions";
import { type Formula, ifThenElse, leaf, letIn } from "./formula";
import { getCandidateValue, getHeap, translateFunctionValue } from "./heap";
import { getBuiltIn, translateBuiltInValue } from "./intrinsics";
import { useJavaScript } from "./javascript";
import { type Bound, bindValues, type Receiver } from "./scope";
import {
  apply,
  boolean,
  define,
  identifier,
  index,
  junction,
  not,
  number,
  string,
  tuple,
} from "./tla";

// The jobs and timers that a script queues, and the promises it makes, which tla-ts follows as it
// compiles, as JavaScript runs each job once the script and the jobs before it finish.
export interface Tasks {
  jobs: readonly Job[];
  timers: readonly Job[];
  promises: ReadonlyMap<string, TrackedPromise>;
  // The code that last ran each async function's body, by the body's promise, which the body
  // leaves to when it awaits or finishes: the call, and then the job that resumed it.
  callers: ReadonlyMap<string, Caller>;
  // What the executor that NewPromiseCapability passes a script's constructor took, by the
  // executor's parameter, while the constructor's body runs.
  capabilities: ReadonlyMap<ts.Symbol, { resolve: Expression; reject: Expression }>;
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
  // The functions that new Promise passes its executor.
  resolvers: { resolve: Expression; reject: Expression } | undefined;
  // The functions that a job passes a thenable's then, each pair with whether it ran.
  thenResolvers: readonly ThenResolvers[];
  value: Expression | undefined;
  reactions: readonly Reaction[];
  // Whether code has given it a reaction, as a then, a catch, or an await does.
  isHandled: boolean;
  // What the body of an async generator yielded or returned, for the promise of a request to it.
  iteration: { value: Expression; isDone: boolean } | undefined;
  // The values that the promise of Promise.all has so far, and how many it waits for.
  combined: { values: readonly Expression[]; remaining: number } | undefined;
}

interface ThenResolvers {
  resolve: Expression;
  reject: Expression;
  isResolved: boolean;
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

export const EMPTY_TASKS: Tasks = {
  jobs: [],
  timers: [],
  promises: new Map(),
  callers: new Map(),
  capabilities: new Map(),
};

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
  const heap = getHeap(path.scope, node, context);
  const thenName = context.names.getFresh("then");
  const candidates = getThenFunctions(node, valueNode, context);
  // Each thenable that a job follows may give another.
  const pairs = [...getTasks(path, node).promises.values()].reduce(
    (count, promise) => count + promise.thenResolvers.length,
    0,
  );
  const runsThen = valueNode !== undefined && hasCallableThen(valueNode, context);
  const callThen = () =>
    pairs >= MAX_THEN_PAIRS
      ? leaf(apply("Assert", [boolean(false), string("tla-ts can't follow this many thenables")]))
      : bindOnce(
          path,
          thenName,
          useJavaScript("Get", [heap, value, string("then")], context),
          continueWith(
            enqueue(path, node, {
              run: (current, next) =>
                runThen(
                  current,
                  node,
                  name,
                  value,
                  identifier(thenName),
                  candidates,
                  context,
                  next,
                ),
            }),
          ),
        );
  const cannotThen = leaf(
    apply("Assert", [
      boolean(false),
      string("tla-ts can't resolve a promise with an object that has a then"),
    ]),
  );
  return dispatchPromise(path, node, value, valueNode, context, follow, () =>
    ifThenElse(
      useJavaScript(
        "IsThenable",
        [
          heap,
          value,
          translateBuiltInValue("Array.prototype", node, context),
          translateBuiltInValue("Object.prototype", node, context),
        ],
        context,
      ),
      runsThen
        ? ifThenElse(
            useJavaScript("HasCallableThen", [heap, value], context),
            callThen(),
            cannotThen,
          )
        : cannotThen,
      runsThen
        ? leaf(
            apply("Assert", [
              boolean(false),
              string("tla-ts can't resolve a promise with a value whose type has a then it lacks"),
            ]),
          )
        : continueWith(settle(path, node, name, value, false, context)),
    ),
  );
};

const isThenName = (name: ts.PropertyName) =>
  (ts.isIdentifier(name) || ts.isStringLiteral(name)) && name.text === "then";

// Whether TypeScript types a value with a then that it can call, which a job then calls where the
// value resolves a promise. tla-ts follows a value of another type as one without a then.
const hasCallableThen = (valueNode: ts.Expression, context: Context) => {
  const then = context.checker.getTypeAtLocation(valueNode).getProperty("then");
  if (then === undefined || (then.flags & ts.SymbolFlags.Optional) !== 0) return false;
  const type = context.checker.getTypeOfSymbolAtLocation(then, valueNode);
  return (type.isUnion() ? type.types : [type]).every(
    (member) => member.getCallSignatures().length > 0,
  );
};

const MAX_THEN_PAIRS = 8;

// A function that an object literal gives as its then, which a promise that the object resolves
// calls with the promise's resolve and reject.
const isThenFunction = (node: ts.Node): node is FunctionNode =>
  ((ts.isFunctionExpression(node) || ts.isArrowFunction(node)) &&
    ts.isPropertyAssignment(node.parent) &&
    node.parent.initializer === node &&
    ts.isObjectLiteralExpression(node.parent.parent) &&
    isThenName(node.parent.name)) ||
  (ts.isMethodDeclaration(node) &&
    node.body !== undefined &&
    ts.isObjectLiteralExpression(node.parent) &&
    isThenName(node.name));

const thenFunctions = new WeakMap<ts.SourceFile, readonly FunctionNode[]>();

// The thens that a value may have: those of the object literals that its type names, or else any
// in the file.
const getThenFunctions = (
  node: ts.Node,
  valueNode: ts.Expression | undefined,
  context: Context,
) => {
  const sourceFile = node.getSourceFile();
  const all = thenFunctions.get(sourceFile) ?? findNodes(sourceFile, isThenFunction);
  thenFunctions.set(sourceFile, all);
  if (valueNode === undefined) return all;
  const type = context.checker.getTypeAtLocation(valueNode);
  const literals = (type.isUnion() ? type.types : [type]).map(
    (member) => member.getSymbol()?.valueDeclaration,
  );
  return literals.every((literal) => literal !== undefined && ts.isObjectLiteralExpression(literal))
    ? all.filter((candidate) =>
        literals.some(
          (literal) =>
            literal ===
            (ts.isMethodDeclaration(candidate) ? candidate.parent : candidate.parent.parent),
        ),
      )
    : all;
};

// The job that calls a thenable's then with a new resolve and reject of the promise, which run
// once between them, and reject the promise where the then throws first.
const runThen = (
  path: Path,
  node: ts.Node,
  name: string,
  thenable: Expression,
  then: Expression,
  candidates: readonly FunctionNode[],
  context: Context,
  next: (path: Path) => Formula,
): Formula => {
  const resolvingFunction = useJavaScript(
    "ArrowObject",
    [translateBuiltInValue("Function.prototype", node, context), string(""), number(1)],
    context,
  );
  return allocateObject(path, node, context, resolvingFunction, (withResolve, resolveRef) =>
    allocateObject(withResolve, node, context, resolvingFunction, (withReject, rejectRef) => {
      const promise = getPromise(withReject, node, name);
      const start = setPromise(withReject, node, name, {
        ...promise,
        thenResolvers: [
          ...promise.thenResolvers,
          { resolve: resolveRef, reject: rejectRef, isResolved: false },
        ],
      });
      const code = useJavaScript("CodeOf", [getHeap(start.scope, node, context), then], context);
      return candidates.reduceRight(
        (otherwise, candidate) => {
          const parameters = candidate.parameters;
          if (
            parameters.length > 2 ||
            parameters.some(
              (parameter) =>
                !ts.isIdentifier(parameter.name) ||
                parameter.initializer !== undefined ||
                parameter.dotDotDotToken !== undefined,
            ) ||
            getLocalCaptures(candidate, context).size > 0 ||
            (ts.isArrowFunction(candidate) &&
              ts.findAncestor(candidate.parent, ts.isFunctionLike) !== undefined)
          ) {
            return otherwise;
          }
          const candidateValue = getCandidateValue(candidate, context);
          if (candidateValue === undefined) return otherwise;
          const back = (after: Path) =>
            next({
              ...after,
              scope: {
                ...after.scope,
                previous: start.scope.previous,
                isCatching: start.scope.isCatching,
                receiver: start.scope.receiver,
              },
            });
          const bindings = new Map([
            ...start.scope.bindings,
            ...parameters.flatMap((parameter, position): [ts.Symbol, Expression][] => {
              const symbol = getSymbol(parameter.name, context.checker);
              return symbol === undefined
                ? []
                : [[symbol, position === 0 ? resolveRef : rejectRef]];
            }),
          ]);
          return ifThenElse(
            apply("=", [code, candidateValue]),
            translateStatements(
              getBody(candidate),
              {
                ...start,
                scope: {
                  ...start.scope,
                  bindings,
                  isCatching: true,
                  receiver: ts.isArrowFunction(candidate)
                    ? undefined
                    : { value: thenable, method: candidate },
                },
              },
              context,
              {
                next: back,
                exit: back,
                breakTo: undefined,
                continueTo: undefined,
                throwTo: (after, thrown) =>
                  callResolver(node, rejectRef, thrown.value, undefined, after, context, back),
                yieldTo: undefined,
                awaitTo: undefined,
                inlining: new Set([candidate]),
              },
            ),
            otherwise,
          );
        },
        leaf(
          apply("Assert", [
            boolean(false),
            string("tla-ts can't tell which then this thenable has"),
          ]),
        ),
      );
    }),
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
      isHandled: true,
    });
  }
  return enqueue(
    setPromise(path, node, name, { ...promise, isHandled: true }),
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

// Puts an object on the heap, which the path then holds.
const allocateObject = (
  path: Path,
  node: ts.Node,
  context: Context,
  object: Expression,
  continueWith: (path: Path, ref: Expression, name: string) => Formula,
) => {
  const heapSymbol = context.heap;
  if (heapSymbol === undefined) throw new TlaTypeScriptError("Use promises only in scripts", node);
  const name = context.names.getFresh("promise");
  return bindOnce(
    path,
    name,
    useJavaScript("Allocate", [getHeap(path.scope, node, context), object], context),
    continueWith(
      {
        ...path,
        scope: {
          ...path.scope,
          bindings: new Map([...path.scope.bindings, [heapSymbol, identifier(name)]]),
        },
      },
      useJavaScript("Allocated", [identifier(name)], context),
      name,
    ),
  );
};

// Makes a pending promise on the heap.
const makePromise = (
  path: Path,
  node: ts.Node,
  context: Context,
  continueWith: (path: Path, name: string) => Formula,
) =>
  allocateObject(path, node, context, identifier("PromiseObject"), (made, ref, name) =>
    continueWith(
      setPromise(made, node, name, {
        ref,
        state: "pending",
        isResolved: false,
        resolvers: undefined,
        thenResolvers: [],
        value: undefined,
        reactions: [],
        isHandled: false,
        iteration: undefined,
        combined: undefined,
      }),
      name,
    ),
  );

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
  if (isResolver(cast, context)) {
    const callee = translateExpression(cast, path.scope, context);
    return {
      run: (current, value, onReturn) =>
        callResolver(node, callee, value, undefined, current, context, (after) =>
          onReturn(after, getUndefined(context)),
        ),
    };
  }
  const callee = getCallback(cast, path, context) ?? getAsyncCallee(cast, path, context);
  if (callee === undefined) {
    throw new TlaTypeScriptError("Pass then a function that tla-ts can follow", node);
  }
  const runCallback = getCallbackRunner(
    callee,
    ts.isArrowFunction(callee) ? path.scope.receiver : undefined,
    path,
    context,
    frame,
  );
  return {
    run: (current, value, onReturn, onThrow) => runCallback(current, [value], onReturn, onThrow),
  };
};

// Runs a callback in a later job, where the variables it captures hold what they held where the
// script passed it.
const getCallbackRunner =
  (
    callee: FunctionNode,
    receiver: Receiver | undefined,
    path: Path,
    context: Context,
    frame: Frame,
  ) =>
  (
    current: Path,
    values: Expression[],
    onReturn: (path: Path, result: Expression) => Formula,
    onThrow: (path: Path, thrown: Expression) => Formula,
  ) => {
    const captured = getLocalCaptures(callee, context);
    const keep = <Value>(runtime: Map<ts.Symbol, Value>, kept: Map<ts.Symbol, Value>) =>
      new Map([...runtime, ...[...kept].filter((entry) => captured.has(entry[0]))]);
    const kept = {
      ...current,
      scope: {
        ...current.scope,
        bindings: keep(current.scope.bindings, path.scope.bindings),
        functions: keep(current.scope.functions, path.scope.functions),
      },
    };
    const callbackFrame: Frame = {
      ...frame,
      throwTo: (after, thrown) => onThrow(after, thrown.value),
    };
    const back = (after: Path, result?: Expression) =>
      onReturn(after, result ?? getUndefined(context));
    // An async callback gives the promise of its body, which settles as the body returns or throws.
    return isAsyncFunction(callee)
      ? runAsyncBody(
          callee,
          callee,
          kept,
          context,
          callbackFrame,
          (made, _rejectFrame, bindWith) => {
            const bound = bindValues(getParameters(callee), values, made.scope, context);
            return bindWith({ ...bound, scope: { ...bound.scope, receiver } }, made);
          },
          back,
        )
      : inlineValues(callee, values, receiver, kept, context, callbackFrame, back);
  };

// Array.fromAsync of an array written in place, which reads the elements through an
// async-from-sync iterator: each element takes a job to settle the iterator's result and another
// to await it, as does the end. A mapping function's result takes a job to await, and a throw
// from it or a rejection of it another, to await the iterator's return.
const translateFromAsync = (
  node: ts.CallExpression,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value?: Expression) => Formula,
): Formula => {
  const argument = node.arguments.at(0);
  const elements = argument && getCast(argument);
  const mapping = node.arguments.at(1);
  const callee =
    mapping &&
    (getCallback(getCast(mapping), path, context) ??
      getAsyncCallee(getCast(mapping), path, context));
  if (
    elements === undefined ||
    !ts.isArrayLiteralExpression(elements) ||
    elements.elements.some(ts.isSpreadElement) ||
    (mapping !== undefined && callee === undefined)
  ) {
    throw new TlaTypeScriptError(
      "Pass Array.fromAsync an array written in place and a function that tla-ts can follow",
      node,
    );
  }
  const ran = runLeadingCall(elements, path, context, frame, (after) =>
    translateFromAsync(node, after, context, frame, continueWith),
  );
  if (ran !== undefined) return ran;
  const sequence = context.names.getFresh("sequence");
  return allocate(elements, path, context, (allocated) =>
    makePromise(allocated, node, context, (made, name) => {
      const runMapping =
        mapping === undefined || callee === undefined
          ? undefined
          : getCallbackRunner(
              callee,
              getCallbackReceiver(mapping, callee, made.scope, context),
              made,
              context,
              frame,
            );
      const tick = (
        current: Path,
        next: (path: Path, onReturn: (path: Path) => Formula) => Formula,
        exit: (path: Path) => Formula,
      ) =>
        awaitIn(
          current,
          node,
          getUndefined(context),
          undefined,
          context,
          (resumer, _settled, _isRejected, onReturn) => next(resumer, onReturn),
          exit,
        );
      const reject = (current: Path, reason: Expression, exit: (path: Path) => Formula) =>
        tick(
          current,
          (closed, onReturn) => onReturn(settle(closed, node, name, reason, true, context)),
          exit,
        );
      const take = (
        current: Path,
        position: number,
        values: Expression[],
        exit: (path: Path) => Formula,
      ): Formula => {
        const isDone = position === elements.elements.length;
        const element = elements.elements[position];
        return awaitIn(
          current,
          node,
          isDone ? getUndefined(context) : index(identifier(sequence), [number(position + 1)]),
          isDone || ts.isOmittedExpression(element) ? undefined : element,
          context,
          (resumer, settled, isRejected, onReturn) =>
            tick(
              resumer,
              (resumed, back) =>
                isRejected
                  ? back(settle(resumed, node, name, settled, true, context))
                  : isDone
                    ? resolve(resumed, node, name, tuple(values), undefined, context, back)
                    : runMapping === undefined
                      ? take(resumed, position + 1, [...values, settled], back)
                      : runMapping(
                          resumed,
                          [settled, number(position)],
                          (mapped, result) =>
                            awaitIn(
                              mapped,
                              node,
                              result,
                              undefined,
                              context,
                              (awaited, value, isMappedRejected, onAwaited) =>
                                isMappedRejected
                                  ? reject(awaited, value, onAwaited)
                                  : take(awaited, position + 1, [...values, value], onAwaited),
                              back,
                            ),
                          (thrown, reason) => reject(thrown, reason, back),
                        ),
              onReturn,
            ),
          exit,
        );
      };
      const heap = getHeap(made.scope, node, context);
      const prototype = translateBuiltInValue("Array.prototype", node, context);
      return letIn(
        [define(sequence, [], translateExpression(elements, made.scope, context))],
        ifThenElse(
          junction("And", [
            useJavaScript(
              "HoldsBuiltIn",
              [
                heap,
                translateBuiltInValue("Array", node, context),
                string("fromAsync"),
                string("Array.fromAsync"),
              ],
              context,
            ),
            useJavaScript(
              "HoldsBuiltIn",
              [
                heap,
                prototype,
                useJavaScript("WellKnownSymbol", [string("iterator")], context),
                string("Array.prototype.values"),
              ],
              context,
            ),
            not(
              useJavaScript(
                "Has",
                [
                  heap,
                  prototype,
                  useJavaScript("WellKnownSymbol", [string("asyncIterator")], context),
                ],
                context,
              ),
            ),
          ]),
          take(made, 0, [], (after) => continueWith(after, getPromise(after, node, name).ref)),
          leaf(
            apply("Assert", [
              boolean(false),
              string("tla-ts can't run Array.fromAsync where a script changed what it reads"),
            ]),
          ),
        ),
      );
    }),
  );
};

const isFromAsync = (node: ts.CallExpression, context: Context) =>
  ts.isPropertyAccessExpression(node.expression) &&
  node.expression.name.text === "fromAsync" &&
  getBuiltIn(node.expression.expression, context) === "Array";

// Promise.resolve(value), Promise.reject(value), or a combinator such as Promise.all(values).
const getPromiseFunction = (node: ts.CallExpression, context: Context) => {
  const callee = node.expression;
  return ts.isPropertyAccessExpression(callee) &&
    getBuiltIn(callee.expression, context) === "Promise" &&
    ["resolve", "reject", ...COMBINATORS].includes(callee.name.text)
    ? callee.name.text
    : undefined;
};

const COMBINATORS = ["all", "allSettled", "any", "race"];

// A combinator of an array written in place, which follows the promises that PromiseResolve gives
// for the elements. Promise.all fulfills with their values once each fulfills, or rejects with the
// first reason. Promise.allSettled fulfills with an object for each once all settle. Promise.any
// fulfills with the first value, or rejects with an AggregateError of the reasons once each
// rejects. Promise.race settles as the first does.
const translatePromiseCombinator = (
  node: ts.CallExpression,
  combinator: string,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value?: Expression) => Formula,
): Formula => {
  const argument = node.arguments.at(0);
  const elements = argument && getCast(argument);
  if (
    node.arguments.length !== 1 ||
    elements === undefined ||
    !ts.isArrayLiteralExpression(elements) ||
    elements.elements.some(
      (element) => ts.isSpreadElement(element) || ts.isOmittedExpression(element),
    )
  ) {
    throw new TlaTypeScriptError(`Pass Promise.${combinator} an array written in place`, node);
  }
  const ran = runLeadingCall(elements, path, context, frame, (after) =>
    translatePromiseCombinator(node, combinator, after, context, frame, continueWith),
  );
  if (ran !== undefined) return ran;
  return makePromise(path, node, context, (made, name) => {
    const count = elements.elements.length;
    // Takes an element's value, or none at the end, and fulfills the promise once none remain.
    const take = (
      current: Path,
      position: number | undefined,
      value: Expression,
      next: (path: Path) => Formula,
    ) => {
      const promise = getPromise(current, node, name);
      const combined = promise.combined;
      if (combined === undefined) {
        throw new TlaTypeScriptError(`Unsupported Promise.${combinator}`, node);
      }
      const values = combined.values.map((other, index) => (index === position ? value : other));
      const remaining = combined.remaining - 1;
      const taken = setPromise(current, node, name, {
        ...promise,
        combined: { values, remaining },
      });
      return remaining > 0
        ? next(taken)
        : combinator === "any"
          ? next(
              promise.isResolved
                ? taken
                : settle(
                    taken,
                    node,
                    name,
                    translateEngineError("AggregateError", node, context, tuple(values)),
                    true,
                    context,
                  ),
            )
          : resolve(taken, node, name, tuple(values), undefined, context, next);
    };
    // Resolves or rejects the promise once, as Promise.race does with each element's value.
    const settleOnce =
      (isRejected: boolean): Handler["run"] =>
      (current, value, onReturn) => {
        const promise = getPromise(current, node, name);
        const back = (after: Path) => onReturn(after, getUndefined(context));
        if (promise.isResolved) return back(current);
        const resolved = setPromise(current, node, name, { ...promise, isResolved: true });
        return isRejected
          ? back(settle(resolved, node, name, value, true, context))
          : resolve(resolved, node, name, value, undefined, context, back);
      };
    // The object that Promise.allSettled gives for a promise that settles.
    const takeSettled =
      (position: number, field: "value" | "reason", status: string): Handler["run"] =>
      (current, value, onReturn) => {
        const define = (object: Expression, key: string, defined: Expression) =>
          useJavaScript(
            "Define",
            [object, string(key), defined, boolean(true), boolean(true), boolean(true)],
            context,
          );
        const object = define(
          define(identifier("EmptyObject"), "status", string(status)),
          field,
          value,
        );
        return allocateObject(current, node, context, object, (allocated, ref) =>
          take(allocated, position, ref, (after) => onReturn(after, getUndefined(context))),
        );
      };
    const takeValue =
      (position: number): Handler["run"] =>
      (current, value, onReturn) =>
        take(current, position, value, (after) => onReturn(after, getUndefined(context)));
    const getReaction = (position: number): Reaction => ({
      onFulfilled: {
        run:
          combinator === "allSettled"
            ? takeSettled(position, "value", "fulfilled")
            : combinator === "race" || combinator === "any"
              ? settleOnce(false)
              : takeValue(position),
      },
      onRejected: {
        run:
          combinator === "allSettled"
            ? takeSettled(position, "reason", "rejected")
            : combinator === "any"
              ? takeValue(position)
              : settleOnce(true),
      },
      derived: undefined,
    });
    const follow = (current: Path, position: number): Formula => {
      if (position === count && combinator === "race") {
        return continueWith(current, getPromise(current, node, name).ref);
      }
      if (position === count) {
        return take(current, undefined, getUndefined(context), (after) =>
          continueWith(after, getPromise(after, node, name).ref),
        );
      }
      const element = elements.elements[position];
      const value = translateExpression(element, current.scope, context);
      const next = (after: Path, followed: string) =>
        follow(addReaction(after, node, followed, getReaction(position), context), position + 1);
      return dispatchPromise(
        current,
        node,
        value,
        element,
        context,
        (followed) =>
          guardBuiltIns(
            node,
            "Promise.prototype",
            ["constructor"],
            current,
            context,
            next(current, followed),
          ),
        () =>
          makePromise(current, node, context, (wrapped, wrapper) =>
            resolve(wrapped, node, wrapper, value, element, context, (resolved) =>
              next(resolved, wrapper),
            ),
          ),
      );
    };
    const start = setPromise(made, node, name, {
      ...getPromise(made, node, name),
      combined: {
        values: elements.elements.map(() => getUndefined(context)),
        remaining: count + 1,
      },
    });
    return guardBuiltIns(
      node,
      "Promise",
      [combinator, "resolve"],
      start,
      context,
      guardBuiltIns(node, "Promise.prototype", ["then"], start, context, follow(start, 0)),
    );
  });
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

// Whether a node is a parameter of an executor that new Promise takes in place, which names the
// promise's resolve or reject.
const isResolverParameter = (node: ts.Node, context: Context) => {
  if (!ts.isParameter(node)) return false;
  const executor = node.parent;
  const construction = ts.findAncestor(
    executor.parent,
    (ancestor) => !ts.isParenthesizedExpression(ancestor),
  );
  return (
    executor.parameters.indexOf(node) <= 1 &&
    (isThenFunction(executor) ||
      ((ts.isArrowFunction(executor) || ts.isFunctionExpression(executor)) &&
        construction !== undefined &&
        ts.isNewExpression(construction) &&
        isPromiseConstruction(construction, context) &&
        construction.arguments?.[0] !== undefined &&
        getCast(construction.arguments[0]) === executor))
  );
};

// The variables that a script assigns an executor's resolve or reject.
const resolverHolders = new WeakMap<ts.SourceFile, ReadonlySet<ts.Symbol>>();

const getResolverHolders = (sourceFile: ts.SourceFile, context: Context) => {
  const known = resolverHolders.get(sourceFile);
  if (known !== undefined) return known;
  const holders = new Set<ts.Symbol>();
  const isParameterValue = (node: ts.Expression | undefined) => {
    const declaration =
      node === undefined ? undefined : getSymbol(getCast(node), context.checker)?.valueDeclaration;
    return declaration !== undefined && isResolverParameter(declaration, context);
  };
  const visit = (node: ts.Node): void => {
    const held =
      ts.isBinaryExpression(node) &&
      node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      isParameterValue(node.right)
        ? node.left
        : ts.isVariableDeclaration(node) && isParameterValue(node.initializer)
          ? node.name
          : undefined;
    const symbol = held && getSymbol(held, context.checker);
    if (symbol !== undefined) holders.add(symbol);
    ts.forEachChild(node, visit);
  };
  visit(sourceFile);
  resolverHolders.set(sourceFile, holders);
  return holders;
};

// Whether a function that a node names may be a promise's resolve or reject: a parameter of an
// executor, or a variable that the script assigns one.
const isResolver = (node: ts.Expression, context: Context) => {
  const cast = getCast(node);
  const symbol = ts.isIdentifier(cast) ? getSymbol(cast, context.checker) : undefined;
  const declaration = symbol?.valueDeclaration;
  return (
    symbol !== undefined &&
    ((declaration !== undefined && isResolverParameter(declaration, context)) ||
      getResolverHolders(cast.getSourceFile(), context).has(symbol))
  );
};

// Calls a promise's resolve or reject, which does nothing once either has run. The callee may be
// any resolving function that the path follows.
const callResolver = (
  node: ts.Node,
  callee: Expression,
  value: Expression,
  valueNode: ts.Expression | undefined,
  path: Path,
  context: Context,
  continueWith: (path: Path) => Formula,
): Formula => {
  const run = (name: string, isRejecting: boolean) => {
    const promise = getPromise(path, node, name);
    if (promise.isResolved) return continueWith(path);
    const resolved = setPromise(path, node, name, { ...promise, isResolved: true });
    return isRejecting
      ? continueWith(settle(resolved, node, name, value, true, context))
      : resolve(resolved, node, name, value, valueNode, context, continueWith);
  };
  const resolvers = [...getTasks(path, node).promises].flatMap((entry) => {
    const functions = entry[1].resolvers;
    return functions === undefined
      ? []
      : [
          { name: entry[0], ref: functions.resolve, isRejecting: false },
          { name: entry[0], ref: functions.reject, isRejecting: true },
        ];
  });
  // A pair that a thenable's then took runs once, apart from the promise's own.
  const runThen = (name: string, position: number, isRejecting: boolean) => {
    const promise = getPromise(path, node, name);
    const pair = promise.thenResolvers[position];
    if (pair.isResolved) return continueWith(path);
    const resolved = setPromise(path, node, name, {
      ...promise,
      thenResolvers: promise.thenResolvers.map((other, index) =>
        index === position ? { ...other, isResolved: true } : other,
      ),
    });
    return isRejecting
      ? continueWith(settle(resolved, node, name, value, true, context))
      : resolve(resolved, node, name, value, valueNode, context, continueWith);
  };
  const all = [
    ...resolvers.map((resolver) => ({
      ref: resolver.ref,
      run: () => run(resolver.name, resolver.isRejecting),
    })),
    ...[...getTasks(path, node).promises].flatMap((entry) =>
      entry[1].thenResolvers.flatMap((pair, position) => [
        { ref: pair.resolve, run: () => runThen(entry[0], position, false) },
        { ref: pair.reject, run: () => runThen(entry[0], position, true) },
      ]),
    ),
  ];
  const found = all.find((resolver) => isSameExpression(resolver.ref, callee));
  if (found !== undefined) return found.run();
  return all.reduceRight(
    (rest, resolver) =>
      ifThenElse(useJavaScript("SameValue", [callee, resolver.ref], context), resolver.run(), rest),
    leaf(apply("Assert", [boolean(false), string("tla-ts can't tell which function this is")])),
  );
};

// new Promise(executor), which runs the executor with the promise's resolve and reject, two
// functions on the heap.
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
  const resolvingFunction = useJavaScript(
    "ArrowObject",
    [translateBuiltInValue("Function.prototype", node, context), string(""), number(1)],
    context,
  );
  return makePromise(path, node, context, (made, name) =>
    allocateObject(made, node, context, resolvingFunction, (withResolve, resolveRef) =>
      allocateObject(withResolve, node, context, resolvingFunction, (withReject, rejectRef) => {
        const promise = getPromise(withReject, node, name);
        const start = setPromise(withReject, node, name, {
          ...promise,
          resolvers: { resolve: resolveRef, reject: rejectRef },
        });
        const back = (after: Path) =>
          continueWith(
            {
              ...after,
              scope: {
                ...after.scope,
                previous: start.scope.previous,
                isCatching: start.scope.isCatching,
                receiver: start.scope.receiver,
              },
            },
            promise.ref,
          );
        const bindings = new Map([
          ...start.scope.bindings,
          ...executor.parameters.flatMap((parameter, position): [ts.Symbol, Expression][] => {
            const symbol = getSymbol(parameter.name, context.checker);
            return symbol === undefined ? [] : [[symbol, position === 0 ? resolveRef : rejectRef]];
          }),
        ]);
        return translateStatements(
          getBody(executor),
          {
            ...start,
            scope: {
              ...start.scope,
              bindings,
              isCatching: true,
              receiver: ts.isArrowFunction(executor) ? start.scope.receiver : undefined,
            },
          },
          context,
          {
            next: back,
            exit: back,
            breakTo: undefined,
            continueTo: undefined,
            throwTo: (after, thrown) =>
              callResolver(node, rejectRef, thrown.value, undefined, after, context, back),
            yieldTo: undefined,
            awaitTo: undefined,
            inlining: new Set([...frame.inlining, executor]),
          },
        );
      }),
    ),
  );
};

// The Promise function that Promise.resolve.call(C, value) and the like call with C as this.
const PROMISE_STATICS = [
  "all",
  "allSettled",
  "any",
  "race",
  "reject",
  "resolve",
  "try",
  "withResolvers",
];

const getCalledPromiseFunction = (node: ts.CallExpression, context: Context) => {
  const callee = node.expression;
  return ts.isPropertyAccessExpression(callee) &&
    callee.name.text === "call" &&
    ts.isPropertyAccessExpression(callee.expression) &&
    getBuiltIn(callee.expression.expression, context) === "Promise" &&
    PROMISE_STATICS.includes(callee.expression.name.text)
    ? callee.expression.name.text
    : undefined;
};

// A value that reading has no effect on, as an argument that a TypeError makes unread.
const isInert = (node: ts.Expression): boolean =>
  ts.isLiteralExpression(node) ||
  (ts.isIdentifier(node) && node.text === "undefined") ||
  [ts.SyntaxKind.TrueKeyword, ts.SyntaxKind.FalseKeyword, ts.SyntaxKind.NullKeyword].includes(
    node.kind,
  ) ||
  (ts.isArrayLiteralExpression(node) && node.elements.every(isInert)) ||
  (ts.isObjectLiteralExpression(node) && node.properties.length === 0);

// Whether NewPromiseCapability(C) throws a TypeError before it runs any code: C isn't an object or
// a constructor, or its body is empty, so it never calls the executor.
const isIncapable = (node: ts.Expression | undefined, path: Path, context: Context) => {
  if (node === undefined) return true;
  const isRead =
    isInert(node) ||
    (ts.isIdentifier(node) && getSymbol(node, context.checker)?.valueDeclaration !== undefined) ||
    (ts.isCallExpression(node) &&
      getBuiltIn(node.expression, context) === "Symbol" &&
      node.arguments.every(isInert));
  if (!isRead) return false;
  const type = context.checker.getTypeAtLocation(node);
  const isPrimitive = (type.isUnion() ? type.types : [type]).every(
    (member) =>
      (member.flags &
        (ts.TypeFlags.Undefined |
          ts.TypeFlags.Null |
          ts.TypeFlags.Void |
          ts.TypeFlags.NumberLike |
          ts.TypeFlags.StringLike |
          ts.TypeFlags.BooleanLike |
          ts.TypeFlags.BigIntLike |
          ts.TypeFlags.ESSymbolLike)) !==
      0,
  );
  if (isPrimitive) return true;
  const callee = getCallback(getCast(node), path, context);
  return callee !== undefined && ts.isArrowFunction(callee);
};

// A function that the code passes only as the this of Promise.resolve.call and the like, which
// NewPromiseCapability constructs with an executor that the function only calls.
const getCapabilityConstructor = (node: ts.Expression, context: Context) => {
  const callee = ts.isIdentifier(node)
    ? getSymbol(node, context.checker)?.valueDeclaration
    : getCast(node);
  const constructor =
    callee !== undefined && ts.isVariableDeclaration(callee) && callee.initializer !== undefined
      ? getCast(callee.initializer)
      : callee;
  if (
    constructor === undefined ||
    !(ts.isFunctionDeclaration(constructor) || ts.isFunctionExpression(constructor)) ||
    constructor.asteriskToken !== undefined ||
    (ts.getCombinedModifierFlags(constructor) & ts.ModifierFlags.Async) !== 0 ||
    constructor.body === undefined ||
    constructor.parameters.length > 1 ||
    constructor.parameters.some(
      (parameter) => !ts.isIdentifier(parameter.name) || parameter.initializer !== undefined,
    ) ||
    findNodes(
      constructor.body,
      (inner): inner is ts.Node =>
        inner.kind === ts.SyntaxKind.ThisKeyword ||
        (ts.isIdentifier(inner) && inner.text === "arguments") ||
        ts.isMetaProperty(inner),
    ).length > 0
  ) {
    return undefined;
  }
  const name = ts.isFunctionExpression(constructor)
    ? constructor.name
    : (constructor.name ??
      (callee !== undefined && ts.isVariableDeclaration(callee) && ts.isIdentifier(callee.name)
        ? callee.name
        : undefined));
  const symbol = name && getSymbol(name, context.checker);
  const isPassedOnly =
    ts.isFunctionExpression(constructor) && constructor === getCast(node)
      ? constructor.name === undefined
      : symbol !== undefined &&
        findNodes(
          constructor.getSourceFile(),
          (inner): inner is ts.Identifier =>
            ts.isIdentifier(inner) &&
            inner !== name &&
            getSymbol(inner, context.checker) === symbol,
        ).every((reference) => {
          const call = reference.parent;
          return (
            ts.isCallExpression(call) &&
            call.arguments[0] === reference &&
            getCalledPromiseFunction(call, context) !== undefined
          );
        });
  return isPassedOnly ? constructor : undefined;
};

// The parameter of a capability constructor, which names its executor.
const isCapabilityExecutor = (node: ts.Expression, context: Context) => {
  const declaration = getSymbol(node, context.checker)?.valueDeclaration;
  if (declaration === undefined || !ts.isParameter(declaration)) return false;
  const constructor = declaration.parent;
  if (!ts.isFunctionDeclaration(constructor) && !ts.isFunctionExpression(constructor)) {
    return false;
  }
  const declared = constructor.parent;
  const source = ts.isFunctionDeclaration(constructor)
    ? constructor.name
    : ts.isVariableDeclaration(declared) && ts.isIdentifier(declared.name)
      ? declared.name
      : constructor;
  return (
    ts.isIdentifier(node) &&
    source !== undefined &&
    getCapabilityConstructor(source, context) === constructor
  );
};

// NewPromiseCapability(C), where C's body runs with an executor that keeps what C passes it, and
// a TypeError follows where C doesn't pass it two functions. tla-ts doesn't follow a capability
// that a script's constructor makes.
const translateCapability = (
  node: ts.CallExpression,
  constructor: ts.FunctionDeclaration | ts.FunctionExpression,
  path: Path,
  context: Context,
  frame: Frame,
): Formula => {
  const executor = constructor.parameters[0];
  const symbol = executor && getSymbol(executor.name, context.checker);
  const tasks = getTasks(path, node);
  const start =
    symbol === undefined
      ? path
      : withTasks(path, {
          ...tasks,
          capabilities: new Map([
            ...tasks.capabilities,
            [symbol, { resolve: getUndefined(context), reject: getUndefined(context) }],
          ]),
        });
  const finish = (after: Path) => {
    const taken = symbol && getTasks(after, node).capabilities.get(symbol);
    const isCallable = (value: Expression) =>
      apply("=", [
        useJavaScript("TypeOfIn", [getHeap(after.scope, node, context), value], context),
        string("function"),
      ]);
    const left = {
      ...after,
      scope: {
        ...after.scope,
        previous: path.scope.previous,
        isCatching: path.scope.isCatching,
        receiver: path.scope.receiver,
      },
    };
    return taken === undefined
      ? throwError("TypeError", left, node, context, frame)
      : ifThenElse(
          apply("/\\", [isCallable(taken.resolve), isCallable(taken.reject)]),
          leaf(
            apply("Assert", [
              boolean(false),
              string("tla-ts can't follow a promise that a script's constructor makes"),
            ]),
          ),
          throwError("TypeError", left, node, context, frame),
        );
  };
  return translateStatements(
    getBody(constructor),
    {
      ...start,
      scope: { ...start.scope, isCatching: true, receiver: undefined },
    },
    context,
    {
      next: finish,
      exit: finish,
      breakTo: undefined,
      continueTo: undefined,
      throwTo: frame.throwTo,
      yieldTo: undefined,
      awaitTo: undefined,
      inlining: new Set([...frame.inlining, constructor]),
    },
  );
};

// A call of a capability constructor's executor, which takes the functions it gets, or throws a
// TypeError where it took some already.
const callExecutor = (
  node: ts.CallExpression,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value?: Expression) => Formula,
): Formula => {
  const symbol = getSymbol(node.expression, context.checker);
  const tasks = getTasks(path, node);
  const taken = symbol && tasks.capabilities.get(symbol);
  if (symbol === undefined || taken === undefined) {
    throw new TlaTypeScriptError("tla-ts can't follow this executor", node);
  }
  // Only whether a function that the executor takes is callable matters.
  const values = [0, 1].map((position) => {
    const argument = node.arguments.at(position);
    const cast = argument && getCast(argument);
    return cast === undefined
      ? getUndefined(context)
      : ts.isFunctionExpression(cast) || ts.isArrowFunction(cast)
        ? translateFunctionValue(cast, context)
        : translateExpression(cast, path.scope, context);
  });
  const isSet = (value: Expression) =>
    apply("~", [useJavaScript("SameValue", [value, getUndefined(context)], context)]);
  return ifThenElse(
    apply("\\/", [isSet(taken.resolve), isSet(taken.reject)]),
    throwError("TypeError", path, node, context, frame),
    continueWith(
      withTasks(path, {
        ...tasks,
        capabilities: new Map([
          ...tasks.capabilities,
          [symbol, { resolve: values[0], reject: values[1] }],
        ]),
      }),
      getUndefined(context),
    ),
  );
};

export const isPromiseCall = (node: ts.CallExpression, context: Context) =>
  isFromAsync(node, context) ||
  getCalledPromiseFunction(node, context) !== undefined ||
  isCapabilityExecutor(node.expression, context) ||
  isResolver(node.expression, context) ||
  getPromiseFunction(node, context) !== undefined ||
  getPromiseMethod(node, context) !== undefined ||
  isTimerCall(node, context);

// Runs the rest where the built-in functions that a call runs are still where it reads them.
const guardBuiltIns = (
  node: ts.Node,
  owner: "Function.prototype" | "Promise" | "Promise.prototype",
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
  if (isCapabilityExecutor(node.expression, context)) {
    return callExecutor(node, path, context, frame, continueWith);
  }
  if (isFromAsync(node, context))
    return translateFromAsync(node, path, context, frame, continueWith);
  const called = getCalledPromiseFunction(node, context);
  if (called !== undefined) {
    const constructor = argument && getCapabilityConstructor(argument, context);
    if (
      (constructor === undefined && !isIncapable(argument, path, context)) ||
      !node.arguments.slice(1).every(isInert)
    ) {
      throw new TlaTypeScriptError(`Unsupported call: Promise.${called}.call`, node);
    }
    return guardBuiltIns(
      node,
      "Promise",
      [called],
      path,
      context,
      guardBuiltIns(
        node,
        "Function.prototype",
        ["call"],
        path,
        context,
        constructor === undefined
          ? throwError("TypeError", path, node, context, frame)
          : translateCapability(node, constructor, path, context, frame),
      ),
    );
  }
  if (isResolver(node.expression, context)) {
    return callResolver(
      node,
      translateExpression(node.expression, path.scope, context),
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
  if (promiseFunction !== undefined && COMBINATORS.includes(promiseFunction)) {
    return translatePromiseCombinator(node, promiseFunction, path, context, frame, continueWith);
  }
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
          : resolve(made, node, name, value, argument, context, (resolved) =>
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
// As Node does by default, a promise that is rejected with no reaction once the jobs run out ends
// the program.
export const drainTasks = (path: Path, finish: (path: Path) => Formula): Formula => {
  const tasks = path.tasks;
  if (tasks === undefined) return finish(path);
  const job = tasks.jobs.at(0);
  if (job !== undefined) {
    return job.run(withTasks(path, { ...tasks, jobs: tasks.jobs.slice(1) }), (after) =>
      drainTasks(after, finish),
    );
  }
  if (
    [...tasks.promises.values()].some(
      (promise) => promise.state === "rejected" && !promise.isHandled,
    )
  ) {
    return leaf(apply("Assert", [boolean(false), string("A promise rejected with no handler")]));
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
        resolve(made, node, name, value, valueNode, context, (resolved) =>
          continueWith(resolved, name),
        ),
      ),
  );

// Suspends code at an await: a job resumes it once the promise of the value settles, and the code
// that ran it continues meanwhile.
export const awaitIn = (
  path: Path,
  node: ts.Node,
  value: Expression,
  operand: ts.Expression | undefined,
  context: Context,
  resume: (
    resumer: Path,
    settled: Expression,
    isRejected: boolean,
    onReturn: (path: Path) => Formula,
  ) => Formula,
  continueWith: (path: Path) => Formula,
): Formula => {
  const resumeWith = (isRejected: boolean): Handler => ({
    run: (resumer, settled, onReturn) =>
      resume(resumer, settled, isRejected, (after) => onReturn(after, getUndefined(context))),
  });
  return awaitValue(path, node, value, operand, context, (awaited, awaitedName) =>
    continueWith(
      addReaction(
        awaited,
        node,
        awaitedName,
        { onFulfilled: resumeWith(false), onRejected: resumeWith(true), derived: undefined },
        context,
      ),
    ),
  );
};

// Makes the promise of a request to an async generator, which its next, return, or throw gives.
export const makeRequest = (
  path: Path,
  node: ts.Node,
  context: Context,
  continueWith: (path: Path, name: string, ref: Expression) => Formula,
) =>
  makePromise(path, node, context, (made, name) =>
    continueWith(made, name, getPromise(made, node, name).ref),
  );

// Settles the promise of a request to an async generator: with an iterator result of what the
// body yields or returns, or with what it throws.
export const settleRequest = (
  path: Path,
  node: ts.Node,
  request: string,
  value: Expression,
  isDone: boolean,
  isThrown: boolean,
  context: Context,
  continueWith: (path: Path) => Formula,
): Formula =>
  isThrown
    ? continueWith(settle(path, node, request, value, true, context))
    : allocateObject(
        path,
        node,
        context,
        useJavaScript("IteratorResult", [value, boolean(isDone)], context),
        (made, ref) =>
          resolve(
            setPromise(made, node, request, {
              ...getPromise(made, node, request),
              iteration: { value, isDone },
            }),
            node,
            request,
            ref,
            undefined,
            context,
            continueWith,
          ),
      );

// What the promise of a request to an async generator settled with, as tla-ts follows it.
export const getIteration = (path: Path, node: ts.Node, request: Expression) => {
  const iteration = getPromise(path, node, findPromise(path, node, request) ?? "").iteration;
  if (iteration === undefined)
    throw new TlaTypeScriptError("tla-ts can't follow this iterator", node);
  return iteration;
};

// A call of an async function, which runs the body until it awaits and gives the promise that the
// body settles once it returns or throws. The body leaves to the code that last ran it: the call,
// and then the job that resumed it once a promise it awaited settled.
export const translateAsyncCall = (
  node: ts.CallExpression,
  callee: FunctionNode,
  receiver: Receiver | undefined,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value?: Expression) => Formula,
): Formula =>
  runAsyncBody(
    node,
    callee,
    path,
    context,
    frame,
    (made, rejectFrame, bindWith) =>
      bindCall(node, callee, node.arguments, receiver, made, context, rejectFrame, bindWith),
    continueWith,
  );

// Runs an async function's body once a call binds its parameters, and gives its promise.
const runAsyncBody = (
  node: ts.Node,
  callee: FunctionNode,
  path: Path,
  context: Context,
  frame: Frame,
  bind: (path: Path, frame: Frame, continueWith: (bound: Bound, path: Path) => Formula) => Formula,
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
    return bind(catching, rejectFrame, (bound, inner) => {
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
          return awaitIn(
            left.left,
            node,
            value,
            operand,
            context,
            (resumer, settled, isRejected, onReturn) =>
              (isRejected ? onRejected : onFulfilled)(
                setCaller(
                  enterBody(resumer, current, (symbol) => isOuter(symbol) && !captured.has(symbol)),
                  { path: resumer, resume: onReturn },
                ),
                settled,
              ),
            left.caller.resume,
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
    });
  });
