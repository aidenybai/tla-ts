import ts from "@typescript/typescript6";
import type { Expression } from "../ast";
import { type Frame, type Path, throwTypeError, translateJoined } from "./actions";
import {
  type Context,
  findNodes,
  getAccessorFunctions,
  getSymbol,
  getUndefined,
  isInertValue,
  skipCasts,
} from "./context";
import { type Formula, ifThenElse, leaf } from "./formula";
import { getHeap } from "./heap";
import { useJavaScript } from "./javascript";
import { bind, callMethod, getWrittenFunctions, isNullish, read } from "./protocols";
import { apply, boolean, string, tuple } from "./tla";

// The values that patterns took from iterators, which they bind as they would an array's.
const taken = new WeakSet<Expression>();

export const isTaken = (value: Expression) => taken.has(value);

// The values that a rest element or a spread takes from an iterator before tla-ts stops following
// it.
const TAKE_LIMIT = 3;

// The key of the method that makes an object's iterator, Symbol.iterator, as protocols name it.
const ITERATOR_KEY = "@@iterator";

const ITERATOR_KEYS = [ITERATOR_KEY, "next", "return", "value", "done"];

// An array pattern that destructures an object that a script declares, which isn't an array or a
// generator, through the iterator that the object's Symbol.iterator method makes.
export const isIteratedPattern = (
  pattern: ts.ArrayBindingPattern | ts.ArrayLiteralExpression,
  context: Context,
) =>
  isIteratedType(
    ts.isArrayBindingPattern(pattern)
      ? context.checker.getTypeAtLocation(pattern)
      : context.checker.getTypeOfAssignmentPattern(pattern),
    context,
  );

// A value that a for-of iterates through its object's iterator, as a pattern would destructure it.
export const isIteratedValue = (node: ts.Expression, context: Context) =>
  isIteratedType(context.checker.getTypeAtLocation(node), context);

const isIteratedType = (type: ts.Type, context: Context) => {
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

const isObject = (site: ts.Node, path: Path, value: Expression, context: Context) =>
  useJavaScript("IsObjectIn", [getHeap(path.scope, site, context), value], context);

// Calls an object's Symbol.iterator method, and reads the next method of the iterator it makes.
export const openIterator = (
  site: ts.Node,
  iterable: Expression,
  path: Path,
  context: Context,
  frame: Frame,
  throwWith: (path: Path) => Formula,
  continueWith: (path: Path, iterator: Expression, next: Expression) => Formula,
) =>
  bind(path, "iterable", iterable, context, (current, held) =>
    read(site, held, ITERATOR_KEY, current, context, frame, (found, method) =>
      ifThenElse(
        isNullish(method, context),
        throwWith(found),
        callMethod(
          site,
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
                isObject(site, bound, iterator, context),
                read(site, iterator, "next", bound, context, frame, (after, next) =>
                  continueWith(after, iterator, next),
                ),
                throwWith(bound),
              ),
            ),
        ),
      ),
    ),
  );

// Calls an iterator's next, and goes on with the result where the iterator isn't done.
export const stepIterator = (
  site: ts.Node,
  iterator: Expression,
  next: Expression,
  path: Path,
  context: Context,
  frame: Frame,
  throwWith: (path: Path) => Formula,
  doneWith: (path: Path) => Formula,
  continueWith: (path: Path, result: Expression) => Formula,
) =>
  callMethod(site, "next", next, iterator, path, context, frame, throwWith, (called, result) =>
    bind(called, "result", result, context, (bound, held) =>
      ifThenElse(
        isObject(site, bound, held, context),
        read(site, held, "done", bound, context, frame, (checked, done) =>
          ifThenElse(
            useJavaScript("ToBoolean", [done], context),
            doneWith(checked),
            continueWith(checked, held),
          ),
        ),
        throwWith(bound),
      ),
    ),
  );

// Reads the value of an iterator's result.
export const readValue = (
  site: ts.Node,
  result: Expression,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value: Expression) => Formula,
) => read(site, result, "value", path, context, frame, continueWith);

// Closes an iterator through its return, where it has one, which must give an object.
export const closeIterator = (
  site: ts.Node,
  iterator: Expression,
  path: Path,
  context: Context,
  frame: Frame,
  throwWith: (path: Path) => Formula,
  continueWith: (path: Path) => Formula,
) =>
  read(site, iterator, "return", path, context, frame, (found, method) =>
    ifThenElse(
      isNullish(method, context),
      continueWith(found),
      callMethod(
        site,
        "return",
        method,
        iterator,
        found,
        context,
        frame,
        throwWith,
        (after, result) =>
          ifThenElse(isObject(site, after, result, context), continueWith(after), throwWith(after)),
      ),
    ),
  );

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
  const finish = (current: Path, values: Expression[]) =>
    continueWith(
      current,
      tuple([
        ...values,
        ...Array.from({ length: Math.max(0, count - values.length) }, () => getUndefined(context)),
      ]),
    );
  const step = (
    current: Path,
    iterator: Expression,
    next: Expression,
    values: Expression[],
  ): Formula => {
    if (restAt === -1 && values.length === count) {
      return closeIterator(pattern, iterator, current, context, frame, throwWith, (closed) =>
        finish(closed, values),
      );
    }
    if (values.length >= count + TAKE_LIMIT) {
      return leaf(
        apply("Assert", [
          boolean(false),
          string(`tla-ts can't take more than ${TAKE_LIMIT} values into a rest element`),
        ]),
      );
    }
    return stepIterator(
      pattern,
      iterator,
      next,
      current,
      context,
      frame,
      throwWith,
      (done) => finish(done, values),
      (stepped, result) =>
        elements[values.length] !== undefined && ts.isOmittedExpression(elements[values.length])
          ? step(stepped, iterator, next, [...values, getUndefined(context)])
          : readValue(pattern, result, stepped, context, frame, (taken, value) =>
              step(taken, iterator, next, [...values, value]),
            ),
    );
  };
  return openIterator(
    pattern,
    iterable,
    path,
    context,
    frame,
    throwWith,
    (opened, iterator, next) => step(opened, iterator, next, []),
  );
};

// The objects that the spreads of an array literal or a new iterate through their iterators, where
// every other part is one that evaluating can't throw or change.
export const getIteratedSpreads = (node: ts.Expression, context: Context) => {
  const parts = ts.isArrayLiteralExpression(node)
    ? node.elements
    : ts.isNewExpression(node) && isInertValue(skipCasts(node.expression))
      ? (node.arguments ?? [])
      : [];
  const spreads = parts.flatMap((part) =>
    ts.isSpreadElement(part) && isIteratedValue(part.expression, context) ? [part.expression] : [],
  );
  return spreads.length > 0 &&
    parts.every(
      (part) =>
        ts.isOmittedExpression(part) ||
        (ts.isSpreadElement(part) ? spreads.includes(part.expression) : isInertValue(part)),
    )
    ? spreads
    : undefined;
};

// Runs spreads that iterate objects, which take and read each value of the objects' iterators, for
// a statement that drops what they take.
export const takeSpreads = (
  site: ts.Node,
  iterables: readonly Expression[],
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path) => Formula,
) =>
  translateJoined(
    site,
    path,
    context,
    (after) => throwTypeError(after, site, context, frame),
    (throwWith) =>
      translateJoined(
        site,
        path,
        context,
        (after) => continueWith(after),
        (rejoin) => {
          const spread = (current: Path, rest: readonly Expression[]): Formula =>
            rest.length === 0
              ? rejoin(current)
              : openIterator(
                  site,
                  rest[0],
                  current,
                  context,
                  frame,
                  throwWith,
                  (opened, iterator, next) => {
                    const step = (stepping: Path, count: number): Formula =>
                      count >= TAKE_LIMIT
                        ? leaf(
                            apply("Assert", [
                              boolean(false),
                              string(`tla-ts can't spread more than ${TAKE_LIMIT} values`),
                            ]),
                          )
                        : stepIterator(
                            site,
                            iterator,
                            next,
                            stepping,
                            context,
                            frame,
                            throwWith,
                            (done) => spread(done, rest.slice(1)),
                            (stepped, result) =>
                              readValue(site, result, stepped, context, frame, (taken) =>
                                step(taken, count + 1),
                              ),
                          );
                    return step(opened, 0);
                  },
                );
          return spread(path, iterables);
        },
      ),
  );
