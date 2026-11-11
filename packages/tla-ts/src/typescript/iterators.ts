import ts from "@typescript/typescript6";
import type { Expression } from "../ast";
import { type Frame, type Path, throwTypeError, translateJoined } from "./actions";
import { type Context, findNodes, getAccessorFunctions, getSymbol, getUndefined } from "./context";
import { type Formula, ifThenElse, leaf } from "./formula";
import { getHeap } from "./heap";
import { useJavaScript } from "./javascript";
import { bind, callMethod, getWrittenFunctions, isNullish, read } from "./protocols";
import { apply, boolean, string, tuple } from "./tla";

// The values that patterns took from iterators, which they bind as they would an array's.
const taken = new WeakSet<Expression>();

export const isTaken = (value: Expression) => taken.has(value);

// The values a rest element takes from an iterator before tla-ts stops following it.
const REST_LIMIT = 3;

// The key of the method that makes an object's iterator, Symbol.iterator, as protocols name it.
const ITERATOR_KEY = "@@iterator";

const ITERATOR_KEYS = [ITERATOR_KEY, "next", "return", "value", "done"];

// An array pattern that destructures an object that a script declares, which isn't an array or a
// generator, through the iterator that the object's Symbol.iterator method makes.
export const isIteratedPattern = (
  pattern: ts.ArrayBindingPattern | ts.ArrayLiteralExpression,
  context: Context,
) => {
  const type = ts.isArrayBindingPattern(pattern)
    ? context.checker.getTypeAtLocation(pattern)
    : context.checker.getTypeOfAssignmentPattern(pattern);
  const declarations = type.getSymbol()?.declarations ?? [];
  return (
    context.heap !== undefined &&
    !type.isUnion() &&
    (type.flags & ts.TypeFlags.Object) !== 0 &&
    !context.checker.isArrayLikeType(type) &&
    declarations.length > 0 &&
    declarations.every((declaration) => !declaration.getSourceFile().isDeclarationFile)
  );
};

// An array pattern whose type doesn't tell whether it destructures an array or an object that
// iterates, which an object's iterator could give different values than its indices.
export const isUntypedPattern = (
  pattern: ts.ArrayBindingPattern | ts.ArrayLiteralExpression,
  context: Context,
) => {
  const type = ts.isArrayBindingPattern(pattern)
    ? context.checker.getTypeAtLocation(pattern)
    : context.checker.getTypeOfAssignmentPattern(pattern);
  return (
    context.heap !== undefined && (type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) !== 0
  );
};

// The functions that destructuring a pattern through an iterator may run.
export const getIteratorFunctions = (pattern: ts.Node, context: Context) => [
  ...ITERATOR_KEYS.flatMap((key) => getWrittenFunctions(pattern, key, context)),
  ...getAccessorFunctions(pattern, "get", context),
];

// A pattern whose elements only bind names, which nothing outside the function that holds the
// pattern reads. Binding them can't throw or run code, and the functions of the iterator can't see
// them, so the pattern can take all its values before it binds them, which JavaScript interleaves.
const isPlainPattern = (pattern: ts.ArrayBindingPattern, context: Context) => {
  const owner = ts.findAncestor(pattern, ts.isFunctionLike);
  const names = pattern.elements.flatMap((element) =>
    ts.isBindingElement(element) ? [element.name] : [],
  );
  const symbols = names.flatMap((name) =>
    ts.isIdentifier(name) ? (getSymbol(name, context.checker) ?? []) : [],
  );
  return (
    pattern.elements.every(
      (element) =>
        ts.isOmittedExpression(element) ||
        (ts.isIdentifier(element.name) && element.initializer === undefined),
    ) &&
    symbols.length === names.length &&
    findNodes(pattern.getSourceFile(), ts.isIdentifier).every((name) => {
      const symbol = getSymbol(name, context.checker);
      return (
        symbol === undefined ||
        !symbols.includes(symbol) ||
        ts.findAncestor(name, ts.isFunctionLike) === owner
      );
    })
  );
};

// Takes the values that an array pattern binds from an object's iterator: it calls the object's
// Symbol.iterator method, then next for each element until the iterator is done, and closes the
// iterator through its return where the pattern ends first.
export const takeFromIterator = (
  pattern: ts.ArrayBindingPattern,
  iterable: Expression,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, values: Expression) => Formula,
): Formula | undefined => {
  if (
    taken.has(iterable) ||
    !isIteratedPattern(pattern, context) ||
    !isPlainPattern(pattern, context)
  ) {
    return undefined;
  }
  // The protocol's TypeErrors and the values it takes each join, so that what follows the pattern,
  // and what catches it, translate once.
  return translateJoined(
    pattern,
    path,
    context,
    (after) => throwTypeError(after, pattern, context, frame),
    (throwWith) =>
      translateJoined(
        pattern,
        path,
        context,
        (after, values) => {
          const held = values ?? tuple([]);
          taken.add(held);
          return continueWith(after, held);
        },
        (rejoin) => takeAll(pattern, iterable, path, context, frame, throwWith, rejoin),
      ),
  );
};

const takeAll = (
  pattern: ts.ArrayBindingPattern,
  iterable: Expression,
  path: Path,
  context: Context,
  frame: Frame,
  throwWith: (path: Path) => Formula,
  continueWith: (path: Path, values: Expression) => Formula,
) => {
  const elements = pattern.elements;
  const restAt = elements.findIndex(
    (element) => ts.isBindingElement(element) && element.dotDotDotToken !== undefined,
  );
  const count = restAt === -1 ? elements.length : restAt;
  const isObject = (current: Path, value: Expression) =>
    useJavaScript("IsObjectIn", [getHeap(current.scope, pattern, context), value], context);
  const finish = (current: Path, values: Expression[]) =>
    continueWith(
      current,
      tuple([
        ...values,
        ...Array.from({ length: Math.max(0, count - values.length) }, () => getUndefined(context)),
      ]),
    );
  const close = (current: Path, iterator: Expression, values: Expression[]) =>
    read(pattern, iterator, "return", current, context, frame, (found, method) =>
      ifThenElse(
        isNullish(method, context),
        finish(found, values),
        callMethod(
          pattern,
          "return",
          method,
          iterator,
          found,
          context,
          frame,
          throwWith,
          (after, result) =>
            ifThenElse(isObject(after, result), finish(after, values), throwWith(after)),
        ),
      ),
    );
  const step = (
    current: Path,
    iterator: Expression,
    next: Expression,
    values: Expression[],
  ): Formula => {
    if (restAt === -1 && values.length === count) return close(current, iterator, values);
    if (values.length >= count + REST_LIMIT) {
      return leaf(
        apply("Assert", [
          boolean(false),
          string(`tla-ts can't take more than ${REST_LIMIT} values into a rest element`),
        ]),
      );
    }
    return callMethod(
      pattern,
      "next",
      next,
      iterator,
      current,
      context,
      frame,
      throwWith,
      (called, result) =>
        bind(called, "result", result, context, (bound, held) =>
          ifThenElse(
            isObject(bound, held),
            read(pattern, held, "done", bound, context, frame, (checked, done) =>
              ifThenElse(
                useJavaScript("ToBoolean", [done], context),
                finish(checked, values),
                elements[values.length] !== undefined &&
                  ts.isOmittedExpression(elements[values.length])
                  ? step(checked, iterator, next, [...values, getUndefined(context)])
                  : read(pattern, held, "value", checked, context, frame, (taken, value) =>
                      step(taken, iterator, next, [...values, value]),
                    ),
              ),
            ),
            throwWith(bound),
          ),
        ),
    );
  };
  return bind(path, "iterable", iterable, context, (current, held) =>
    read(pattern, held, ITERATOR_KEY, current, context, frame, (found, method) =>
      ifThenElse(
        isNullish(method, context),
        throwWith(found),
        callMethod(
          pattern,
          ITERATOR_KEY,
          method,
          held,
          found,
          context,
          frame,
          throwWith,
          (made, result) =>
            bind(made, "iterator", result, context, (bound, iterator) =>
              ifThenElse(
                isObject(bound, iterator),
                read(pattern, iterator, "next", bound, context, frame, (after, next) =>
                  step(after, iterator, next, []),
                ),
                throwWith(bound),
              ),
            ),
        ),
      ),
    ),
  );
};
