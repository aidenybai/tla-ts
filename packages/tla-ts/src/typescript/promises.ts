import ts from "@typescript/typescript6";
import type { Expression } from "../ast";
import {
  bindCall,
  bindOnce,
  enterBody,
  type Frame,
  getChanged,
  getWritten,
  getWrittenRoots,
  leaveBody,
  getBody,
  allocate,
  getAsyncCallee,
  getCallback,
  getCast,
  inlineValues,
  isSameExpression,
  makeGenerator,
  type Path,
  resumeGenerator,
  runLeadingCall,
  throwError,
  throwTypeError,
  translateCallStatement,
  translateJoined,
  translateStatements,
} from "./actions";
import {
  type Context,
  type FunctionNode,
  findNodes,
  getAssignedTarget,
  getLocalCaptures,
  getFunctionOfKind,
  getKeptLocals,
  getLiveMaker,
  getKeptMaker,
  getParameters,
  getSymbol,
  getUndefined,
  isAnyGenerator,
  isAssigned,
  isAsyncFunction,
  isAsyncGenerator,
  isHeapFunction,
  isStrictCode,
  isTimerCall,
  skipCasts,
  translateString,
} from "./context";
import { getCallbackReceiver, translateArrayIteratorPrototype } from "./collections";
import { TlaTypeScriptError } from "../errors";
import { translateEngineError } from "./exceptions";
import { translateExpression } from "./expressions";
import { type Formula, ifThenElse, leaf, letIn } from "./formula";
import { getCandidateValue, getHeap, translateFunctionValue } from "./heap";
import { getBuiltIn, translateBuiltInValue } from "./intrinsics";
import { useJavaScript } from "./javascript";
import { openIterator, readValue, stepIterator } from "./iterators";
import { isNullish } from "./protocols";
import { getKeptIterator, getKind, isHeapArray } from "./types";
import { type Bound, bindValues, type Receiver } from "./scope";
import type { TrackedStack } from "./stacks";
import {
  apply,
  boolean,
  define,
  functionFrom,
  ifExpression,
  identifier,
  index,
  junction,
  number,
  set,
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
  capabilities: ReadonlyMap<ts.Symbol, { resolve: Taken; reject: Taken }>;
  // The DisposableStacks that the code made, by the name of the heap that made each.
  stacks: ReadonlyMap<string, TrackedStack>;
  // The functions that a combinator passes a then for a script's capability, which the code may
  // call later.
  callables: readonly Callable[];
  // What each combinator of a script's capability has so far, by its name.
  combinations: ReadonlyMap<string, Combination>;
}

// Calls a function with values, and gives what it returns or throws.
interface Runner {
  (
    path: Path,
    values: Expression[],
    onReturn: (path: Path, result: Expression) => Formula,
    onThrow: (path: Path, thrown: Expression) => Formula,
  ): Formula;
}

// A value that an executor took, with how to call it where tla-ts can.
interface Taken {
  value: Expression;
  run: Runner | undefined;
}

interface Callable {
  ref: Expression;
  run: Runner;
}

// The values or reasons that a combinator has, how many it waits for, and whether each element's
// functions ran.
interface Combination {
  values: readonly Expression[];
  remaining: number;
  isCalled: readonly boolean[];
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
  // The Promise.withResolvers call that made it, whose object holds it and its functions.
  made: ts.CallExpression | undefined;
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
  stacks: new Map(),
  callables: [],
  combinations: new Map(),
};

const getTasks = (path: Path, node: ts.Node) => {
  if (path.tasks === undefined) {
    throw new TlaTypeScriptError("tla-ts can't follow a promise in a loop", node);
  }
  return path.tasks;
};

const withTasks = (path: Path, tasks: Tasks): Path => ({ ...path, tasks });

// The tasks from before, where the others are the same, so that paths that changed none can join.
const keepTasks = (tasks: Tasks, before: Tasks) =>
  tasks.jobs === before.jobs &&
  tasks.timers === before.timers &&
  tasks.promises === before.promises &&
  tasks.callers === before.callers &&
  tasks.capabilities === before.capabilities &&
  tasks.stacks === before.stacks &&
  tasks.callables === before.callables &&
  tasks.combinations === before.combinations
    ? before
    : tasks;

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

// Whether a value may be a promise: TypeScript types it as one, or as unknown or any, unless it
// binds a parameter whose argument TypeScript types as something else.
const isPossiblePromise = (
  valueNode: ts.Expression,
  value: Expression,
  context: Context,
): boolean => {
  if (isPromiseType(valueNode, context)) return true;
  if (
    (context.checker.getTypeAtLocation(valueNode).flags &
      (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) ===
    0
  ) {
    return false;
  }
  const passed = value.kind === "Identifier" ? context.passed.get(value.name) : undefined;
  return passed === undefined || isPossiblePromise(passed.node, passed.value, context);
};

// The promise that a value is: one that its expression names, or, where the value may be a
// promise, any that the path follows.
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
  const held = valueNode && getHeld(path, node, valueNode, context);
  if (held !== undefined && held.key === "promise") {
    return ifThenElse(
      useJavaScript("SameValue", [value, held.promise.ref], context),
      onPromise(held.name),
      leaf(apply("Assert", [boolean(false), string("tla-ts can't tell which promise this is")])),
    );
  }
  if (valueNode === undefined || !isPossiblePromise(valueNode, value, context)) return otherwise();
  return dispatchFollowed(path, node, value, context, onPromise, otherwise());
};

// The promise, of those that the path follows, whose Promise.withResolvers object a property or a
// pattern reads, with the key it reads, where the variable that holds the object is the one that
// the call initialized, which the caller checks, as code may change the object.
const getHeld = (path: Path, node: ts.Node, valueNode: ts.Expression, context: Context) => {
  const cast = skipCasts(valueNode);
  const root = ts.isPropertyAccessExpression(cast) ? skipCasts(cast.expression) : cast;
  const declaration = ts.isIdentifier(root)
    ? getSymbol(root, context.checker)?.valueDeclaration
    : undefined;
  const variable =
    declaration !== undefined &&
    ts.isBindingElement(declaration) &&
    ts.isObjectBindingPattern(declaration.parent)
      ? declaration.parent.parent
      : declaration;
  const initializer =
    variable !== undefined && ts.isVariableDeclaration(variable) && variable.initializer
      ? skipCasts(variable.initializer)
      : undefined;
  const key = ts.isPropertyAccessExpression(cast)
    ? root === cast.expression && variable === declaration
      ? cast.name.text
      : undefined
    : declaration !== undefined && ts.isBindingElement(declaration)
      ? (declaration.propertyName ?? declaration.name).getText()
      : undefined;
  if (
    key === undefined ||
    initializer === undefined ||
    !ts.isCallExpression(initializer) ||
    getPromiseFunction(initializer, context) !== "withResolvers"
  ) {
    return undefined;
  }
  const entry = [...getTasks(path, node).promises].findLast(
    (inner) => inner[1].made === initializer,
  );
  return entry && { name: entry[0], promise: entry[1], key };
};

// The promise among those that the path follows that a value is, or none.
export const dispatchFollowed = (
  path: Path,
  node: ts.Node,
  value: Expression,
  context: Context,
  onPromise: (name: string, ref: Expression) => Formula,
  otherwise: Formula,
): Formula => {
  // A value that names a followed promise's ref is that promise, as no two of them are the same.
  const found = findPromise(path, node, value);
  return found !== undefined
    ? onPromise(found, value)
    : [...getTasks(path, node).promises].reduceRight(
        (rest, entry) =>
          ifThenElse(
            useJavaScript("SameValue", [value, entry[1].ref], context),
            onPromise(entry[0], entry[1].ref),
            rest,
          ),
        otherwise,
      );
};

// A getter that a script defines as a then, whose body only throws a top-level variable, as
// Object.defineProperty(object, "then", { get: function() { throw value; } }) does.
interface ThrowingThen {
  getter: ts.FunctionExpression | ts.ArrowFunction;
  thrown: ts.Identifier;
}

const getThrowingThens = (node: ts.Node, context: Context) =>
  findNodes(node.getSourceFile(), ts.isCallExpression).flatMap((call): ThrowingThen[] => {
    const key = call.arguments.at(1);
    const descriptor = call.arguments.at(2);
    const getter =
      descriptor !== undefined && ts.isObjectLiteralExpression(descriptor)
        ? descriptor.properties.find(
            (property): property is ts.PropertyAssignment =>
              ts.isPropertyAssignment(property) &&
              ts.isIdentifier(property.name) &&
              property.name.text === "get",
          )?.initializer
        : undefined;
    const statement =
      getter !== undefined &&
      (ts.isFunctionExpression(getter) || ts.isArrowFunction(getter)) &&
      ts.isBlock(getter.body) &&
      getter.body.statements.length === 1
        ? getter.body.statements[0]
        : undefined;
    const thrown =
      statement !== undefined && ts.isThrowStatement(statement) ? statement.expression : undefined;
    const declaration =
      thrown !== undefined && ts.isIdentifier(thrown)
        ? getSymbol(thrown, context.checker)?.valueDeclaration
        : undefined;
    return ts.isPropertyAccessExpression(call.expression) &&
      call.expression.name.text === "defineProperty" &&
      getBuiltIn(call.expression.expression, context) === "Object" &&
      key !== undefined &&
      ts.isStringLiteral(key) &&
      key.text === "then" &&
      getter !== undefined &&
      (ts.isFunctionExpression(getter) || ts.isArrowFunction(getter)) &&
      thrown !== undefined &&
      ts.isIdentifier(thrown) &&
      declaration !== undefined &&
      ts.isVariableDeclaration(declaration) &&
      ts.isSourceFile(declaration.parent.parent.parent)
      ? [{ getter, thrown }]
      : [];
  });

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
  // A value without a node, such as the array that Promise.all fulfills with, may find a then
  // that the script assigns.
  const runsThen =
    valueNode === undefined
      ? candidates.some(isAssignedThen)
      : hasCallable(valueNode, "then", context);
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
  // Reading a then that a getter throws from rejects the promise with what it throws.
  const throwingThens = getThrowingThens(node, context);
  return dispatchPromise(path, node, value, valueNode, context, follow, () =>
    throwingThens.reduceRight<Formula>(
      (otherwise, throwing) =>
        ifThenElse(
          apply("=", [
            useJavaScript("ThenGetter", [heap, value], context),
            getCandidateValue(throwing.getter, context) ?? getUndefined(context),
          ]),
          continueWith(
            settle(
              path,
              node,
              name,
              translateExpression(throwing.thrown, path.scope, context),
              true,
              context,
            ),
          ),
          otherwise,
        ),
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
        runsThen && valueNode !== undefined
          ? leaf(
              apply("Assert", [
                boolean(false),
                string(
                  "tla-ts can't resolve a promise with a value whose type has a then it lacks",
                ),
              ]),
            )
          : continueWith(settle(path, node, name, value, false, context)),
      ),
    ),
  );
};

const isThenName = (name: ts.PropertyName) =>
  (ts.isIdentifier(name) || ts.isStringLiteral(name)) && name.text === "then";

// Whether TypeScript types a value with a property that it can call, such as a then, which a job
// then calls where the value resolves a promise. tla-ts follows a value of another type as one
// without a then.
const hasCallable = (valueNode: ts.Expression, key: string, context: Context) => {
  const then = context.checker.getTypeAtLocation(valueNode).getProperty(key);
  if (then === undefined || (then.flags & ts.SymbolFlags.Optional) !== 0) return false;
  const type = context.checker.getTypeOfSymbolAtLocation(then, valueNode);
  return (type.isUnion() ? type.types : [type]).every(
    (member) => member.getCallSignatures().length > 0,
  );
};

const MAX_THEN_PAIRS = 8;

// A function that an object literal gives as its then, which a promise that the object resolves
// calls with the promise's resolve and reject.
// A function that a script assigns as an object's then, such as Array.prototype's.
const isAssignedThen = (node: ts.Node) =>
  (ts.isFunctionExpression(node) || ts.isArrowFunction(node)) &&
  ts.isBinaryExpression(node.parent) &&
  node.parent.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
  node.parent.right === node &&
  ts.isPropertyAccessExpression(node.parent.left) &&
  node.parent.left.name.text === "then";

const isThenFunction = (node: ts.Node): node is FunctionNode =>
  isAssignedThen(node) ||
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

// A promise's resolve or reject, or another built-in function of a promise that takes a value, with
// no name.
const translateResolvingFunction = (node: ts.Node, context: Context) =>
  useJavaScript(
    "ArrowObject",
    [translateBuiltInValue("Function.prototype", node, context), string(""), number(1)],
    context,
  );

// An object with a writable, enumerable, and configurable property more.
const defineData = (object: Expression, key: string, value: Expression, context: Context) =>
  useJavaScript(
    "Define",
    [object, string(key), value, boolean(true), boolean(true), boolean(true)],
    context,
  );

// The object that Promise.allSettled gives for a promise that settles.
const translateSettled = (
  field: "value" | "reason",
  status: string,
  value: Expression,
  context: Context,
) =>
  defineData(
    defineData(identifier("EmptyObject"), "status", string(status), context),
    field,
    value,
    context,
  );

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
  const resolvingFunction = translateResolvingFunction(node, context);
  return allocateObject(path, node, context, resolvingFunction, (withResolve, resolveRef) =>
    allocateObject(withResolve, node, context, resolvingFunction, (withReject, rejectRef) => {
      const promise = getPromise(withReject, node, name);
      return invokeThen(
        setPromise(withReject, node, name, {
          ...promise,
          thenResolvers: [
            ...promise.thenResolvers,
            { resolve: resolveRef, reject: rejectRef, isResolved: false },
          ],
        }),
        node,
        thenable,
        then,
        candidates,
        [resolveRef, rejectRef],
        context,
        next,
        (after, thrown) => callResolver(node, rejectRef, thrown, undefined, after, context, next),
      );
    }),
  );
};

// Calls a thenable's then, one of the candidates, with values.
const invokeThen = (
  start: Path,
  node: ts.Node,
  thenable: Expression,
  then: Expression,
  candidates: readonly FunctionNode[],
  values: readonly Expression[],
  context: Context,
  onReturn: (path: Path, value?: Expression) => Formula,
  onThrow: (path: Path, thrown: Expression) => Formula,
): Formula => {
  const startHeap = getHeap(start.scope, node, context);
  const code = useJavaScript("CodeOf", [startHeap, then], context);
  // A then that reads the locals of the async function that made it reads them from the
  // environment of the call that made it, which holds them while the call waits.
  const environment = useJavaScript("EnvironmentOf", [startHeap, then], context);
  return candidates.reduceRight(
    (otherwise, candidate) => {
      const parameters = candidate.parameters;
      const maker = getLiveMaker(candidate, context);
      if (
        parameters.length > 2 ||
        parameters.some(
          (parameter) =>
            !ts.isIdentifier(parameter.name) ||
            parameter.initializer !== undefined ||
            parameter.dotDotDotToken !== undefined,
        ) ||
        (maker === undefined && getLocalCaptures(candidate, context).size > 0) ||
        (ts.isArrowFunction(candidate) &&
          ts.findAncestor(candidate.parent, ts.isFunctionLike) !== undefined)
      ) {
        return otherwise;
      }
      const candidateValue = getCandidateValue(candidate, context);
      if (candidateValue === undefined) return otherwise;
      const locals = maker === undefined ? [] : getKeptLocals(maker, context);
      const heapSymbol = context.heap;
      // The then's changes to the locals go back to the environment, and the job's own bindings
      // of those names stay as they were.
      const leave = (after: Path): Path => {
        const kept = locals.flatMap((local): [Expression, Expression][] => {
          const value = after.scope.bindings.get(local.symbol);
          return value === undefined ? [] : [[string(local.key), value]];
        });
        const restored = new Map(after.scope.bindings);
        locals.forEach((local) => {
          const value = start.scope.bindings.get(local.symbol);
          if (value === undefined) restored.delete(local.symbol);
          else restored.set(local.symbol, value);
        });
        return {
          ...after,
          mutable: start.mutable,
          scope: {
            ...after.scope,
            previous: start.scope.previous,
            isCatching: start.scope.isCatching,
            receiver: start.scope.receiver,
            bindings:
              heapSymbol === undefined || kept.length === 0
                ? restored
                : restored.set(
                    heapSymbol,
                    useJavaScript(
                      "SetEnvironment",
                      [getHeap(after.scope, node, context), environment, functionFrom(kept)],
                      context,
                    ),
                  ),
          },
        };
      };
      const bindings = new Map([
        ...start.scope.bindings,
        ...locals.map((local): [ts.Symbol, Expression] => [
          local.symbol,
          useJavaScript("EnvironmentValue", [startHeap, environment, string(local.key)], context),
        ]),
        ...parameters.flatMap((parameter, position): [ts.Symbol, Expression][] => {
          const symbol = getSymbol(parameter.name, context.checker);
          return symbol === undefined
            ? []
            : [[symbol, values.at(position) ?? getUndefined(context)]];
        }),
      ]);
      return ifThenElse(
        apply("=", [code, candidateValue]),
        translateStatements(
          getBody(candidate, start.scope, context),
          {
            ...start,
            mutable: new Set([...start.mutable, ...locals.map((local) => local.symbol)]),
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
            next: (after) => onReturn(leave(after)),
            exit: (after, value) => onReturn(leave(after), value),
            breakTo: undefined,
            continueTo: undefined,
            throwTo: (after, thrown) => onThrow(leave(after), thrown.value),
            yieldTo: undefined,
            awaitTo: undefined,
            inlining: new Set([candidate]),
          },
        ),
        otherwise,
      );
    },
    leaf(
      apply("Assert", [boolean(false), string("tla-ts can't tell which then this thenable has")]),
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

// Makes a pending promise on the heap, whose properties a read finds on Promise.prototype.
const makePromise = (
  path: Path,
  node: ts.Node,
  context: Context,
  continueWith: (path: Path, name: string) => Formula,
) => {
  context.builtIns.add("Promise.prototype");
  return allocateObject(path, node, context, identifier("PromiseObject"), (made, ref, name) =>
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
        made: undefined,
      }),
      name,
    ),
  );
};

// Calls a function that a then, a catch, or a finally takes, in a later job.
const getRunner = (node: ts.Expression | undefined, path: Path, context: Context, frame: Frame) => {
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
    return (
      current: Path,
      values: Expression[],
      onReturn: (path: Path, result: Expression) => Formula,
      onThrow: (path: Path, thrown: Expression) => Formula,
    ) => callResolving(node, callee, values, undefined, current, context, onReturn, onThrow);
  }
  const callee = getCallback(cast, path, context) ?? getAsyncCallee(cast, path, context);
  if (callee === undefined) {
    throw new TlaTypeScriptError("Pass then a function that tla-ts can follow", node);
  }
  return getCallbackRunner(
    callee,
    getCalledReceiver(callee, path.scope.receiver, context),
    path,
    context,
    frame,
  );
};

// The this of a function that JavaScript calls with undefined as its this, as a job calls a
// reaction's handler and new Promise its executor: where an arrow function was written, and
// undefined in strict code.
const getCalledReceiver = (
  callee: FunctionNode,
  receiver: Receiver | undefined,
  context: Context,
): Receiver | undefined =>
  ts.isArrowFunction(callee)
    ? receiver
    : isStrictCode(callee)
      ? { value: getUndefined(context), method: callee }
      : undefined;

// A function that a then or a catch takes, which runs as a job with the promise's value.
const getHandler = (
  node: ts.Expression | undefined,
  path: Path,
  context: Context,
  frame: Frame,
): Handler | undefined => {
  const run = getRunner(node, path, context, frame);
  return (
    run && {
      run: (current, value, onReturn, onThrow) => run(current, [value], onReturn, onThrow),
    }
  );
};

// The thenFinally and catchFinally of Promise.prototype.finally, which call onFinally with no
// arguments, and give the promise that p.then gives, where p is the promise that PromiseResolve
// gives for what onFinally returns: one that fulfills with the value or rejects with the reason.
const getFinallyHandlers = (
  node: ts.CallExpression,
  onFinally: ts.Expression | undefined,
  path: Path,
  context: Context,
  frame: Frame,
) => {
  const run = getRunner(onFinally, path, context, frame);
  const getFinally = (isRejected: boolean): Handler => ({
    run: (current, value, onReturn, onThrow) =>
      run === undefined
        ? onReturn(current, value)
        : run(
            current,
            [],
            (after, result) =>
              awaitValue(after, node, result, undefined, context, (resolved, followed) =>
                guardBuiltIns(
                  node,
                  "Promise.prototype",
                  ["then", "constructor"],
                  resolved,
                  context,
                  makePromise(resolved, node, context, (made, derived) =>
                    onReturn(
                      addReaction(
                        made,
                        node,
                        followed,
                        {
                          onFulfilled: {
                            run: (job, _, give, raise) =>
                              isRejected ? raise(job, value) : give(job, value),
                          },
                          onRejected: undefined,
                          derived,
                        },
                        context,
                      ),
                      getPromise(made, node, derived).ref,
                    ),
                  ),
                ),
              ),
            onThrow,
          ),
  });
  return run === undefined ? [undefined, undefined] : [getFinally(false), getFinally(true)];
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

// The object literal that an array-like names, written in place or as a const's value, and the
// length that it writes.
const getArrayLike = (node: ts.Expression, context: Context) => {
  const declaration = ts.isIdentifier(node)
    ? getSymbol(node, context.checker)?.valueDeclaration
    : undefined;
  const literal =
    declaration !== undefined &&
    ts.isVariableDeclaration(declaration) &&
    (ts.getCombinedNodeFlags(declaration) & ts.NodeFlags.Const) !== 0 &&
    declaration.initializer !== undefined
      ? getCast(declaration.initializer)
      : node;
  if (!ts.isObjectLiteralExpression(literal)) return undefined;
  const getProperty = (key: string) =>
    literal.properties.find(
      (property): property is ts.PropertyAssignment =>
        ts.isPropertyAssignment(property) &&
        (ts.isIdentifier(property.name) || ts.isNumericLiteral(property.name)) &&
        property.name.text === key,
    )?.initializer;
  const length = getProperty("length");
  return length !== undefined && ts.isNumericLiteral(length)
    ? { length, count: Number(length.text), getProperty }
    : undefined;
};

// The array literal whose values() a const holds, which only the given use reads, so that nothing
// steps the iterator before it, and whose elements are literals or consts, which read the same
// wherever they're evaluated, or promises that Promise.resolve makes of them, which settle at once
// and queue no job.
const getIteratedLiteral = (node: ts.Identifier, context: Context) => {
  const symbol = getSymbol(node, context.checker);
  const valueDeclaration = symbol?.valueDeclaration;
  const declaration =
    valueDeclaration !== undefined && ts.isVariableDeclaration(valueDeclaration)
      ? valueDeclaration
      : undefined;
  const initializer =
    declaration !== undefined &&
    (ts.getCombinedNodeFlags(declaration) & ts.NodeFlags.Const) !== 0 &&
    declaration.initializer !== undefined
      ? getCast(declaration.initializer)
      : undefined;
  const literal =
    initializer !== undefined &&
    ts.isCallExpression(initializer) &&
    getKeptIterator(initializer, context) === "values" &&
    (ts.isPropertyAccessExpression(initializer.expression) ||
      ts.isElementAccessExpression(initializer.expression))
      ? getCast(initializer.expression.expression)
      : undefined;
  const isConstant = (element: ts.Expression): boolean => {
    const declared = ts.isIdentifier(element)
      ? getSymbol(element, context.checker)?.valueDeclaration
      : undefined;
    return (
      ts.isLiteralExpression(element) ||
      (ts.isCallExpression(element) &&
        ts.isPropertyAccessExpression(element.expression) &&
        element.expression.name.text === "resolve" &&
        getBuiltIn(element.expression.expression, context) === "Promise" &&
        element.arguments.length === 1 &&
        isConstant(element.arguments[0])) ||
      (declared !== undefined &&
        ts.isVariableDeclaration(declared) &&
        (ts.getCombinedNodeFlags(declared) & ts.NodeFlags.Const) !== 0)
    );
  };
  const uses = findNodes(
    node.getSourceFile(),
    (inner): inner is ts.Identifier =>
      ts.isIdentifier(inner) &&
      inner !== declaration?.name &&
      getSymbol(inner, context.checker) === symbol,
  );
  return literal !== undefined &&
    ts.isArrayLiteralExpression(literal) &&
    literal.elements.every(isConstant) &&
    uses.length === 1 &&
    uses[0] === node
    ? literal
    : undefined;
};

// The generator function that an object literal holds as its only property, under
// Symbol.asyncIterator or Symbol.iterator, which Array.fromAsync calls with the object to make the
// iterator it reads.
const getIteratorMethod = (node: ts.ObjectLiteralExpression, context: Context) => {
  const property = node.properties.length === 1 ? node.properties[0] : undefined;
  const name =
    property !== undefined &&
    property.name !== undefined &&
    ts.isComputedPropertyName(property.name)
      ? property.name.expression
      : undefined;
  const key =
    name !== undefined &&
    ts.isPropertyAccessExpression(name) &&
    getBuiltIn(name.expression, context) === "Symbol"
      ? name.name.text
      : undefined;
  const value =
    property === undefined
      ? undefined
      : ts.isMethodDeclaration(property)
        ? property
        : ts.isPropertyAssignment(property)
          ? getFunctionOfKind(property.initializer, context, isAnyGenerator)
          : undefined;
  if (
    value === undefined ||
    !(
      ts.isFunctionDeclaration(value) ||
      ts.isFunctionExpression(value) ||
      ts.isMethodDeclaration(value)
    ) ||
    value.asteriskToken === undefined
  ) {
    return undefined;
  }
  const isAsync = isAsyncGenerator(value);
  return (key === "asyncIterator" && isAsync) || (key === "iterator" && !isAsync)
    ? { generator: value, isAsync }
    : undefined;
};

// Array.fromAsync of an array or a string written in place, which it reads through an
// async-from-sync iterator, of an array-like object, which it reads by index, or of a generator.
// An iterator's element takes a job to settle the iterator's result and another to await it, as
// does its end, and a mapping function's throw or rejection takes another, to await the iterator's
// return. An async generator's element takes the job that awaits its request, without awaiting
// the value again, and a mapping function's throw or rejection awaits its return. An array-like's
// element, like a mapping function's result, takes a job to await.
const translateFromAsync = (
  node: ts.CallExpression,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value?: Expression) => Formula,
): Formula => {
  const argument = node.arguments.at(0);
  const items = argument && getCast(argument);
  const mapping = node.arguments.at(1);
  const callee =
    mapping &&
    (getCallback(getCast(mapping), path, context) ??
      getAsyncCallee(getCast(mapping), path, context));
  // The one expression that a mapping function that isn't async returns, whose type tells whether
  // its result has a then that fromAsync's await calls.
  const returns =
    callee === undefined || isAsyncFunction(callee) || callee.body === undefined
      ? []
      : ts.isBlock(callee.body)
        ? findNodes(callee.body, ts.isReturnStatement).filter(
            (statement) => ts.findAncestor(statement.parent, ts.isFunctionLike) === callee,
          )
        : [callee.body];
  const returned = returns.length === 1 ? returns[0] : undefined;
  const mappedNode =
    returned !== undefined && ts.isReturnStatement(returned) ? returned.expression : returned;
  const arrayLike =
    items && !ts.isArrayLiteralExpression(items) ? getArrayLike(items, context) : undefined;
  // An array's iterator that fromAsync reads as it reads the array.
  const iteratedLiteral =
    items !== undefined && ts.isIdentifier(items) ? getIteratedLiteral(items, context) : undefined;
  const literal =
    items !== undefined && ts.isArrayLiteralExpression(items) ? items : iteratedLiteral;
  const elements = literal?.elements.map((element) =>
    ts.isOmittedExpression(element) ? undefined : element,
  );
  const text = items !== undefined && ts.isStringLiteralLike(items) ? items.text : undefined;
  // A generator object that a variable holds, whose next fromAsync calls as it reads each value.
  const symbol = items && ts.isIdentifier(items) ? getSymbol(items, context.checker) : undefined;
  const generatorType = items && context.checker.getTypeAtLocation(items).getSymbol()?.name;
  const held =
    symbol !== undefined && (generatorType === "Generator" || generatorType === "AsyncGenerator")
      ? path.scope.bindings.get(symbol)
      : undefined;
  // The generator function that the variable's initializer calls.
  const declaration = held === undefined ? undefined : symbol?.valueDeclaration;
  const call =
    declaration !== undefined &&
    ts.isVariableDeclaration(declaration) &&
    declaration.initializer !== undefined
      ? getCast(declaration.initializer)
      : undefined;
  const made =
    call !== undefined && ts.isCallExpression(call)
      ? getFunctionOfKind(call.expression, context, isAnyGenerator)
      : undefined;
  // The one value that the generator yields, whose type tells whether it has a then that
  // fromAsync's await calls.
  const yields =
    made?.body === undefined
      ? []
      : findNodes(made.body, ts.isYieldExpression).filter(
          (yielded) => ts.findAncestor(yielded.parent, ts.isFunctionLike) === made,
        );
  const yieldedNode =
    yields.length === 1 && yields[0].asteriskToken === undefined ? yields[0].expression : undefined;
  const iteratorMethod =
    items !== undefined && ts.isObjectLiteralExpression(items)
      ? getIteratorMethod(items, context)
      : undefined;
  const isAsync =
    (held !== undefined && generatorType === "AsyncGenerator") || iteratorMethod?.isAsync === true;
  const isGenerator = held !== undefined || iteratorMethod !== undefined;
  // Jobs resume the generator, where the locals around it that change may be stale.
  for (const generator of [made, iteratorMethod?.generator]) {
    if (generator !== undefined) getLocalCaptures(generator, context);
  }
  if (
    items === undefined ||
    (elements === undefined && text === undefined && arrayLike === undefined && !isGenerator) ||
    (elements ?? []).some((element) => element !== undefined && ts.isSpreadElement(element)) ||
    (mapping !== undefined && callee === undefined)
  ) {
    throw new TlaTypeScriptError(
      "Pass Array.fromAsync an array, a string or an array-like object written in place, the values() of an array written in place, a generator, or an object written in place whose Symbol.asyncIterator or Symbol.iterator is a generator function, and a function that tla-ts can follow",
      node,
    );
  }
  const ran =
    elements === undefined || iteratedLiteral !== undefined
      ? undefined
      : runLeadingCall(items, path, context, frame, (after) =>
          translateFromAsync(node, after, context, frame, continueWith),
        );
  if (ran !== undefined) return ran;
  const source = context.names.getFresh("items");
  const count = arrayLike?.count ?? elements?.length ?? [...(text ?? "")].length;
  const unfollowed = () => {
    throw new TlaTypeScriptError("tla-ts can't follow Array.fromAsync of this generator", node);
  };
  return allocate(held === undefined ? items : undefined, path, context, (allocated) =>
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
      // Reads the generator object that receiver holds, or else the items, which source names.
      const iterate = (start: Path, receiver: Expression | undefined) => {
        // A rejection that closes the iterator, which fromAsync awaits, or that ends an
        // array-like. A generator's return, which closing the iterator runs, and whose throw the
        // rejection that closes it hides.
        const close = (current: Path, next: (path: Path) => Formula) =>
          receiver === undefined
            ? next(current)
            : resumeGenerator(
                node,
                receiver,
                "return",
                undefined,
                current,
                context,
                { ...frame, throwTo: (after) => next(after) },
                (after) => next(after),
              );
        // A throw or rejection of a mapping function, which awaits the iterator's return: its
        // promise settles at once where the iterator has no return, or else a job after the
        // return. An async generator's return gives a promise, which fromAsync awaits.
        const reject = (current: Path, reason: Expression, exit: (path: Path) => Formula) => {
          const settleRejected = (rejected: Path, onReturn: (path: Path) => Formula) =>
            onReturn(settle(rejected, node, name, reason, true, context));
          if (isAsync && receiver !== undefined) {
            return resumeGenerator(
              node,
              receiver,
              "return",
              undefined,
              current,
              context,
              frame,
              unfollowed,
              (requested, promise) =>
                awaitIn(
                  requested,
                  node,
                  promise,
                  undefined,
                  context,
                  (resumer, _settled, _isRejected, onReturn) => settleRejected(resumer, onReturn),
                  exit,
                ),
            );
          }
          return arrayLike !== undefined
            ? exit(settle(current, node, name, reason, true, context))
            : close(current, (closed) =>
                receiver === undefined
                  ? tick(closed, settleRejected, exit)
                  : tick(
                      closed,
                      (resolved, onReturn) => tick(resolved, settleRejected, onReturn),
                      exit,
                    ),
              );
        };
        // The value at a position, which an array-like gives as fromAsync reads it.
        const read = (current: Path, position: number) =>
          arrayLike === undefined
            ? index(identifier(source), [number(position + 1)])
            : useJavaScript(
                "Get",
                [
                  getHeap(current.scope, node, context),
                  identifier(source),
                  string(String(position)),
                ],
                context,
              );
        // The next value, or none at the end, and what the job that reads it does after. A
        // generator's next runs its body, and a throw from it rejects the promise that the
        // iterator's next gives, which fromAsync awaits. An async generator's next gives a
        // promise, which fromAsync awaits.
        const getNext = (
          current: Path,
          position: number,
          exit: (path: Path) => Formula,
          withNext: (
            path: Path,
            value: Expression,
            valueNode: ts.Expression | undefined,
            isDone: boolean,
            exit: (path: Path) => Formula,
          ) => Formula,
        ) => {
          if (receiver === undefined) {
            return withNext(
              current,
              position === count ? getUndefined(context) : read(current, position),
              arrayLike?.getProperty(String(position)) ?? elements?.[position],
              position === count,
              exit,
            );
          }
          if (isAsync) {
            return resumeGenerator(
              node,
              receiver,
              "next",
              undefined,
              current,
              context,
              frame,
              unfollowed,
              (requested, promise) =>
                awaitIn(
                  requested,
                  node,
                  promise,
                  undefined,
                  context,
                  (resumer, settled, isRejected, onReturn) => {
                    if (isRejected) {
                      return onReturn(settle(resumer, node, name, settled, true, context));
                    }
                    const iteration = getIteration(resumer, node, promise);
                    return withNext(
                      resumer,
                      iteration.value,
                      undefined,
                      iteration.isDone,
                      onReturn,
                    );
                  },
                  exit,
                ),
            );
          }
          return resumeGenerator(
            node,
            receiver,
            "next",
            undefined,
            current,
            context,
            {
              ...frame,
              throwTo: (after, thrown) =>
                tick(
                  after,
                  (rejected, onReturn) =>
                    onReturn(settle(rejected, node, name, thrown.value, true, context)),
                  exit,
                ),
            },
            (after, value, isDone, isResult) => {
              if (isResult) {
                throw new TlaTypeScriptError(
                  "tla-ts can't follow Array.fromAsync of a generator that delegates",
                  node,
                );
              }
              return withNext(
                after,
                value ?? getUndefined(context),
                isDone ? undefined : yieldedNode,
                isDone,
                exit,
              );
            },
          );
        };
        const take = (
          current: Path,
          position: number,
          values: Expression[],
          exit: (path: Path) => Formula,
        ): Formula => {
          if (position === count && arrayLike !== undefined) {
            return resolve(current, node, name, tuple(values), undefined, context, exit);
          }
          return getNext(current, position, exit, (read, value, valueNode, isDone, back) => {
            // A rejection of the value closes the iterator in the job that settles its result.
            const next = (
              resumed: Path,
              settled: Expression,
              isRejected: boolean,
              onReturn: (path: Path) => Formula,
            ) =>
              isRejected
                ? onReturn(settle(resumed, node, name, settled, true, context))
                : isDone
                  ? resolve(resumed, node, name, tuple(values), undefined, context, onReturn)
                  : runMapping === undefined
                    ? take(resumed, position + 1, [...values, settled], onReturn)
                    : runMapping(
                        resumed,
                        [settled, number(position)],
                        (mapped, result) =>
                          awaitIn(
                            mapped,
                            node,
                            result,
                            mappedNode,
                            context,
                            (awaited, value, isMappedRejected, onAwaited) =>
                              isMappedRejected
                                ? reject(awaited, value, onAwaited)
                                : take(awaited, position + 1, [...values, value], onAwaited),
                            onReturn,
                          ),
                        (thrown, reason) => reject(thrown, reason, onReturn),
                      );
            // An async iterator's value, which fromAsync doesn't await.
            if (isAsync) return next(read, value, false, back);
            return awaitIn(
              read,
              node,
              value,
              valueNode,
              context,
              (resumer, settled, isRejected, onReturn) => {
                const settle = (resumed: Path, onSettled: (path: Path) => Formula) =>
                  next(resumed, settled, isRejected, onSettled);
                return arrayLike !== undefined
                  ? settle(resumer, onReturn)
                  : isRejected
                    ? close(resumer, (closed) => tick(closed, settle, onReturn))
                    : tick(resumer, settle, onReturn);
              },
              back,
            );
          });
        };
        return take(start, 0, [], (after) =>
          continueWith(after, getPromise(after, node, name).ref),
        );
      };
      const heap = getHeap(made.scope, node, context);
      const getSymbolMethod = (object: Expression, symbol: string) =>
        useJavaScript(
          "Get",
          [heap, object, useJavaScript("WellKnownSymbol", [string(symbol)], context)],
          context,
        );
      const isUndefined = (value: Expression) =>
        useJavaScript("SameValue", [value, getUndefined(context)], context);
      const iterated = identifier(source);
      const prototype =
        iteratedLiteral !== undefined
          ? translateArrayIteratorPrototype(node, context)
          : translateBuiltInValue(
              held !== undefined
                ? "Iterator.prototype"
                : text === undefined
                  ? "Array.prototype"
                  : "String.prototype",
              node,
              context,
            );
      // What fromAsync reads of its items before it runs: their iterators, which an array, a
      // string or a generator inherits, an object's Symbol.asyncIterator, which it lacks where it
      // holds a generator function under Symbol.iterator, or else an array-like's length. An async
      // generator's Symbol.asyncIterator comes from the prototype that a script can't reach.
      const reads =
        arrayLike !== undefined
          ? [
              isUndefined(getSymbolMethod(iterated, "asyncIterator")),
              isUndefined(getSymbolMethod(iterated, "iterator")),
              useJavaScript(
                "SameValue",
                [
                  useJavaScript("Get", [heap, iterated, string("length")], context),
                  translateExpression(arrayLike.length, made.scope, context),
                ],
                context,
              ),
            ]
          : isAsync
            ? []
            : iteratorMethod !== undefined
              ? [isUndefined(getSymbolMethod(iterated, "asyncIterator"))]
              : iteratedLiteral !== undefined
                ? [
                    useJavaScript(
                      "HoldsBuiltIn",
                      [heap, prototype, string("next"), string("%ArrayIteratorPrototype%.next")],
                      context,
                    ),
                    useJavaScript(
                      "HoldsBuiltIn",
                      [
                        heap,
                        translateBuiltInValue("Iterator.prototype", node, context),
                        useJavaScript("WellKnownSymbol", [string("iterator")], context),
                        string("Iterator.prototype.@@iterator"),
                      ],
                      context,
                    ),
                    isUndefined(
                      getSymbolMethod(
                        translateExpression(items, made.scope, context),
                        "asyncIterator",
                      ),
                    ),
                  ]
                : [
                    useJavaScript(
                      "HoldsBuiltIn",
                      [
                        heap,
                        prototype,
                        useJavaScript("WellKnownSymbol", [string("iterator")], context),
                        string(
                          held !== undefined
                            ? "Iterator.prototype.@@iterator"
                            : text === undefined
                              ? "Array.prototype.values"
                              : "String.prototype.@@iterator",
                        ),
                      ],
                      context,
                    ),
                    isUndefined(getSymbolMethod(prototype, "asyncIterator")),
                  ];
      return letIn(
        [
          define(
            source,
            [],
            held !== undefined
              ? held
              : text === undefined
                ? translateExpression(literal ?? items, made.scope, context)
                : tuple([...text].map((character) => translateString(character, context))),
          ),
        ],
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
            ...reads,
          ]),
          iteratorMethod === undefined
            ? iterate(made, held)
            : makeGenerator(
                node,
                iteratorMethod.generator,
                [],
                { value: iterated, method: iteratorMethod.generator },
                made,
                context,
                frame,
                (after, ref) => iterate(after, ref ?? getUndefined(context)),
              ),
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

// Promise.resolve(value), Promise.reject(value), Promise.try(callback), Promise.withResolvers(), or
// a combinator such as Promise.all(values).
const getPromiseFunction = (node: ts.CallExpression, context: Context) => {
  const callee = node.expression;
  return ts.isPropertyAccessExpression(callee) &&
    getBuiltIn(callee.expression, context) === "Promise" &&
    ["resolve", "reject", "try", "withResolvers", ...COMBINATORS].includes(callee.name.text)
    ? callee.name.text
    : undefined;
};

const COMBINATORS = ["all", "allSettled", "any", "race"];

// The array literal that a variable which nothing assigns holds, where the script reads the
// variable only as the combinator's argument or for its length, so the array keeps its elements.
const getHeldLiteral = (node: ts.Identifier, context: Context) => {
  const symbol = getSymbol(node, context.checker);
  const declaration = symbol?.valueDeclaration;
  if (declaration === undefined || !ts.isVariableDeclaration(declaration)) return undefined;
  const initializer = declaration.initializer && getCast(declaration.initializer);
  const uses = findNodes(
    node.getSourceFile(),
    (inner): inner is ts.Identifier =>
      ts.isIdentifier(inner) &&
      inner !== declaration.name &&
      getSymbol(inner, context.checker) === symbol,
  );
  return symbol !== undefined &&
    initializer !== undefined &&
    ts.isArrayLiteralExpression(initializer) &&
    !isAssigned(symbol, node.getSourceFile(), context) &&
    uses.every(
      (use) =>
        use === node ||
        (ts.isPropertyAccessExpression(use.parent) &&
          use.parent.expression === use &&
          use.parent.name.text === "length" &&
          getAssignedTarget(use.parent.parent) !== use.parent &&
          !ts.isDeleteExpression(use.parent.parent)),
    )
    ? initializer
    : undefined;
};

// A combinator of an array written in place, which follows the promises that PromiseResolve gives
// for the elements, or of a value other than an array, which it iterates through the value's
// iterator: what opening or stepping the iterator throws rejects the promise, and tla-ts follows an
// iterator only where it ends before it gives an element. Promise.all fulfills with their values once each fulfills, or rejects with the
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
  const cast = argument && getCast(argument);
  const variable = cast !== undefined && ts.isIdentifier(cast) ? cast : undefined;
  const held = variable && getHeldLiteral(variable, context);
  const literal = held ?? cast;
  const elements =
    literal !== undefined && ts.isArrayLiteralExpression(literal) ? literal : undefined;
  const iterable =
    elements === undefined &&
    cast !== undefined &&
    context.heap !== undefined &&
    !isHeapArray(cast, context) &&
    getKind(cast, context) !== "sequence"
      ? cast
      : undefined;
  if (
    node.arguments.length !== 1 ||
    (iterable === undefined && elements === undefined) ||
    elements?.elements.some(
      (element) => ts.isSpreadElement(element) || ts.isOmittedExpression(element),
    )
  ) {
    throw new TlaTypeScriptError(`Pass Promise.${combinator} an array written in place`, node);
  }
  const ran =
    held === undefined && elements !== undefined
      ? runLeadingCall(elements, path, context, frame, (after) =>
          translatePromiseCombinator(node, combinator, after, context, frame, continueWith),
        )
      : undefined;
  if (ran !== undefined) return ran;
  return makePromise(path, node, context, (made, name) => {
    const parts = elements?.elements ?? [];
    const count = parts.length;
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
    const takeSettled =
      (position: number, field: "value" | "reason", status: string): Handler["run"] =>
      (current, value, onReturn) =>
        allocateObject(
          current,
          node,
          context,
          translateSettled(field, status, value, context),
          (allocated, ref) =>
            take(allocated, position, ref, (after) => onReturn(after, getUndefined(context))),
        );
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
      const element = parts[position];
      // A held array's element that a statement ran keeps the value it gave then.
      const kept = held && current.scope.results.get(element);
      const array = held && variable && translateExpression(variable, current.scope, context);
      const value =
        kept ??
        (array === undefined || variable === undefined
          ? translateExpression(element, current.scope, context)
          : isHeapArray(variable, context)
            ? useJavaScript(
                "Get",
                [getHeap(current.scope, node, context), array, string(String(position))],
                context,
              )
            : index(array, [number(position + 1)]));
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
    const start = (current: Path) =>
      follow(
        setPromise(current, node, name, {
          ...getPromise(current, node, name),
          combined: {
            values: Array.from({ length: count }, () => getUndefined(context)),
            remaining: count + 1,
          },
        }),
        0,
      );
    const leave = (current: Path) => ({
      ...current,
      scope: { ...current.scope, isCatching: made.scope.isCatching },
    });
    const rejectFrame: Frame = {
      ...frame,
      throwTo: (current, thrown) =>
        continueWith(
          settle(leave(current), node, name, thrown.value, true, context),
          getPromise(current, node, name).ref,
        ),
    };
    const catching = { ...made, scope: { ...made.scope, isCatching: true } };
    const value = iterable && translateExpression(iterable, made.scope, context);
    const heap = getHeap(made.scope, node, context);
    return guardBuiltIns(
      node,
      "Promise",
      [combinator, "resolve"],
      made,
      context,
      guardBuiltIns(
        node,
        "Promise.prototype",
        ["then"],
        made,
        context,
        value === undefined
          ? start(made)
          : translateJoined(
              node,
              catching,
              context,
              (after) => throwTypeError(after, node, context, rejectFrame),
              (throwWith) =>
                ifThenElse(
                  apply("/\\", [
                    useJavaScript("IsRef", [value], context),
                    apply("~", [useJavaScript("IsProxy", [heap, value], context)]),
                    apply("~", [useJavaScript("IsArray", [heap, value], context)]),
                  ]),
                  openIterator(
                    node,
                    value,
                    catching,
                    context,
                    rejectFrame,
                    throwWith,
                    (opened, iterator, next) =>
                      stepIterator(
                        node,
                        iterator,
                        "next",
                        next,
                        [],
                        opened,
                        context,
                        rejectFrame,
                        throwWith,
                        (done) => start(leave(done)),
                        (stepped, result) =>
                          readValue(node, result, stepped, context, rejectFrame, () =>
                            leaf(
                              apply("Assert", [
                                boolean(false),
                                string(
                                  `tla-ts can't follow an element that an iterator gives Promise.${combinator}`,
                                ),
                              ]),
                            ),
                          ),
                      ),
                  ),
                  ifThenElse(
                    apply("\\/", [
                      isNullish(value, context),
                      apply("\\in", [
                        useJavaScript("TypeOf", [value], context),
                        set([
                          string("boolean"),
                          string("number"),
                          string("bigint"),
                          string("symbol"),
                        ]),
                      ]),
                    ]),
                    throwWith(catching),
                    leaf(
                      apply("Assert", [
                        boolean(false),
                        string(
                          `tla-ts can't iterate a string or an array that Promise.${combinator} takes`,
                        ),
                      ]),
                    ),
                  ),
                ),
            ),
      ),
    );
  });
};

// A call of a promise's then, catch, or finally, or of Promise.prototype's through call, which
// takes the this first, with the functions that it passes.
interface PromiseMethod {
  method: string;
  receiver: ts.Expression;
  functions: readonly ts.Expression[];
  isCalled: boolean;
}

const getPromiseMethod = (node: ts.CallExpression, context: Context) => {
  const callee = node.expression;
  const called =
    ts.isPropertyAccessExpression(callee) && callee.name.text === "call"
      ? callee.expression
      : undefined;
  const method = called ?? callee;
  if (
    !ts.isPropertyAccessExpression(method) ||
    !["then", "catch", "finally"].includes(method.name.text)
  ) {
    return undefined;
  }
  const owner = getCast(method.expression);
  const receiver = called === undefined ? owner : node.arguments.at(0);
  const isPrototype =
    called !== undefined &&
    ts.isPropertyAccessExpression(owner) &&
    owner.name.text === "prototype" &&
    getBuiltIn(owner.expression, context) === "Promise";
  return receiver !== undefined && (isPrototype || isPromiseType(owner, context))
    ? {
        method: method.name.text,
        receiver: getCast(receiver),
        functions: called === undefined ? node.arguments : node.arguments.slice(1),
        isCalled: called !== undefined,
      }
    : undefined;
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
      isExecutorDeclaration(executor, context) ||
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

// Whether a type is the object that Promise.withResolvers gives.
const isWithResolvers = (type: ts.Type) =>
  type.getSymbol()?.name === "PromiseWithResolvers" &&
  (type.getSymbol()?.declarations ?? []).every(
    (declaration) => declaration.getSourceFile().isDeclarationFile,
  );

// Whether a function that a node names may be a promise's resolve or reject: a parameter of an
// executor, a variable that the script assigns one, or the resolve or reject of what
// Promise.withResolvers gives, which a property or a pattern reads.
const isResolver = (node: ts.Expression, context: Context) => {
  const cast = skipCasts(node);
  if (ts.isPropertyAccessExpression(cast)) {
    return (
      ["resolve", "reject"].includes(cast.name.text) &&
      isWithResolvers(context.checker.getTypeAtLocation(cast.expression))
    );
  }
  const symbol = ts.isIdentifier(cast) ? getSymbol(cast, context.checker) : undefined;
  const declaration = symbol?.valueDeclaration;
  return (
    symbol !== undefined &&
    ((declaration !== undefined && isResolverParameter(declaration, context)) ||
      getResolverHolders(cast.getSourceFile(), context).has(symbol) ||
      (declaration !== undefined &&
        ts.isBindingElement(declaration) &&
        ts.isObjectBindingPattern(declaration.parent) &&
        ["resolve", "reject"].includes((declaration.propertyName ?? declaration.name).getText()) &&
        isWithResolvers(context.checker.getTypeAtLocation(declaration.parent))))
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
  const calleeNode = ts.isCallExpression(node) ? node.expression : node;
  const held = ts.isExpression(calleeNode) ? getHeld(path, node, calleeNode, context) : undefined;
  const heldRef =
    held?.key === "resolve"
      ? held.promise.resolvers?.resolve
      : held?.key === "reject"
        ? held.promise.resolvers?.reject
        : undefined;
  const expected = heldRef && all.find((resolver) => isSameExpression(resolver.ref, heldRef));
  if (heldRef !== undefined && expected !== undefined) {
    return ifThenElse(
      useJavaScript("SameValue", [callee, heldRef], context),
      expected.run(),
      leaf(apply("Assert", [boolean(false), string("tla-ts can't tell which function this is")])),
    );
  }
  return all.reduceRight(
    (rest, resolver) =>
      ifThenElse(useJavaScript("SameValue", [callee, resolver.ref], context), resolver.run(), rest),
    leaf(apply("Assert", [boolean(false), string("tla-ts can't tell which function this is")])),
  );
};

// A function declaration that the script names only as the executor that new Promise takes.
const isExecutorDeclaration = (node: ts.Node, context: Context): node is ts.FunctionDeclaration => {
  if (!ts.isFunctionDeclaration(node) || node.name === undefined || node.body === undefined) {
    return false;
  }
  const symbol = getSymbol(node.name, context.checker);
  return (
    symbol !== undefined &&
    findNodes(
      node.getSourceFile(),
      (inner): inner is ts.Identifier =>
        ts.isIdentifier(inner) &&
        inner !== node.name &&
        getSymbol(inner, context.checker) === symbol,
    ).every((use) => {
      const construction = ts.findAncestor(
        use.parent,
        (ancestor) => !ts.isParenthesizedExpression(ancestor) && !ts.isAsExpression(ancestor),
      );
      return (
        construction !== undefined &&
        ts.isNewExpression(construction) &&
        isPromiseConstruction(construction, context) &&
        construction.arguments?.length === 1 &&
        getCast(construction.arguments[0]) === use
      );
    })
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
  const declaration =
    argument !== undefined && ts.isIdentifier(argument)
      ? getSymbol(argument, context.checker)?.valueDeclaration
      : undefined;
  const executor =
    argument !== undefined && (ts.isArrowFunction(argument) || ts.isFunctionExpression(argument))
      ? argument
      : declaration !== undefined && isExecutorDeclaration(declaration, context)
        ? declaration
        : undefined;
  if (executor === undefined) {
    throw new TlaTypeScriptError("Pass new Promise a function written in place", node);
  }
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
  const resolvingFunction = translateResolvingFunction(node, context);
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
          getBody(executor, start.scope, context),
          {
            ...start,
            scope: {
              ...start.scope,
              bindings,
              isCatching: true,
              receiver: getCalledReceiver(executor, start.scope.receiver, context),
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
  ts.isFunctionExpression(node) ||
  ts.isArrowFunction(node) ||
  (ts.isArrayLiteralExpression(node) && node.elements.every(isInert)) ||
  (ts.isObjectLiteralExpression(node) && node.properties.length === 0);

// Whether NewPromiseCapability(C) throws a TypeError before it runs any code: C isn't an object or
// a constructor, or its body is empty, so it never calls the executor. A global's built-in function
// may be a constructor, which the check then stops at.
const isIncapable = (node: ts.Expression | undefined, path: Path, context: Context) => {
  if (node === undefined || getBuiltIn(getCast(node), context) !== undefined) return true;
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
  const name =
    callee !== undefined && ts.isVariableDeclaration(callee) && ts.isIdentifier(callee.name)
      ? callee.name
      : constructor.name;
  const symbol = name && getSymbol(name, context.checker);
  const outer = ts.findAncestor(
    constructor.parent,
    (ancestor) => !ts.isParenthesizedExpression(ancestor) && !ts.isAsExpression(ancestor),
  );
  const isPassedOnly =
    ts.isFunctionExpression(constructor) && constructor === getCast(node)
      ? constructor.name === undefined &&
        outer !== undefined &&
        ts.isCallExpression(outer) &&
        outer.arguments[0] !== undefined &&
        getCast(outer.arguments[0]) === constructor &&
        getCalledPromiseFunction(outer, context) !== undefined
      : symbol !== undefined &&
        findNodes(
          constructor.getSourceFile(),
          (inner): inner is ts.Identifier =>
            ts.isIdentifier(inner) &&
            inner !== name &&
            getSymbol(inner, context.checker) === symbol,
        ).every((reference) => {
          const call = ts.findAncestor(
            reference.parent,
            (ancestor) => !ts.isParenthesizedExpression(ancestor) && !ts.isAsExpression(ancestor),
          );
          // NewPromiseCapability reads none of C's properties but its prototype, which C's body
          // never sees.
          return (
            call !== undefined &&
            ((ts.isPropertyAccessExpression(call) &&
              getCast(call.expression) === reference &&
              ts.isBinaryExpression(call.parent) &&
              call.parent.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
              call.parent.left === call) ||
              (ts.isCallExpression(call) &&
                call.arguments[0] !== undefined &&
                getCast(call.arguments[0]) === reference &&
                (getCalledPromiseFunction(call, context) !== undefined ||
                  (ts.isPropertyAccessExpression(call.expression) &&
                    getBuiltIn(call.expression.expression, context) === "Object" &&
                    call.expression.name.text === "defineProperty"))))
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
// a TypeError follows where C doesn't pass it two functions. The capability's promise is what C
// gives, or the object that new made for it where it gives no object.
const translateCapability = (
  node: ts.CallExpression,
  constructor: ts.FunctionDeclaration | ts.FunctionExpression,
  path: Path,
  context: Context,
  frame: Frame,
  onCapability:
    | ((path: Path, promise: Expression, resolve: Callable, reject: Callable) => Formula)
    | undefined,
): Formula => {
  const executor = constructor.parameters[0];
  const symbol = executor && getSymbol(executor.name, context.checker);
  const untaken = { value: getUndefined(context), run: undefined };
  const run = (begun: Path, instance: Expression) => {
    const tasks = getTasks(begun, node);
    const start =
      symbol === undefined
        ? begun
        : withTasks(begun, {
            ...tasks,
            capabilities: new Map([
              ...tasks.capabilities,
              [symbol, { resolve: untaken, reject: untaken }],
            ]),
          });
    const finish = (after: Path, returned?: Expression) => {
      const taken = symbol && getTasks(after, node).capabilities.get(symbol);
      const heap = getHeap(after.scope, node, context);
      const isCallable = (value: Expression) =>
        apply("=", [useJavaScript("TypeOfIn", [heap, value], context), string("function")]);
      // The executor's capability is gone once the body ends.
      const left = {
        ...withTasks(
          after,
          keepTasks(
            { ...getTasks(after, node), capabilities: getTasks(path, node).capabilities },
            getTasks(path, node),
          ),
        ),
        scope: {
          ...after.scope,
          previous: path.scope.previous,
          isCatching: path.scope.isCatching,
          receiver: path.scope.receiver,
        },
      };
      if (taken === undefined) return throwError("TypeError", left, node, context, frame);
      const resolve = taken.resolve.run;
      const reject = taken.reject.run;
      const promiseName = context.names.getFresh("constructed");
      const capable =
        onCapability === undefined || resolve === undefined || reject === undefined
          ? leaf(
              apply("Assert", [
                boolean(false),
                string("tla-ts can't follow a promise that a script's constructor makes"),
              ]),
            )
          : returned === undefined
            ? onCapability(
                left,
                instance,
                { ref: taken.resolve.value, run: resolve },
                { ref: taken.reject.value, run: reject },
              )
            : bindOnce(
                left,
                promiseName,
                ifExpression(
                  useJavaScript("IsObjectIn", [heap, returned], context),
                  returned,
                  instance,
                ),
                onCapability(
                  left,
                  identifier(promiseName),
                  { ref: taken.resolve.value, run: resolve },
                  { ref: taken.reject.value, run: reject },
                ),
              );
      return ifThenElse(
        apply("/\\", [isCallable(taken.resolve.value), isCallable(taken.reject.value)]),
        capable,
        throwError("TypeError", left, node, context, frame),
      );
    };
    return translateStatements(
      getBody(constructor, start.scope, context),
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
  const argument = node.arguments[0];
  return onCapability === undefined
    ? run(path, getUndefined(context))
    : allocateObject(
        path,
        node,
        context,
        useJavaScript(
          "WithPrototype",
          [
            identifier("EmptyObject"),
            useJavaScript(
              "Get",
              [
                getHeap(path.scope, node, context),
                translateExpression(argument, path.scope, context),
                string("prototype"),
              ],
              context,
            ),
          ],
          context,
        ),
        run,
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
  // The functions that the constructor's body makes are objects of their own each time it runs.
  const take = (
    current: Path,
    position: number,
    taken: Taken[],
    continueWithTaken: (path: Path, taken: Taken[]) => Formula,
  ): Formula => {
    if (position === 2) return continueWithTaken(current, taken);
    const next = (after: Path, value: Taken) =>
      take(after, position + 1, [...taken, value], continueWithTaken);
    const argument = node.arguments.at(position);
    const cast = argument && getCast(argument);
    if (cast === undefined) return next(current, { value: getUndefined(context), run: undefined });
    if (isResolver(cast, context)) {
      const resolver = translateExpression(cast, current.scope, context);
      return next(current, {
        value: resolver,
        run: (later, given, onReturn) =>
          callResolver(
            node,
            resolver,
            given.at(0) ?? getUndefined(context),
            undefined,
            later,
            context,
            (after) => onReturn(after, getUndefined(context)),
          ),
      });
    }
    const callee = getCallback(cast, path, context) ?? getAsyncCallee(cast, path, context);
    const run =
      callee &&
      getCallbackRunner(
        callee,
        ts.isArrowFunction(callee) ? path.scope.receiver : undefined,
        path,
        context,
        frame,
      );
    const made =
      callee !== undefined &&
      (ts.isFunctionExpression(callee) ||
        ts.isArrowFunction(callee) ||
        ts.isFunctionDeclaration(callee)) &&
      (cast === callee ||
        (ts.isFunctionDeclaration(callee) &&
          ts.findAncestor(callee.parent, ts.isFunctionLike) !== undefined))
        ? callee
        : undefined;
    return made === undefined
      ? next(current, { value: translateExpression(cast, current.scope, context), run })
      : allocateObject(
          current,
          node,
          context,
          useJavaScript(
            !ts.isArrowFunction(made) && !isAsyncFunction(made) ? "FunctionObject" : "MethodObject",
            [
              translateBuiltInValue("Function.prototype", node, context),
              translateFunctionValue(made, context),
            ],
            context,
          ),
          (allocated, ref) => next(allocated, { value: ref, run }),
        );
  };
  const isSet = (value: Expression) =>
    apply("~", [useJavaScript("SameValue", [value, getUndefined(context)], context)]);
  return take(path, 0, [], (made, values) =>
    ifThenElse(
      apply("\\/", [isSet(taken.resolve.value), isSet(taken.reject.value)]),
      throwError("TypeError", made, node, context, frame),
      continueWith(
        withTasks(made, {
          ...getTasks(made, node),
          capabilities: new Map([
            ...tasks.capabilities,
            [symbol, { resolve: values[0], reject: values[1] }],
          ]),
        }),
        getUndefined(context),
      ),
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

// Promise.all and the like with the capability of a script's constructor C, which call C.resolve
// with each element, and the then of what that gives with the element's functions, and settle the
// capability through its own. The capability's reject takes what a step throws.
const combineCapability = (
  node: ts.CallExpression,
  combinator: string,
  elements: readonly { node: ts.Expression; value: Expression }[],
  path: Path,
  promise: Expression,
  resolve: Callable,
  reject: Callable,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value?: Expression) => Formula,
): Formula => {
  const argument = node.arguments[0];
  const constructor = translateExpression(argument, path.scope, context);
  const symbol = getSymbol(getCast(argument), context.checker);
  // The functions that the code assigns C.resolve.
  const candidates =
    symbol === undefined
      ? []
      : findNodes(
          node.getSourceFile(),
          (inner): inner is ts.BinaryExpression =>
            ts.isBinaryExpression(inner) &&
            inner.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
            ts.isPropertyAccessExpression(inner.left) &&
            inner.left.name.text === "resolve" &&
            getSymbol(getCast(inner.left.expression), context.checker) === symbol,
        ).flatMap((assignment) => {
          const assigned = getCast(assignment.right);
          return ts.isFunctionExpression(assigned) || ts.isArrowFunction(assigned)
            ? [assigned]
            : [];
        });
  const uncaught = apply("Assert", [boolean(false), string(node.getText())]);
  const rethrow = (after: Path, thrown: Expression) =>
    frame.throwTo === undefined
      ? leaf(uncaught)
      : frame.throwTo(after, { value: thrown, uncaught });
  // Where no variable can hold the element's functions, the code can't call them once the
  // combinator returns.
  const isHeld = getResolverHolders(node.getSourceFile(), context).size > 0;
  const give = (after: Path) => {
    const tasks = getTasks(after, node);
    const before = getTasks(path, node);
    return continueWith(
      isHeld
        ? after
        : withTasks(
            after,
            keepTasks(
              { ...tasks, callables: before.callables, combinations: before.combinations },
              before,
            ),
          ),
      promise,
    );
  };
  const rejectWith = (after: Path, thrown: Expression) =>
    reject.run(after, [thrown], give, rethrow);
  const typeError = translateEngineError("TypeError", node, context);
  context.prelude.add("Null");
  const name = context.names.getFresh("combined");
  const getCombination = (current: Path) => {
    const combination = getTasks(current, node).combinations.get(name);
    if (combination === undefined) {
      throw new TlaTypeScriptError(`Unsupported Promise.${combinator}`, node);
    }
    return combination;
  };
  const setCombination = (current: Path, combination: Combination, callables: Callable[] = []) => {
    const tasks = getTasks(current, node);
    return withTasks(current, {
      ...tasks,
      callables: [...tasks.callables, ...callables],
      combinations: new Map([...tasks.combinations, [name, combination]]),
    });
  };
  // Settles the capability once no element remains: Promise.any rejects with an AggregateError of
  // the reasons, and the others resolve with the values.
  const complete = (
    current: Path,
    combination: Combination,
    onReturn: (path: Path, result: Expression) => Formula,
    onThrow: (path: Path, thrown: Expression) => Formula,
  ) =>
    combinator === "any"
      ? reject.run(
          current,
          [translateEngineError("AggregateError", node, context, tuple([...combination.values]))],
          onReturn,
          onThrow,
        )
      : resolve.run(current, [tuple([...combination.values])], onReturn, onThrow);
  // An element's function, which runs once between those of the element, and settles the
  // capability where it takes the last element.
  const getElement =
    (position: number, settled: [field: "value" | "reason", status: string] | undefined): Runner =>
    (current, given, onReturn, onThrow) => {
      const combination = getCombination(current);
      if (combination.isCalled[position]) return onReturn(current, getUndefined(context));
      const take = (after: Path, value: Expression) => {
        const taken = {
          values: combination.values.map((other, index) => (index === position ? value : other)),
          remaining: combination.remaining - 1,
          isCalled: combination.isCalled.map((other, index) => index === position || other),
        };
        const next = setCombination(after, taken);
        return taken.remaining > 0
          ? onReturn(next, getUndefined(context))
          : complete(next, taken, onReturn, onThrow);
      };
      const value = given.at(0) ?? getUndefined(context);
      return settled === undefined
        ? take(current, value)
        : allocateObject(
            current,
            node,
            context,
            translateSettled(settled[0], settled[1], value, context),
            take,
          );
    };
  // Allocates the functions of an element, which the next then takes with those of the capability.
  const allocateElements = (
    current: Path,
    position: number,
    continueWithElements: (path: Path, functions: Expression[]) => Formula,
  ) => {
    const combination = getCombination(current);
    const added = setCombination(current, {
      values: [...combination.values, getUndefined(context)],
      remaining: combination.remaining + 1,
      isCalled: [...combination.isCalled, false],
    });
    const allocate = (
      at: Path,
      runners: Runner[],
      continueWithRefs: (path: Path, refs: Expression[]) => Formula,
    ): Formula =>
      runners.length === 0
        ? continueWithRefs(at, [])
        : allocateObject(
            at,
            node,
            context,
            translateResolvingFunction(node, context),
            (allocated, ref) =>
              allocate(allocated, runners.slice(1), (after, refs) =>
                continueWithRefs(
                  setCombination(after, getCombination(after), [{ ref, run: runners[0] }]),
                  [ref, ...refs],
                ),
              ),
          );
    return combinator === "all"
      ? allocate(added, [getElement(position, undefined)], (after, refs) =>
          continueWithElements(after, [refs[0], reject.ref]),
        )
      : combinator === "allSettled"
        ? allocate(
            added,
            [
              getElement(position, ["value", "fulfilled"]),
              getElement(position, ["reason", "rejected"]),
            ],
            continueWithElements,
          )
        : combinator === "any"
          ? allocate(added, [getElement(position, undefined)], (after, refs) =>
              continueWithElements(after, [resolve.ref, refs[0]]),
            )
          : continueWithElements(current, [resolve.ref, reject.ref]);
  };
  const promiseResolveName = context.names.getFresh("promiseResolve");
  const promiseResolve = identifier(promiseResolveName);
  const follow = (current: Path, position: number): Formula => {
    if (position === elements.length) {
      if (combinator === "race") return give(current);
      const combination = getCombination(current);
      const taken = { ...combination, remaining: combination.remaining - 1 };
      const next = setCombination(current, taken);
      return taken.remaining > 0
        ? give(next)
        : complete(next, taken, give, combinator === "any" ? rethrow : rejectWith);
    }
    const heap = getHeap(current.scope, node, context);
    const invoke =
      (candidate: ts.FunctionExpression | ts.ArrowFunction) =>
      (called: Path, result: Expression) => {
        // A resolve that gives its argument back gives a value of the element's type, which tla-ts
        // takes to hold a then that it calls where the type has one.
        const parameter = candidate.parameters.at(0);
        const body = candidate.body;
        const statement = ts.isBlock(body) ? body.statements.at(0) : undefined;
        const returned = !ts.isBlock(body)
          ? body
          : body.statements.length === 1 &&
              statement !== undefined &&
              ts.isReturnStatement(statement)
            ? statement.expression
            : undefined;
        const valueNode =
          parameter !== undefined &&
          ts.isIdentifier(parameter.name) &&
          returned !== undefined &&
          ts.isIdentifier(getCast(returned)) &&
          getSymbol(getCast(returned), context.checker) ===
            getSymbol(parameter.name, context.checker)
            ? elements[position].node
            : undefined;
        const isTyped = valueNode !== undefined && hasCallable(valueNode, "then", context);
        const lacksThen = leaf(
          apply("Assert", [
            boolean(false),
            string("tla-ts can't call the then of a value whose type has a then it lacks"),
          ]),
        );
        const nextName = context.names.getFresh("next");
        const thenName = context.names.getFresh("then");
        const next = identifier(nextName);
        const then = identifier(thenName);
        const calledHeap = getHeap(called.scope, node, context);
        return bindOnce(
          called,
          nextName,
          result,
          allocateElements(called, position, (allocated, functions) => {
            const allocatedHeap = getHeap(allocated.scope, node, context);
            return ifThenElse(
              useJavaScript("IsObjectIn", [calledHeap, next], context),
              bindOnce(
                allocated,
                thenName,
                useJavaScript("Get", [allocatedHeap, next, string("then")], context),
                ifThenElse(
                  apply("=", [
                    useJavaScript("TypeOfIn", [allocatedHeap, then], context),
                    string("function"),
                  ]),
                  invokeThen(
                    allocated,
                    node,
                    next,
                    then,
                    getThenFunctions(node, valueNode, context),
                    functions,
                    context,
                    (after) => follow(after, position + 1),
                    rejectWith,
                  ),
                  isTyped ? lacksThen : rejectWith(allocated, typeError),
                ),
              ),
              isTyped
                ? lacksThen
                : ifThenElse(
                    apply("\\in", [next, set([getUndefined(context), identifier("Null")])]),
                    rejectWith(allocated, typeError),
                    leaf(
                      apply("Assert", [
                        boolean(false),
                        string("tla-ts can't read the then of a primitive"),
                      ]),
                    ),
                  ),
            );
          }),
        );
      };
    return candidates.reduceRight(
      (otherwise, candidate) => {
        const candidateValue = getCandidateValue(candidate, context);
        return candidateValue === undefined
          ? otherwise
          : ifThenElse(
              apply("=", [
                useJavaScript("CodeOf", [heap, promiseResolve], context),
                candidateValue,
              ]),
              getCallbackRunner(
                candidate,
                ts.isArrowFunction(candidate)
                  ? path.scope.receiver
                  : { value: constructor, method: candidate },
                path,
                context,
                frame,
              )(current, [elements[position].value], invoke(candidate), rejectWith),
              otherwise,
            );
      },
      leaf(
        apply("Assert", [
          boolean(false),
          string("tla-ts can't tell which resolve this constructor has"),
        ]),
      ),
    );
  };
  const heap = getHeap(path.scope, node, context);
  const passed =
    combinator === "all"
      ? [reject]
      : combinator === "any"
        ? [resolve]
        : combinator === "race"
          ? [resolve, reject]
          : [];
  const start = setCombination(path, { values: [], remaining: 1, isCalled: [] }, passed);
  return bindOnce(
    start,
    promiseResolveName,
    useJavaScript("Get", [heap, constructor, string("resolve")], context),
    ifThenElse(
      apply("=", [useJavaScript("TypeOfIn", [heap, promiseResolve], context), string("function")]),
      follow(start, 0),
      // tla-ts takes a resolve whose type it can call to be a function.
      hasCallable(argument, "resolve", context)
        ? leaf(
            apply("Assert", [
              boolean(false),
              string("tla-ts can't call the resolve of a constructor whose type has one it lacks"),
            ]),
          )
        : rejectWith(start, typeError),
    ),
  );
};

// Calls a function that may be a promise's resolve or reject, or one that a combinator passed a
// then.
const callResolving = (
  node: ts.Node,
  callee: Expression,
  values: Expression[],
  valueNode: ts.Expression | undefined,
  path: Path,
  context: Context,
  onReturn: (path: Path, result: Expression) => Formula,
  onThrow: (path: Path, thrown: Expression) => Formula,
): Formula => {
  const callables = getTasks(path, node).callables;
  const found = callables.find((callable) => isSameExpression(callable.ref, callee));
  return found !== undefined
    ? found.run(path, values, onReturn, onThrow)
    : callables.reduceRight(
        (rest, callable) =>
          ifThenElse(
            useJavaScript("SameValue", [callee, callable.ref], context),
            callable.run(path, values, onReturn, onThrow),
            rest,
          ),
        callResolver(
          node,
          callee,
          values.at(0) ?? getUndefined(context),
          valueNode,
          path,
          context,
          (after) => onReturn(after, getUndefined(context)),
        ),
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
    const iterable = node.arguments.at(1);
    const cast = iterable && getCast(iterable);
    // A constructor that a name gives, whose resolve and prototype the combinator reads, which
    // the heap holds.
    const elements =
      constructor !== undefined &&
      isHeapFunction(constructor, context) &&
      argument !== undefined &&
      ts.isIdentifier(getCast(argument)) &&
      COMBINATORS.includes(called) &&
      node.arguments.length === 2 &&
      cast !== undefined &&
      ts.isArrayLiteralExpression(cast) &&
      cast.elements.every(
        (element) => !ts.isSpreadElement(element) && !ts.isOmittedExpression(element),
      )
        ? cast
        : undefined;
    if (
      (constructor === undefined && !isIncapable(argument, path, context)) ||
      (elements === undefined && !node.arguments.slice(1).every(isInert))
    ) {
      throw new TlaTypeScriptError(`Unsupported call: Promise.${called}.call`, node);
    }
    const ran =
      elements &&
      runLeadingCall(elements, path, context, frame, (after) =>
        translatePromiseCall(node, after, context, frame, continueWith),
      );
    if (ran !== undefined) return ran;
    const values = elements?.elements.map((element) => ({
      node: element,
      value: translateExpression(element, path.scope, context),
    }));
    const translateCalled = (next: (path: Path, value?: Expression) => Formula) =>
      guardBuiltIns(
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
            ? argument !== undefined && getBuiltIn(getCast(argument), context) !== undefined
              ? ifThenElse(
                  useJavaScript(
                    "IsConstructor",
                    [
                      getHeap(path.scope, node, context),
                      translateExpression(argument, path.scope, context),
                    ],
                    context,
                  ),
                  leaf(
                    apply("Assert", [
                      boolean(false),
                      string("tla-ts can't follow a promise that a built-in constructor makes"),
                    ]),
                  ),
                  throwError("TypeError", path, node, context, frame),
                )
              : throwError("TypeError", path, node, context, frame)
            : translateCapability(
                node,
                constructor,
                path,
                context,
                frame,
                values &&
                  ((made, promise, resolve, reject) =>
                    combineCapability(
                      node,
                      called,
                      values,
                      made,
                      promise,
                      resolve,
                      reject,
                      context,
                      frame,
                      next,
                    )),
              ),
        ),
      );
    // The constructor, the resolve, and the thens may run any function, so what follows takes
    // whatever the code changes.
    return values === undefined
      ? translateCalled(continueWith)
      : translateJoined(
          node,
          path,
          context,
          continueWith,
          translateCalled,
          getChanged(node.getSourceFile(), path, context),
        );
  }
  if (isResolver(node.expression, context)) {
    const uncaught = apply("Assert", [boolean(false), string(node.getText())]);
    return callResolving(
      node,
      translateExpression(node.expression, path.scope, context),
      node.arguments.map((inner) => translateExpression(inner, path.scope, context)),
      argument,
      path,
      context,
      continueWith,
      (after, thrown) =>
        frame.throwTo === undefined
          ? leaf(uncaught)
          : frame.throwTo(after, { value: thrown, uncaught }),
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
  // Promise.try makes a promise, then calls the callback, and settles the promise with what it
  // gives or throws.
  if (promiseFunction === "try") {
    const callee =
      argument === undefined
        ? undefined
        : (getCallback(getCast(argument), path, context) ??
          getAsyncCallee(getCast(argument), path, context));
    if (callee === undefined || node.arguments.length > 1) {
      throw new TlaTypeScriptError("Pass Promise.try only a function that tla-ts can follow", node);
    }
    const runCallback = getCallbackRunner(
      callee,
      ts.isArrowFunction(callee) ? path.scope.receiver : undefined,
      path,
      context,
      frame,
    );
    return guardBuiltIns(
      node,
      "Promise",
      ["try"],
      path,
      context,
      makePromise(path, node, context, (made, name) => {
        const ref = getPromise(made, node, name).ref;
        return runCallback(
          made,
          [],
          (after, result) =>
            resolve(after, node, name, result, undefined, context, (resolved) =>
              continueWith(resolved, ref),
            ),
          (after, thrown) => continueWith(settle(after, node, name, thrown, true, context), ref),
        );
      }),
    );
  }
  // Promise.withResolvers makes a promise and its resolving functions, and an object that holds the
  // three.
  if (promiseFunction === "withResolvers") {
    const resolvingFunction = translateResolvingFunction(node, context);
    return guardBuiltIns(
      node,
      "Promise",
      ["withResolvers"],
      path,
      context,
      makePromise(path, node, context, (made, name) =>
        allocateObject(made, node, context, resolvingFunction, (withResolve, resolveRef) =>
          allocateObject(withResolve, node, context, resolvingFunction, (withReject, rejectRef) => {
            const promise = getPromise(withReject, node, name);
            return allocateObject(
              setPromise(withReject, node, name, {
                ...promise,
                resolvers: { resolve: resolveRef, reject: rejectRef },
                made: node,
              }),
              node,
              context,
              defineData(
                defineData(
                  defineData(identifier("EmptyObject"), "promise", promise.ref, context),
                  "resolve",
                  resolveRef,
                  context,
                ),
                "reject",
                rejectRef,
                context,
              ),
              (after, ref) => continueWith(after, ref),
            );
          }),
        ),
      ),
    );
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
  const functions = promiseMethod.functions;
  const handlers =
    promiseMethod.method === "then"
      ? [
          getHandler(functions.at(0), path, context, frame),
          getHandler(functions.at(1), path, context, frame),
        ]
      : promiseMethod.method === "catch"
        ? [undefined, getHandler(functions.at(0), path, context, frame)]
        : getFinallyHandlers(node, functions.at(0), path, context, frame);
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
  const other = () =>
    promiseMethod.isCalled
      ? translateOtherReceiver(node, promiseMethod, received, path, context, frame, continueWith)
      : leaf(apply("Assert", [boolean(false), string("tla-ts can't tell which promise this is")]));
  const reacted = guardBuiltIns(
    node,
    "Promise.prototype",
    promiseMethod.method === "then"
      ? ["then", "constructor"]
      : [promiseMethod.method, "then", "constructor"],
    path,
    context,
    promiseMethod.isCalled && !isPossiblePromise(receiver, received, context)
      ? other()
      : dispatchPromise(
          path,
          node,
          received,
          receiver,
          context,
          (held) => react(path, held),
          other,
        ),
  );
  return promiseMethod.isCalled
    ? guardBuiltIns(node, "Function.prototype", ["call"], path, context, reacted)
    : reacted;
};

// Promise.prototype's then, catch, or finally with a this that isn't a promise. then throws a
// TypeError. catch calls Invoke(this, "then", «undefined, onRejected»), whose GetV throws a
// TypeError for undefined or null. finally throws a TypeError for a this that isn't an object, and
// otherwise takes SpeciesConstructor(this, %Promise%) before it calls the this's then.
const translateOtherReceiver = (
  node: ts.CallExpression,
  promiseMethod: PromiseMethod,
  received: Expression,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value?: Expression) => Formula,
): Formula => {
  const uncaught = apply("Assert", [boolean(false), string(node.getText())]);
  const throwError = (after: Path, thrown: Expression) =>
    frame.throwTo === undefined
      ? leaf(uncaught)
      : frame.throwTo(after, { value: thrown, uncaught });
  const typeError = translateEngineError("TypeError", node, context);
  if (promiseMethod.method === "then") return throwError(path, typeError);
  const stop = (message: string) => leaf(apply("Assert", [boolean(false), string(message)]));
  if (
    !promiseMethod.functions.every((inner) => getRunner(inner, path, context, frame) === undefined)
  ) {
    return stop("tla-ts can't pass a function to the then of a value that isn't a promise");
  }
  const heap = getHeap(path.scope, node, context);
  const isObject = useJavaScript("IsObjectIn", [heap, received], context);
  const thenName = context.names.getFresh("then");
  const then = identifier(thenName);
  const invoke = bindOnce(
    path,
    thenName,
    useJavaScript("Get", [heap, received, string("then")], context),
    ifThenElse(
      apply("=", [useJavaScript("TypeOfIn", [heap, then], context), string("function")]),
      invokeThen(
        path,
        node,
        received,
        then,
        getThenFunctions(node, promiseMethod.receiver, context),
        [getUndefined(context), getUndefined(context)],
        context,
        (after, value) => continueWith(after, value ?? getUndefined(context)),
        throwError,
      ),
      throwError(path, typeError),
    ),
  );
  if (promiseMethod.method === "catch") {
    return ifThenElse(
      isObject,
      invoke,
      ifThenElse(
        apply("\\in", [received, set([getUndefined(context), identifier("Null")])]),
        throwError(path, typeError),
        stop("tla-ts can't read the then of a primitive"),
      ),
    );
  }
  context.builtIns.add("Object");
  context.builtIns.add("Function.prototype");
  const constructorName = context.names.getFresh("constructor");
  const constructor = identifier(constructorName);
  return ifThenElse(
    isObject,
    bindOnce(
      path,
      constructorName,
      useJavaScript("Get", [heap, received, string("constructor")], context),
      ifThenElse(
        apply("=", [constructor, getUndefined(context)]),
        invoke,
        ifThenElse(
          useJavaScript("IsObjectIn", [heap, constructor], context),
          ifThenElse(
            apply("\\in", [
              useJavaScript(
                "Get",
                [heap, constructor, useJavaScript("WellKnownSymbol", [string("species")], context)],
                context,
              ),
              set([getUndefined(context), identifier("Null")]),
            ]),
            invoke,
            stop("tla-ts can't tell which constructor a species gives"),
          ),
          throwError(path, typeError),
        ),
      ),
    ),
    throwError(path, typeError),
  );
};

// Runs the jobs that the path queued, in order, and then its timers, each with the jobs it queues.
// As Node does by default, a promise that is rejected with no reaction once the jobs run out ends
// the program.
export const drainTasks = (
  path: Path,
  context: Context,
  finish: (path: Path) => Formula,
): Formula => {
  const tasks = path.tasks;
  if (tasks === undefined) return finish(path);
  const job = tasks.jobs.at(0);
  if (job !== undefined) {
    return job.run(withTasks(path, { ...tasks, jobs: tasks.jobs.slice(1) }), (after) =>
      drainTasks(after, context, finish),
    );
  }
  const unhandled = [...tasks.promises.values()].filter(
    (promise) => promise.state === "rejected" && !promise.isHandled,
  );
  if (unhandled.length > 0) {
    // A script reports the one promise that rejected with a primitive as Node does, which says
    // the reason.
    return leaf(
      apply("Assert", [
        boolean(false),
        context.script !== undefined && unhandled.length === 1
          ? useJavaScript(
              "UnhandledRejection",
              [unhandled[0].value ?? getUndefined(context)],
              context,
            )
          : string("A promise rejected with no handler"),
      ]),
    );
  }
  const timer = tasks.timers.at(0);
  return timer === undefined
    ? finish(path)
    : timer.run(withTasks(path, { ...tasks, timers: tasks.timers.slice(1) }), (after) =>
        drainTasks(after, context, finish),
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
  node: ts.Node,
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
      bindCall(
        node,
        callee,
        ts.isCallExpression(node) ? node.arguments : [],
        receiver,
        made,
        context,
        rejectFrame,
        bindWith,
      ),
    continueWith,
  );

// Runs a built-in async function's body, such as an AsyncDisposableStack's disposeAsync, which
// gives a promise that settles as the body returns or throws.
export const translateAsyncBuiltIn = (
  node: ts.Node,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value?: Expression) => Formula,
  run: (path: Path, frame: Frame) => Formula,
): Formula =>
  runAsyncBody(
    node,
    run,
    path,
    context,
    frame,
    (made, _rejectFrame, bindWith) => bindWith({ definitions: [], scope: made.scope }, made),
    continueWith,
  );

// Runs an async function's body once a call binds its parameters, and gives its promise.
const runAsyncBody = (
  node: ts.Node,
  // The async function, or the body of a built-in one.
  body: FunctionNode | ((path: Path, frame: Frame) => Formula),
  path: Path,
  context: Context,
  frame: Frame,
  bind: (path: Path, frame: Frame, continueWith: (bound: Bound, path: Path) => Formula) => Formula,
  continueWith: (path: Path, value?: Expression) => Formula,
): Formula =>
  makePromise(path, node, context, (made, name) => {
    const ref = getPromise(made, node, name).ref;
    const callee = typeof body === "function" ? undefined : body;
    // A call of a function whose locals functions inside it read has an environment of its own,
    // which holds those locals while it waits, and which its live methods hold, so that only that
    // call runs them.
    const environment =
      callee !== undefined &&
      context.heap !== undefined &&
      getKeptLocals(callee, context).length > 0
        ? context.names.getFresh("environment")
        : undefined;
    const keptMaker = callee === undefined ? undefined : getKeptMaker(callee, context);
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
      const scope =
        environment === undefined || callee === undefined
          ? bound.scope
          : {
              ...bound.scope,
              bindings:
                context.heap === undefined
                  ? bound.scope.bindings
                  : new Map([...bound.scope.bindings, [context.heap, identifier(environment)]]),
              activations: new Map([
                ...(bound.scope.activations ?? []),
                [callee, useJavaScript("Allocated", [identifier(environment)], context)],
              ]),
            };
      // While a body waits, the environments of the calls that it runs within hold the locals that
      // functions inside those calls read, which the body reads again as it resumes.
      const kept = [...(scope.activations ?? [])].map((entry) => ({
        activation: entry[1],
        locals: getKeptLocals(entry[0], context),
      }));
      // The kept locals that only their declarations write, and parameters that no arguments
      // object aliases, which hold the same value from the time they're bound.
      const sourceFile = node.getSourceFile();
      const written = new Set(
        findNodes(sourceFile, (inner): inner is ts.Node => getWritten(inner) !== undefined).flatMap(
          (inner) => {
            const target = getWritten(inner);
            return target === undefined
              ? []
              : getWrittenRoots(target).flatMap((root) => getSymbol(root, context.checker) ?? []);
          },
        ),
      );
      const fixed = new Set(
        kept.flatMap((entry) =>
          entry.locals.flatMap((local) => {
            const declaration = local.symbol.valueDeclaration;
            return written.has(local.symbol) ||
              isAssigned(local.symbol, sourceFile, context) ||
              (declaration !== undefined &&
                ts.isParameter(declaration) &&
                findNodes(
                  declaration.parent,
                  (inner): inner is ts.Identifier =>
                    ts.isIdentifier(inner) && inner.text === "arguments",
                ).length > 0)
              ? []
              : [local.symbol];
          }),
        ),
      );
      const captured =
        callee === undefined || (keptMaker !== undefined && scope.activations?.has(keptMaker))
          ? new Set<ts.Symbol>()
          : getLocalCaptures(callee, context);
      // The heap changes as the body awaits, which makes promises.
      const changed = [
        ...new Set([
          ...getChanged(callee ?? node, inner, context),
          ...(context.heap === undefined ? [] : [context.heap]),
          ...kept.flatMap((entry) => entry.locals.map((local) => local.symbol)),
        ]),
      ];
      const heapSymbol = context.heap;
      // The heap that keeps the locals' values names itself, as each value reads the heap that the
      // body entered with, so that each await in turn would otherwise copy the one before it.
      const leave = (
        current: Path,
        continueLeft: (left: { caller: ReturnType<typeof getCaller>; left: Path }) => Formula,
      ) => {
        const caller = getCaller(current);
        const left = leaveBody(current, caller.path, changed, isOuter);
        if (heapSymbol === undefined) return continueLeft({ caller, left });
        const heap = getHeap(left.scope, node, context);
        const stored = kept.reduce((outer, entry) => {
          const values = entry.locals.flatMap((local): [Expression, Expression][] => {
            const value = current.scope.bindings.get(local.symbol);
            return value === undefined ? [] : [[string(local.key), value]];
          });
          return values.length === 0
            ? outer
            : useJavaScript(
                "SetEnvironment",
                [outer, entry.activation, functionFrom(values)],
                context,
              );
        }, heap);
        if (stored === heap) return continueLeft({ caller, left });
        const heapName = context.names.getFresh("heap");
        return bindOnce(
          left,
          heapName,
          stored,
          continueLeft({
            caller,
            left: {
              ...left,
              scope: {
                ...left.scope,
                bindings: new Map([...left.scope.bindings, [heapSymbol, identifier(heapName)]]),
              },
            },
          }),
        );
      };
      const enter = (resumer: Path, current: Path) => {
        const entered = enterBody(
          resumer,
          current,
          (symbol) => isOuter(symbol) && !captured.has(symbol),
        );
        const heap = getHeap(entered.scope, node, context);
        return {
          ...entered,
          scope: {
            ...entered.scope,
            bindings: new Map([
              ...entered.scope.bindings,
              ...kept.flatMap((entry) =>
                entry.locals.flatMap((local): [ts.Symbol, Expression][] => {
                  const value = current.scope.bindings.get(local.symbol);
                  // A fixed local that the body had bound keeps its value, which tells the promises
                  // and functions it holds apart where the body compiles.
                  return !entered.scope.bindings.has(local.symbol)
                    ? []
                    : value !== undefined &&
                        !current.scope.uninitialized.has(local.symbol) &&
                        fixed.has(local.symbol)
                      ? [[local.symbol, value]]
                      : [
                          [
                            local.symbol,
                            useJavaScript(
                              "EnvironmentValue",
                              [heap, entry.activation, string(local.key)],
                              context,
                            ),
                          ],
                        ];
                }),
              ),
            ]),
          },
        };
      };
      // A let or a const of a call around the body that was uninitialized as the body left may
      // have been initialized since, as the call ran on, which stores it in its environment then.
      const initialize = (
        entered: Path,
        continueEntered: (path: Path) => Formula,
        pending = kept.flatMap((entry) =>
          entry.locals
            .filter(
              (local) =>
                entered.scope.uninitialized.has(local.symbol) &&
                !entered.scope.bindings.has(local.symbol),
            )
            .map((local) => ({ activation: entry.activation, local })),
        ),
      ): Formula => {
        const first = pending.at(0);
        if (first === undefined) return continueEntered(entered);
        const key = [
          getHeap(entered.scope, node, context),
          first.activation,
          string(first.local.key),
        ];
        return ifThenElse(
          useJavaScript("HasEnvironmentValue", key, context),
          initialize(
            {
              ...entered,
              scope: {
                ...entered.scope,
                bindings: new Map([
                  ...entered.scope.bindings,
                  [first.local.symbol, useJavaScript("EnvironmentValue", key, context)],
                ]),
                uninitialized: new Set(
                  [...entered.scope.uninitialized].filter(
                    (symbol) => symbol !== first.local.symbol,
                  ),
                ),
              },
            },
            continueEntered,
            pending.slice(1),
          ),
          initialize(entered, continueEntered, pending.slice(1)),
        );
      };
      const finish = (current: Path, value: Expression, isThrown: boolean) =>
        leave(current, (left) =>
          isThrown
            ? left.caller.resume(settle(left.left, node, name, value, true, context))
            : resolve(left.left, node, name, value, undefined, context, left.caller.resume),
        );
      const bodyFrame: Frame = {
        next: (current) => finish(current, getUndefined(context), false),
        exit: (current, value) => finish(current, value ?? getUndefined(context), false),
        breakTo: undefined,
        continueTo: undefined,
        throwTo: (current, thrown) => finish(current, thrown.value, true),
        yieldTo: undefined,
        awaitTo: (current, value, operand, onFulfilled, onRejected) =>
          leave(current, (left) =>
            awaitIn(
              left.left,
              node,
              value,
              operand,
              context,
              (resumer, settled, isRejected, onReturn) =>
                initialize(enter(resumer, current), (entered) =>
                  (isRejected ? onRejected : onFulfilled)(
                    setCaller(entered, { path: resumer, resume: onReturn }),
                    settled,
                  ),
                ),
              left.caller.resume,
            ),
          ),
        inlining: callee === undefined ? frame.inlining : new Set([...frame.inlining, callee]),
      };
      const start = setCaller(
        { ...inner, scope },
        { path: made, resume: (after) => continueWith(after, ref) },
      );
      const run =
        typeof body === "function"
          ? body(start, bodyFrame)
          : translateStatements(getBody(body, start.scope, context), start, context, bodyFrame);
      return letIn(
        bound.definitions,
        environment === undefined
          ? run
          : bindOnce(
              inner,
              environment,
              useJavaScript(
                "Allocate",
                [
                  getHeap(bound.scope, node, context),
                  useJavaScript("EnvironmentObject", [tuple([])], context),
                ],
                context,
              ),
              run,
            ),
      );
    });
  });
