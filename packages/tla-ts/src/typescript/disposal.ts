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
import type { Context } from "./context";
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
  method: Expression;
}

// The resources that a block's using declarations added, with the frame of the block and the path
// from before the first.
export interface Disposal {
  block: ts.Node;
  resources: readonly Resource[];
  frame: Frame;
  path: Path;
}

// Calls the dispose methods of a block's resources, last first, with each resource as this. An
// error that a method throws replaces the completion, or suppresses the error that it threw.
const disposeAll = (
  resources: readonly Resource[],
  completion: Thrown | undefined,
  path: Path,
  context: Context,
  frame: Frame,
  resume: (path: Path, completion: Thrown | undefined) => Formula,
): Formula => {
  const resource = resources.at(-1);
  if (resource === undefined) return resume(path, completion);
  const rest = resources.slice(0, -1);
  const site = resource.site;
  return callValue(
    site,
    getMethods(site, "@@dispose", context),
    resource.method,
    resource.value,
    [],
    path,
    context,
    {
      ...frame,
      throwTo: (thrownPath, thrown) =>
        disposeAll(
          rest,
          completion === undefined
            ? thrown
            : {
                value: translateSuppressedError(thrown.value, completion.value, site, context),
                uncaught: apply("Assert", [boolean(false), string("SuppressedError")]),
              },
          thrownPath,
          context,
          frame,
          resume,
        ),
    },
    () =>
      leaf(
        apply("Assert", [boolean(false), string("tla-ts can't tell which function this calls")]),
      ),
    (after) => disposeAll(rest, completion, after, context, frame, resume),
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
      completion,
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
// Symbol.dispose method the declaration reads once. The block is a block's statements or a for.
export const translateUsing = (
  block: ts.Node,
  declarations: readonly ts.VariableDeclaration[],
  path: Path,
  context: Context,
  frame: Frame,
  run: (path: Path, frame: Frame) => Formula,
): Formula => {
  if (declarations.length === 0) return run(path, frame);
  const current =
    path.disposal?.block === block ? path.disposal : { block, resources: [], frame, path };
  const declaration = declarations[0];
  const name = declaration.name;
  // A using declaration binds only names.
  if (!ts.isIdentifier(name)) throw new TlaTypeScriptError("Unsupported using declaration", name);
  const add = (inner: Path, resource: Resource) => {
    const disposal = { ...current, resources: [...current.resources, resource] };
    return translateUsing(
      block,
      declarations.slice(1),
      { ...inner, scope: { ...inner.scope, isCatching: true }, disposal },
      context,
      getDisposingFrame(disposal, context),
      run,
    );
  };
  return translateDeclarations([declaration], path, context, frame, (after) => {
    const value = translateExpression(name, after.scope, context);
    return ifThenElse(
      isNullish(value, context),
      translateUsing(block, declarations.slice(1), after, context, frame, run),
      ifThenElse(
        apply("\\in", [
          useJavaScript("TypeOfIn", [getHeap(after.scope, declaration, context), value], context),
          set([string("object"), string("function")]),
        ]),
        read(declaration, value, "@@dispose", after, context, frame, (got, method) =>
          ifThenElse(
            apply("=", [
              useJavaScript(
                "TypeOfIn",
                [getHeap(got.scope, declaration, context), method],
                context,
              ),
              string("function"),
            ]),
            add(got, { site: declaration, value, method }),
            throwTypeError(got, declaration, context, frame),
          ),
        ),
        throwTypeError(after, declaration, context, frame),
      ),
    );
  });
};
