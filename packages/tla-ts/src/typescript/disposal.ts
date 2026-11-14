import ts from "@typescript/typescript6";
import type { Expression } from "../ast";
import {
  type Frame,
  guardYields,
  type Path,
  type Thrown,
  throwTypeError,
  translateDeclarations,
} from "./actions";
import { type Context, type FunctionNode, getUndefined, skipCasts } from "./context";
import { TlaTypeScriptError } from "../errors";
import { translateSuppressedError } from "./exceptions";
import { translateExpression } from "./expressions";
import { type Formula, ifThenElse, leaf } from "./formula";
import { getHeap } from "./heap";
import { translateBuiltInValue } from "./intrinsics";
import { useJavaScript } from "./javascript";
import { translateAsyncBuiltIn } from "./promises";
import { callMethod, callValue, getMethods, isNullish, read } from "./protocols";
import { disposeStack } from "./stacks";
import { apply, boolean, set, string } from "./tla";

export interface Resource {
  site: ts.Node;
  // What the method runs with as this, and the arguments it takes.
  receiver: Expression;
  values: Expression[];
  // The dispose method, or undefined for null or undefined that an await using declaration holds.
  method: Expression | undefined;
  // The functions that the method may be.
  candidates: readonly FunctionNode[];
  // Whether an await using declaration added it, which awaits what the method returns.
  isAsync: boolean;
  // Whether the method is Symbol.dispose that an await using declaration calls in place of
  // Symbol.asyncDispose, as a promise that settles once it returns or throws.
  isWrapped: boolean;
  // Whether adopt or defer added the method, which tla-ts follows only as one of the candidates,
  // not as a DisposableStack's dispose.
  isCallback: boolean;
}

// The resources that a block's using declarations added, with the frame of the block and the path
// from before the first.
export interface Disposal {
  block: ts.Node;
  resources: readonly Resource[];
  frame: Frame;
  path: Path;
}

interface Disposing {
  completion: Thrown | undefined;
  // Whether the block disposes null or undefined that an await using declaration holds, which
  // awaits once unless a dispose method's result was awaited since.
  needsAwait: boolean;
  hasAwaited: boolean;
}

// Calls the dispose methods of a block's resources, last first, with each resource as this. An
// error that a method throws replaces the completion, or suppresses the error that it threw.
export const disposeAll = (
  resources: readonly Resource[],
  disposing: Disposing,
  path: Path,
  context: Context,
  frame: Frame,
  resume: (path: Path, completion: Thrown | undefined) => Formula,
): Formula => {
  const resource = resources.at(-1);
  const tick = (current: Path, next: (path: Path) => Formula) => {
    if (frame.awaitTo === undefined) {
      throw new TlaTypeScriptError("Unsupported await using", resource?.site);
    }
    return frame.awaitTo(current, getUndefined(context), undefined, next, next);
  };
  if (resource === undefined) {
    return disposing.needsAwait && !disposing.hasAwaited
      ? tick(path, (after) => resume(after, disposing.completion))
      : resume(path, disposing.completion);
  }
  if (!resource.isAsync && disposing.needsAwait && !disposing.hasAwaited) {
    return tick(path, (after) =>
      disposeAll(resources, { ...disposing, needsAwait: false }, after, context, frame, resume),
    );
  }
  const rest = resources.slice(0, -1);
  const site = resource.site;
  const method = resource.method;
  if (method === undefined) {
    return disposeAll(rest, { ...disposing, needsAwait: true }, path, context, frame, resume);
  }
  const fail = (current: Path, thrown: Thrown, hasAwaited: boolean) =>
    disposeAll(
      rest,
      {
        ...disposing,
        hasAwaited,
        completion:
          disposing.completion === undefined
            ? thrown
            : {
                value: translateSuppressedError(
                  thrown.value,
                  disposing.completion.value,
                  site,
                  context,
                ),
                uncaught: apply("Assert", [boolean(false), string("SuppressedError")]),
              },
      },
      current,
      context,
      frame,
      resume,
    );
  const succeed = (current: Path, hasAwaited: boolean) =>
    disposeAll(rest, { ...disposing, hasAwaited }, current, context, frame, resume);
  const uncaught = apply("Assert", [boolean(false), string("await using")]);
  const callFrame: Frame = {
    ...frame,
    throwTo: (thrownPath, thrown) =>
      resource.isWrapped
        ? tick(thrownPath, (after) => fail(after, thrown, true))
        : fail(thrownPath, thrown, disposing.hasAwaited),
  };
  const unknown = leaf(
    apply("Assert", [boolean(false), string("tla-ts can't tell which function this calls")]),
  );
  // A DisposableStack's dispose, or an AsyncDisposableStack's disposeAsync, which a stack that the
  // path made holds.
  const disposeStacks = (next: (path: Path, value?: Expression) => Formula) =>
    resource.isCallback || (path.tasks?.stacks.size ?? 0) === 0
      ? unknown
      : ifThenElse(
          useJavaScript(
            "SameValue",
            [method, translateBuiltInValue("DisposableStack.prototype.dispose", site, context)],
            context,
          ),
          disposeStack(site, resource.receiver, false, path, context, callFrame, next),
          ifThenElse(
            useJavaScript(
              "SameValue",
              [
                method,
                translateBuiltInValue("AsyncDisposableStack.prototype.disposeAsync", site, context),
              ],
              context,
            ),
            disposeStack(site, resource.receiver, true, path, context, callFrame, next),
            unknown,
          ),
        );
  return callValue(
    site,
    resource.candidates,
    method,
    resource.receiver,
    resource.values,
    path,
    context,
    callFrame,
    disposeStacks,
    (after, result) => {
      if (!resource.isAsync) return succeed(after, disposing.hasAwaited);
      if (resource.isWrapped) return tick(after, (ticked) => succeed(ticked, true));
      if (frame.awaitTo === undefined)
        throw new TlaTypeScriptError("Unsupported await using", site);
      return frame.awaitTo(
        after,
        result,
        undefined,
        (fulfilled) => succeed(fulfilled, true),
        (rejected, reason) => fail(rejected, { value: reason, uncaught }, true),
      );
    },
  );
};

// The frame of the statements after a block adds a resource, which dispose the block's resources
// once they complete.
const getDisposingFrame = (disposal: Disposal, context: Context): Frame => {
  const frame = disposal.frame;
  const dispose = (
    inner: Path,
    completion: Thrown | undefined,
    resume: (path: Path) => Formula,
  ): Formula =>
    disposeAll(
      disposal.resources,
      { completion, needsAwait: false, hasAwaited: false },
      {
        ...inner,
        scope: { ...inner.scope, isCatching: disposal.path.scope.isCatching },
        disposal: disposal.path.disposal,
      },
      context,
      frame,
      (after, thrown) =>
        thrown === undefined
          ? resume(after)
          : frame.throwTo === undefined
            ? leaf(thrown.uncaught)
            : frame.throwTo(after, thrown),
    );
  const resumeWith = (resume: ((path: Path) => Formula) | undefined) =>
    resume && ((inner: Path) => dispose(inner, undefined, resume));
  return {
    ...guardYields(frame),
    next: (inner) => dispose(inner, undefined, frame.next),
    exit: (inner, value) => dispose(inner, undefined, (left) => frame.exit(left, value)),
    breakTo: resumeWith(frame.breakTo),
    continueTo: resumeWith(frame.continueTo),
    throwTo: (inner, thrown) => dispose(inner, thrown, frame.next),
  };
};

// Reads the dispose method of a value that a using declaration or a DisposableStack's use adds:
// Symbol.dispose, or for an await using declaration Symbol.asyncDispose, or else Symbol.dispose,
// which throws a TypeError where the value isn't an object or the method isn't a function.
export const readResource = (
  site: ts.Node,
  value: Expression,
  isAsync: boolean,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, resource: Resource) => Formula,
): Formula => {
  const isFunction = (inner: Path, method: Expression) =>
    apply("=", [
      useJavaScript("TypeOfIn", [getHeap(inner.scope, site, context), method], context),
      string("function"),
    ]);
  const resource = (method: Expression, isWrapped: boolean): Resource => ({
    site,
    receiver: value,
    values: [],
    method,
    candidates:
      isAsync && !isWrapped
        ? getMethods(site, "@@asyncDispose", context, true)
        : getMethods(site, "@@dispose", context),
    isAsync,
    isWrapped,
    isCallback: false,
  });
  const readDispose = (inner: Path, isWrapped: boolean) =>
    read(site, value, "@@dispose", inner, context, frame, (got, method) =>
      ifThenElse(
        isFunction(got, method),
        continueWith(got, resource(method, isWrapped)),
        throwTypeError(got, site, context, frame),
      ),
    );
  return ifThenElse(
    apply("\\in", [
      useJavaScript("TypeOfIn", [getHeap(path.scope, site, context), value], context),
      set([string("object"), string("function")]),
    ]),
    isAsync
      ? read(site, value, "@@asyncDispose", path, context, frame, (got, method) =>
          ifThenElse(
            isNullish(method, context),
            readDispose(got, true),
            ifThenElse(
              isFunction(got, method),
              continueWith(got, resource(method, false)),
              throwTypeError(got, site, context, frame),
            ),
          ),
        )
      : readDispose(path, false),
    throwTypeError(path, site, context, frame),
  );
};

// Adds a value that a using declaration binds to its block's resources, which the code after it
// disposes. A resource is null, undefined, or an object with a dispose method.
export const addResource = (
  block: ts.Node,
  site: ts.Node,
  value: Expression,
  isAsync: boolean,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, frame: Frame) => Formula,
): Formula => {
  const current =
    path.disposal?.block === block ? path.disposal : { block, resources: [], frame, path };
  const add = (inner: Path, resource: Resource) => {
    const disposal = { ...current, resources: [...current.resources, resource] };
    return continueWith(
      { ...inner, scope: { ...inner.scope, isCatching: true }, disposal },
      getDisposingFrame(disposal, context),
    );
  };
  return ifThenElse(
    isNullish(value, context),
    isAsync
      ? add(path, {
          site,
          receiver: value,
          values: [],
          method: undefined,
          candidates: [],
          isAsync,
          isWrapped: false,
          isCallback: false,
        })
      : continueWith(path, frame),
    readResource(site, value, isAsync, path, context, frame, add),
  );
};

export const isAwaitUsing = (list: ts.VariableDeclarationList) =>
  (list.flags & ts.NodeFlags.AwaitUsing) === ts.NodeFlags.AwaitUsing;

// A using declaration, whose resources the code after it in its block disposes, in the reverse of
// the order that the block adds them. The block is a block's statements or a for.
export const translateUsing = (
  block: ts.Node,
  list: ts.VariableDeclarationList,
  declarations: readonly ts.VariableDeclaration[],
  path: Path,
  context: Context,
  frame: Frame,
  run: (path: Path, frame: Frame) => Formula,
): Formula => {
  if (declarations.length === 0) return run(path, frame);
  const declaration = declarations[0];
  const name = declaration.name;
  // A using declaration binds only names.
  if (!ts.isIdentifier(name)) throw new TlaTypeScriptError("Unsupported using declaration", name);
  return translateDeclarations([declaration], path, context, frame, (after) =>
    addResource(
      block,
      declaration,
      translateExpression(name, after.scope, context),
      isAwaitUsing(list),
      after,
      context,
      frame,
      (inner, innerFrame) =>
        translateUsing(block, list, declarations.slice(1), inner, context, innerFrame, run),
    ),
  );
};

// A call of %IteratorPrototype%[@@dispose] or %AsyncIteratorPrototype%[@@asyncDispose] that a
// script reads from an iterator's prototype, whose type doesn't tell what it holds, as
// prototype[Symbol.dispose]() or through Function.prototype.call with any value as this.
export const getIteratorDisposeCall = (node: ts.Node, context: Context) => {
  if (context.heap === undefined || !ts.isCallExpression(node)) return undefined;
  const callee = skipCasts(node.expression);
  const isCalledThrough = ts.isPropertyAccessExpression(callee) && callee.name.text === "call";
  const method = isCalledThrough ? skipCasts(callee.expression) : callee;
  if (!ts.isElementAccessExpression(method) || node.arguments.some(ts.isSpreadElement)) {
    return undefined;
  }
  const key = method.argumentExpression.getText();
  const flags = context.checker.getTypeAtLocation(method.expression).flags;
  return (key === "Symbol.dispose" || key === "Symbol.asyncDispose") &&
    (flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) !== 0
    ? {
        method,
        isAsync: key === "Symbol.asyncDispose",
        isCalledThrough,
        receiver: isCalledThrough ? node.arguments.at(0) : method.expression,
      }
    : undefined;
};

// Runs %IteratorPrototype%[@@dispose], which calls this's return method where it has one, or
// %AsyncIteratorPrototype%[@@asyncDispose], which also awaits what the method gives, as a built-in
// async function whose promise rejects where the method or reading it throws.
export const translateIteratorDisposeCall = (
  node: ts.CallExpression,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value?: Expression) => Formula,
): Formula => {
  const call = getIteratorDisposeCall(node, context);
  if (call === undefined) throw new TlaTypeScriptError("Unsupported call", node);
  const receiver =
    call.receiver === undefined
      ? getUndefined(context)
      : translateExpression(call.receiver, path.scope, context);
  const dispose = (start: Path, bodyFrame: Frame, finish: (path: Path) => Formula) =>
    ifThenElse(
      isNullish(receiver, context),
      throwTypeError(start, node, context, bodyFrame),
      ifThenElse(
        apply("\\in", [
          useJavaScript("TypeOfIn", [getHeap(start.scope, node, context), receiver], context),
          set([string("object"), string("function")]),
        ]),
        read(node, receiver, "return", start, context, bodyFrame, (got, method) =>
          ifThenElse(
            isNullish(method, context),
            finish(got),
            callMethod(
              node,
              "return",
              method,
              receiver,
              got,
              context,
              bodyFrame,
              (thrown) => throwTypeError(thrown, node, context, bodyFrame),
              (after, result) => {
                if (!call.isAsync) return finish(after);
                if (bodyFrame.awaitTo === undefined || bodyFrame.throwTo === undefined) {
                  throw new TlaTypeScriptError("Unsupported async call", node);
                }
                const throwTo = bodyFrame.throwTo;
                return bodyFrame.awaitTo(after, result, undefined, finish, (rejected, reason) =>
                  throwTo(rejected, {
                    value: reason,
                    uncaught: apply("Assert", [boolean(false), string("asyncDispose")]),
                  }),
                );
              },
            ),
          ),
        ),
        leaf(
          apply("Assert", [
            boolean(false),
            string("tla-ts can't read the return method of a primitive"),
          ]),
        ),
      ),
    );
  const builtIn = translateBuiltInValue(
    call.isAsync ? "%AsyncIteratorPrototype%.@@asyncDispose" : "Iterator.prototype.@@dispose",
    node,
    context,
  );
  const isBuiltIn = useJavaScript(
    "SameValue",
    [translateExpression(call.method, path.scope, context), builtIn],
    context,
  );
  return ifThenElse(
    call.isCalledThrough
      ? apply("/\\", [
          isBuiltIn,
          useJavaScript(
            "HoldsBuiltIn",
            [
              getHeap(path.scope, node, context),
              builtIn,
              string("call"),
              string("Function.prototype.call"),
            ],
            context,
          ),
        ])
      : isBuiltIn,
    call.isAsync
      ? translateAsyncBuiltIn(node, path, context, frame, continueWith, (start, bodyFrame) =>
          dispose(start, bodyFrame, (after) => bodyFrame.next(after)),
        )
      : dispose(path, frame, (after) => continueWith(after, getUndefined(context))),
    leaf(
      apply("Assert", [boolean(false), string("tla-ts can't tell which function this call runs")]),
    ),
  );
};
