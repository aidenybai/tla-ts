import ts from "@typescript/typescript6";
import type { Expression } from "../ast";
import {
  bindOnce,
  type Frame,
  isSameExpression,
  type Path,
  throwError,
  throwTypeError,
} from "./actions";
import { type Context, findNodes, getUndefined, skipCasts } from "./context";
import { disposeAll, readResource, type Resource } from "./disposal";
import { TlaTypeScriptError } from "../errors";
import { translateExpression } from "./expressions";
import { type Formula, ifThenElse, leaf } from "./formula";
import { getHeap } from "./heap";
import { getBuiltIn, translateBuiltInValue } from "./intrinsics";
import { useJavaScript } from "./javascript";
import { translateAsyncBuiltIn } from "./promises";
import { getFunctionCandidates, getWrittenFunctions, isNullish } from "./protocols";
import { apply, boolean, identifier, string } from "./tla";

// A DisposableStack that the path made: its resources, which tla-ts follows as it compiles, and
// whether it's disposed, which the heap holds too for its disposed getter.
export interface TrackedStack {
  ref: Expression;
  resources: readonly Resource[];
  isDisposed: boolean;
  // Whether it's an AsyncDisposableStack, which awaits what it disposes.
  isAsync: boolean;
}

const STACK_METHODS = new Set(["use", "adopt", "defer", "move", "dispose", "disposeAsync"]);

const getStackKind = (node: ts.Expression, context: Context) => {
  const name = context.checker.getTypeAtLocation(node).getSymbol()?.name;
  return name === "DisposableStack" || name === "AsyncDisposableStack" ? name : undefined;
};

// new DisposableStack or new AsyncDisposableStack, which take no arguments.
export const isStackConstruction = (node: ts.Node, context: Context): node is ts.NewExpression =>
  context.heap !== undefined &&
  ts.isNewExpression(node) &&
  (getBuiltIn(node.expression, context) === "DisposableStack" ||
    getBuiltIn(node.expression, context) === "AsyncDisposableStack") &&
  (node.arguments ?? []).length === 0;

// A call of a DisposableStack's or an AsyncDisposableStack's method, as stack.use(value) or
// stack[Symbol.dispose](), where disposeAsync names both of the latter's dispose methods.
export const getStackCall = (node: ts.Node, context: Context) => {
  if (context.heap === undefined || !ts.isCallExpression(node)) return undefined;
  const callee = skipCasts(node.expression);
  if (!ts.isPropertyAccessExpression(callee) && !ts.isElementAccessExpression(callee)) {
    return undefined;
  }
  const kind = getStackKind(callee.expression, context);
  const key = ts.isPropertyAccessExpression(callee)
    ? callee.name.text
    : callee.argumentExpression.getText();
  const method =
    key === "Symbol.dispose" ? "dispose" : key === "Symbol.asyncDispose" ? "disposeAsync" : key;
  if (
    kind === undefined ||
    !STACK_METHODS.has(method) ||
    (method === "dispose" && kind !== "DisposableStack") ||
    (method === "disposeAsync" && kind !== "AsyncDisposableStack")
  ) {
    return undefined;
  }
  return {
    method,
    isAsync: kind === "AsyncDisposableStack",
    receiver: callee.expression,
    values: node.arguments,
  };
};

// The functions that a script's DisposableStacks may call as they dispose: the dispose methods
// that it writes, and the functions that it adopts or defers.
export const getStackFunctions = (node: ts.Node, context: Context) => [
  ...getWrittenFunctions(node, "@@dispose", context),
  ...getWrittenFunctions(node, "@@asyncDispose", context),
  ...findNodes(node.getSourceFile(), ts.isCallExpression).flatMap((call) => {
    const stackCall = getStackCall(call, context);
    const onDispose =
      stackCall?.method === "adopt"
        ? stackCall.values.at(1)
        : stackCall?.method === "defer"
          ? stackCall.values.at(0)
          : undefined;
    return onDispose === undefined ? [] : getFunctionCandidates(onDispose, context);
  }),
];

const getStacks = (path: Path, node: ts.Node) => {
  if (path.tasks === undefined) {
    throw new TlaTypeScriptError("tla-ts can't follow a DisposableStack in a loop", node);
  }
  return path.tasks;
};

const setStack = (path: Path, node: ts.Node, name: string, stack: TrackedStack): Path => {
  const tasks = getStacks(path, node);
  return { ...path, tasks: { ...tasks, stacks: new Map([...tasks.stacks, [name, stack]]) } };
};

const setHeap = (path: Path, heap: Expression, context: Context): Path => {
  const symbol = context.heap;
  return symbol === undefined
    ? path
    : {
        ...path,
        scope: { ...path.scope, bindings: new Map([...path.scope.bindings, [symbol, heap]]) },
      };
};

// Makes a DisposableStack that holds resources, which the path then follows.
const makeStack = (
  node: ts.Node,
  isAsync: boolean,
  resources: readonly Resource[],
  path: Path,
  context: Context,
  continueWith: (path: Path, ref: Expression) => Formula,
) => {
  const name = context.names.getFresh("stack");
  const kind = isAsync ? "AsyncDisposableStack" : "DisposableStack";
  // The constructor, which the prototype's constructor property holds.
  context.builtIns.add(kind);
  const ref = useJavaScript("Allocated", [identifier(name)], context);
  return bindOnce(
    path,
    name,
    useJavaScript(
      "Allocate",
      [
        getHeap(path.scope, node, context),
        useJavaScript(
          "StackObject",
          [translateBuiltInValue(`${kind}.prototype`, node, context), boolean(isAsync)],
          context,
        ),
      ],
      context,
    ),
    continueWith(
      setStack(setHeap(path, identifier(name), context), node, name, {
        ref,
        resources,
        isDisposed: false,
        isAsync,
      }),
      ref,
    ),
  );
};

export const translateStackConstruction = (
  node: ts.NewExpression,
  path: Path,
  context: Context,
  continueWith: (path: Path, value?: Expression) => Formula,
) =>
  makeStack(
    node,
    getBuiltIn(node.expression, context) === "AsyncDisposableStack",
    [],
    path,
    context,
    continueWith,
  );

// Runs a DisposableStack's method on the stack that the receiver is, among those that the path
// made. A disposed stack throws a ReferenceError, but for dispose, which then does nothing. An
// AsyncDisposableStack's disposeAsync runs as an async function's body, which awaits what it
// disposes, and rejects the promise that it gives where a receiver isn't a stack.
export const translateStackCall = (
  node: ts.CallExpression,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value?: Expression) => Formula,
): Formula => {
  const stackCall = getStackCall(node, context);
  if (stackCall === undefined) throw new TlaTypeScriptError("Unsupported call", node);
  return runStackMethod(
    node,
    stackCall.method,
    stackCall.isAsync,
    translateExpression(stackCall.receiver, path.scope, context),
    stackCall.values.map((value) => {
      if (ts.isSpreadElement(value)) throw new TlaTypeScriptError("Unsupported spread", value);
      return { node: value, value: translateExpression(value, path.scope, context) };
    }),
    path,
    context,
    frame,
    continueWith,
  );
};

// Disposes the DisposableStack or the AsyncDisposableStack that a using declaration holds, which
// runs its dispose or its disposeAsync.
export const disposeStack = (
  node: ts.Node,
  receiver: Expression,
  isAsync: boolean,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value?: Expression) => Formula,
) =>
  runStackMethod(
    node,
    isAsync ? "disposeAsync" : "dispose",
    isAsync,
    receiver,
    [],
    path,
    context,
    frame,
    continueWith,
  );

const runStackMethod = (
  node: ts.Node,
  method: string,
  isAsync: boolean,
  receiver: Expression,
  values: readonly { node: ts.Expression; value: Expression }[],
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value?: Expression) => Formula,
): Formula => {
  const value = values.at(0)?.value ?? getUndefined(context);
  const run = (
    name: string,
    stack: TrackedStack,
    current: Path,
    currentFrame: Frame,
    finish: (path: Path, value?: Expression) => Formula,
  ): Formula => {
    const heap = getHeap(current.scope, node, context);
    const set = (inner: Path, changed: Partial<TrackedStack>) =>
      setStack(inner, node, name, { ...stack, ...changed });
    // Disposing the stack empties it, which its disposed getter then tells.
    const dispose = () =>
      setHeap(
        set(current, { resources: [], isDisposed: true }),
        useJavaScript("SetDisposed", [heap, stack.ref], context),
        context,
      );
    if (method === "dispose" || method === "disposeAsync") {
      if (stack.isDisposed) return finish(current);
      return disposeAll(
        stack.resources,
        { completion: undefined, needsAwait: false, hasAwaited: false },
        dispose(),
        context,
        currentFrame,
        (after, thrown) =>
          thrown === undefined
            ? finish(after)
            : currentFrame.throwTo === undefined
              ? leaf(thrown.uncaught)
              : currentFrame.throwTo(after, thrown),
      );
    }
    if (stack.isDisposed) {
      return throwError("ReferenceError", current, node, context, currentFrame);
    }
    if (method === "move") {
      return makeStack(node, stack.isAsync, stack.resources, dispose(), context, finish);
    }
    const add = (inner: Path, resource: Resource) =>
      set(inner, { resources: [...stack.resources, resource] });
    if (method === "use") {
      return ifThenElse(
        isNullish(value, context),
        // An AsyncDisposableStack awaits null and undefined as it disposes.
        stack.isAsync
          ? finish(
              add(current, {
                site: node,
                receiver: value,
                values: [],
                method: undefined,
                candidates: [],
                isAsync: true,
                isWrapped: false,
                isCallback: false,
              }),
              value,
            )
          : finish(current, value),
        readResource(node, value, stack.isAsync, current, context, currentFrame, (got, resource) =>
          finish(add(got, resource), value),
        ),
      );
    }
    const isAdopt = method === "adopt";
    const onDispose = isAdopt ? values.at(1) : values.at(0);
    return ifThenElse(
      apply("=", [
        useJavaScript("TypeOfIn", [heap, onDispose?.value ?? getUndefined(context)], context),
        string("function"),
      ]),
      finish(
        add(current, {
          site: node,
          receiver: getUndefined(context),
          values: isAdopt ? [value] : [],
          method: onDispose?.value ?? getUndefined(context),
          candidates: onDispose === undefined ? [] : getFunctionCandidates(onDispose.node, context),
          isAsync: stack.isAsync,
          isWrapped: false,
          isCallback: true,
        }),
        isAdopt ? value : getUndefined(context),
      ),
      throwTypeError(current, node, context, currentFrame),
    );
  };
  // The stack that the receiver's expression names, or any that the path made.
  const dispatch = (
    current: Path,
    currentFrame: Frame,
    finish: (path: Path, value?: Expression) => Formula,
  ) => {
    const stacks = [...getStacks(current, node).stacks].filter(
      (entry) => entry[1].isAsync === isAsync,
    );
    const named = stacks.find((entry) => isSameExpression(entry[1].ref, receiver));
    if (named !== undefined) return run(named[0], named[1], current, currentFrame, finish);
    return stacks.reduceRight(
      (rest, entry) =>
        ifThenElse(
          useJavaScript("SameValue", [receiver, entry[1].ref], context),
          run(entry[0], entry[1], current, currentFrame, finish),
          rest,
        ),
      ifThenElse(
        useJavaScript("IsStack", [getHeap(current.scope, node, context), receiver], context),
        leaf(apply("Assert", [boolean(false), string("tla-ts can't follow this DisposableStack")])),
        throwTypeError(current, node, context, currentFrame),
      ),
    );
  };
  return method === "disposeAsync"
    ? translateAsyncBuiltIn(node, path, context, frame, continueWith, (start, bodyFrame) =>
        dispatch(start, bodyFrame, (after) => bodyFrame.next(after)),
      )
    : dispatch(path, frame, continueWith);
};
