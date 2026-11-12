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
import { type Context, getUndefined } from "./context";
import { TlaTypeScriptError } from "../errors";
import { translateSuppressedError } from "./exceptions";
import { translateExpression } from "./expressions";
import { type Formula, ifThenElse, leaf } from "./formula";
import { getHeap } from "./heap";
import { useJavaScript } from "./javascript";
import { callValue, getMethods, isNullish, read } from "./protocols";
import { apply, boolean, set, string } from "./tla";

interface Resource {
  site: ts.Node;
  value: Expression;
  // The dispose method, or undefined for null or undefined that an await using declaration holds.
  method: Expression | undefined;
  // Whether an await using declaration added it, which awaits what the method returns.
  isAsync: boolean;
  // Whether the method is Symbol.dispose that an await using declaration calls in place of
  // Symbol.asyncDispose, as a promise that settles once it returns or throws.
  isWrapped: boolean;
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
const disposeAll = (
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
  return callValue(
    site,
    getMethods(
      site,
      resource.isAsync && !resource.isWrapped ? "@@asyncDispose" : "@@dispose",
      context,
    ),
    method,
    resource.value,
    [],
    path,
    context,
    {
      ...frame,
      throwTo: (thrownPath, thrown) =>
        resource.isWrapped
          ? tick(thrownPath, (after) => fail(after, thrown, true))
          : fail(thrownPath, thrown, disposing.hasAwaited),
    },
    () =>
      leaf(
        apply("Assert", [boolean(false), string("tla-ts can't tell which function this calls")]),
      ),
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

// A using declaration, whose resources the code after it in its block disposes, in the reverse of
// the order that the block adds them. A resource is null, undefined, or an object whose
// Symbol.dispose method the declaration reads once, or for an await using declaration its
// Symbol.asyncDispose method, or else its Symbol.dispose method. The block is a block's statements
// or a for.
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
  const isAsync = (list.flags & ts.NodeFlags.AwaitUsing) === ts.NodeFlags.AwaitUsing;
  const current =
    path.disposal?.block === block ? path.disposal : { block, resources: [], frame, path };
  const declaration = declarations[0];
  const name = declaration.name;
  // A using declaration binds only names.
  if (!ts.isIdentifier(name)) throw new TlaTypeScriptError("Unsupported using declaration", name);
  const next = (inner: Path, innerFrame: Frame) =>
    translateUsing(block, list, declarations.slice(1), inner, context, innerFrame, run);
  const add = (inner: Path, resource: Resource) => {
    const disposal = { ...current, resources: [...current.resources, resource] };
    return next(
      { ...inner, scope: { ...inner.scope, isCatching: true }, disposal },
      getDisposingFrame(disposal, context),
    );
  };
  const isFunction = (current: Path, method: Expression) =>
    apply("=", [
      useJavaScript("TypeOfIn", [getHeap(current.scope, declaration, context), method], context),
      string("function"),
    ]);
  return translateDeclarations([declaration], path, context, frame, (after) => {
    const value = translateExpression(name, after.scope, context);
    const readDispose = (current: Path, isWrapped: boolean) =>
      read(declaration, value, "@@dispose", current, context, frame, (got, method) =>
        ifThenElse(
          isFunction(got, method),
          add(got, { site: declaration, value, method, isAsync, isWrapped }),
          throwTypeError(got, declaration, context, frame),
        ),
      );
    return ifThenElse(
      isNullish(value, context),
      isAsync
        ? add(after, { site: declaration, value, method: undefined, isAsync, isWrapped: false })
        : next(after, frame),
      ifThenElse(
        apply("\\in", [
          useJavaScript("TypeOfIn", [getHeap(after.scope, declaration, context), value], context),
          set([string("object"), string("function")]),
        ]),
        isAsync
          ? read(declaration, value, "@@asyncDispose", after, context, frame, (got, method) =>
              ifThenElse(
                isNullish(method, context),
                readDispose(got, true),
                ifThenElse(
                  isFunction(got, method),
                  add(got, { site: declaration, value, method, isAsync, isWrapped: false }),
                  throwTypeError(got, declaration, context, frame),
                ),
              ),
            )
          : readDispose(after, false),
        throwTypeError(after, declaration, context, frame),
      ),
    );
  });
};
