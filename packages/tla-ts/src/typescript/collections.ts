import ts from "@typescript/typescript6";
import {
  type Context,
  type FunctionNode,
  getBuiltInBase,
  getCallee,
  getParameters,
  getSymbol,
  getUndefined,
  isMethodCall,
  isNameRead,
  type MethodCall,
  share,
  skipCasts,
} from "./context";
import type { Expression } from "../ast";
import { TlaTypeScriptError } from "../errors";
import { translateElements, translateExpression, translateSetKey } from "./expressions";
import {
  callStateOperator,
  getStoredToStringReceiver,
  mayThrow,
  translateBody,
  translateLocalCall,
} from "./functions";
import { DATE_FIELDS, getHeap, getPrototypeMethod, isDateType, TIME_METHODS } from "./heap";
import {
  isBuiltInObject,
  translateBuiltInValue,
  getStringRegExp,
  translateRegExpValue,
  translateSymbolProperty,
} from "./intrinsics";
import { getTypeNames, isComparableType, useJavaScript } from "./javascript";
import { bindNames, bindPatternInline, type Receiver, type Scope } from "./scope";
import {
  apply,
  boolean,
  bound,
  choose,
  field,
  filter,
  functionOf,
  identifier,
  ifExpression,
  index,
  junction,
  lambda,
  map,
  not,
  number,
  quantify,
  record,
  set,
  string,
  tuple,
} from "./tla";
import {
  getKind,
  isBooleanType,
  isEvery,
  getKeptIterator,
  isHeapArray,
  ITERATOR_METHODS,
  isBigIntLike,
  isBooleanLike,
  isNumberLike,
  type Kind,
  translateUnknown,
  isTypeReference,
} from "./types";

interface Unordered {
  set: Expression;
  // Whether map() built the set, so that it may have fewer elements than the array would.
  isMapped: boolean;
}

// Methods that read their array once, so that sharing it with a LET gains nothing.
const SINGLE_USE_METHODS = new Set(["concat", "with", "filter"]);

interface Element {
  variable: string;
  scope: Scope;
}

interface Update {
  (current: Expression, values: Expression[], context: Context): Expression;
}

const THIS_ARGUMENT_METHODS = new Set([
  "every",
  "fromAsync",
  "filter",
  "find",
  "findIndex",
  "findLast",
  "findLastIndex",
  "flatMap",
  "forEach",
  "from",
  "map",
  "some",
]);

// What this names in a function that a method calls back: the argument after the callback where
// the method takes one, else undefined. An arrow function keeps the this around it.
export const getCallbackReceiver = (
  argument: ts.Expression,
  callee: FunctionNode,
  scope: Scope,
  context: Context,
): Receiver | undefined => {
  const call = argument.parent;
  if (
    (!ts.isFunctionDeclaration(callee) && !ts.isFunctionExpression(callee)) ||
    !ts.isCallExpression(call) ||
    !ts.isPropertyAccessExpression(call.expression)
  ) {
    return scope.receiver;
  }
  const accessed = call.expression;
  const method =
    accessed.name.text === "call" && ts.isPropertyAccessExpression(accessed.expression)
      ? accessed.expression.name.text
      : accessed.name.text;
  const thisArgument = THIS_ARGUMENT_METHODS.has(method)
    ? call.arguments[call.arguments.indexOf(argument) + 1]
    : undefined;
  return {
    value:
      thisArgument === undefined
        ? getUndefined(context)
        : translateExpression(thisArgument, scope, context),
    method: callee,
  };
};

// The function that a callback names, or that a local function's parameter holds.
const getCallbackFunction = (callback: ts.Expression, scope: Scope, context: Context) => {
  const symbol = getSymbol(callback, context.checker);
  return (
    (symbol === undefined ? undefined : scope.functions.get(symbol)) ?? getCallee(callback, context)
  );
};

const getCallback = (callback: ts.Expression, outer: Scope, context: Context) => {
  const callee = getCallbackFunction(callback, outer, context);
  if (callee?.body === undefined) throw new TlaTypeScriptError("Pass a function here", callback);
  const parameters = getParameters(callee);
  const unbound = parameters.find(
    (parameter) => parameter.initializer !== undefined || parameter.dotDotDotToken !== undefined,
  );
  if (unbound !== undefined) {
    throw new TlaTypeScriptError("A callback's parameters can't have defaults or rest", unbound);
  }
  return {
    parameters,
    body: callee.body,
    scope: (scope: Scope): Scope => ({
      ...scope,
      receiver: getCallbackReceiver(callback, callee, scope, context),
    }),
  };
};

const translateCallback = (callback: ts.Expression, scope: Scope, context: Context) => {
  const found = getCallback(callback, scope, context);
  const callee = getCallbackFunction(callback, scope, context);
  const declaration =
    callee === undefined || ts.isFunctionDeclaration(callee)
      ? callee
      : ts.isVariableDeclaration(callee.parent)
        ? callee.parent
        : undefined;
  if (
    callee === undefined ||
    declaration === undefined ||
    ts.findAncestor(declaration.parent, ts.isFunctionLike) !== undefined
  ) {
    return translateBody(found.body, scope, context);
  }
  if (!context.inProgress.has(callee)) {
    context.inProgress.add(callee);
    const value = translateBody(found.body, scope, context);
    context.inProgress.delete(callee);
    return value;
  }
  // A top-level function that runs from inside itself as a callback calls itself, as a call in its
  // body would.
  const values = found.parameters.map((parameter) =>
    ts.isIdentifier(parameter.name) &&
    context.checker.getTypeAtLocation(parameter.name).getCallSignatures().length === 0
      ? translateExpression(parameter.name, scope, context)
      : undefined,
  );
  if (values.includes(undefined)) {
    throw new TlaTypeScriptError(
      "tla-ts can't pass this function to an array method from inside itself",
      callback,
    );
  }
  return callStateOperator(
    declaration,
    callee,
    values.flatMap((value) => value ?? []),
    scope,
    context,
  );
};

const translateTest = (callback: ts.Expression, scope: Scope, context: Context) => {
  const callee = getCallbackFunction(callback, scope, context);
  const signature = callee && context.checker.getSignatureFromDeclaration(callee);
  if (signature === undefined) {
    throw new TlaTypeScriptError("Return a boolean from this test", callback);
  }
  const result = translateCallback(callback, scope, context);
  return isBooleanType(signature.getReturnType())
    ? result
    : useJavaScript("ToBoolean", [result], context);
};

const rejectIndex = (callback: ts.Expression, message: string, scope: Scope, context: Context) => {
  if (getCallback(callback, scope, context).parameters[1] !== undefined) {
    throw new TlaTypeScriptError(message, callback);
  }
};

// Binds a callback's element parameter to a fresh variable, which a quantifier then binds.
const bindElement = (callback: ts.Expression, outer: Scope, context: Context): Element => {
  const found = getCallback(callback, outer, context);
  const scope = found.scope(outer);
  const parameter = found.parameters[0];
  if (parameter === undefined) return { variable: context.names.getFresh("element"), scope };
  if (!ts.isIdentifier(parameter.name)) {
    const variable = context.names.getFresh("element");
    return {
      variable,
      scope: bindPatternInline(parameter.name, identifier(variable), scope, context),
    };
  }
  const variable = context.names.getFresh(parameter.name.text);
  const symbol = getSymbol(parameter.name, context.checker);
  return { variable, scope: bindNames(scope, [{ name: variable, symbol }]) };
};

// An array-like object may hold values of any type, which TypeScript can't check against the
// parameter a callback takes them as.
export const checkElement = (
  value: Expression,
  parameter: ts.ParameterDeclaration | undefined,
  heap: Expression,
  context: Context,
) => {
  const names =
    parameter === undefined
      ? undefined
      : getTypeNames(context.checker.getTypeAtLocation(parameter.name), context.checker);
  return names === undefined
    ? value
    : share(value, "element", context, (shared) =>
        ifExpression(
          apply("\\in", [
            useJavaScript("TypeOfIn", [heap, shared], context),
            set(names.map((name) => string(name === "null" ? "object" : name))),
          ]),
          shared,
          apply("Assert", [
            boolean(false),
            string("tla-ts can't pass a value to a callback parameter of another type"),
          ]),
        ),
      );
};

// Binds a callback's (element, index, array) parameters for the TLA+ index of a sequence, which
// counts from 1 where JavaScript counts from 0. A reducer takes an accumulator before them, and an
// array-like object's callbacks take the object as their array.
const bindIndexed = (
  callback: ts.Expression,
  sequence: Expression | undefined,
  position: Expression,
  scope: Scope,
  context: Context,
  extra: { accumulator?: Expression; owner?: Expression; indices?: Expression } = {},
) => {
  const found = getCallback(callback, scope, context);
  const parameters = found.parameters;
  const offset = extra.accumulator === undefined ? 0 : 1;
  const getChecked = (value: Expression, at: number) =>
    extra.owner === undefined
      ? value
      : checkElement(value, parameters[at], getHeap(scope, callback, context), context);
  const bindings = [
    ...(extra.accumulator === undefined ? [] : [getChecked(extra.accumulator, 0)]),
    sequence === undefined ? undefined : getChecked(index(sequence, [position]), offset),
    extra.indices === undefined
      ? apply("-", [position, number(1)])
      : index(extra.indices, [position]),
    extra.owner ?? sequence,
  ];
  return parameters.reduce((current, parameter, position) => {
    const value = bindings[position];
    if (
      position === bindings.length - 1 &&
      ts.isIdentifier(parameter.name) &&
      isNameRead(parameter.name, found.body, context)
    ) {
      const kind = getKind(parameter.name, context);
      const isUnknown =
        (context.checker.getTypeAtLocation(parameter.name).flags & ts.TypeFlags.Unknown) !== 0;
      if (extra.owner === undefined && kind !== "sequence" && !isUnknown) {
        throw new TlaTypeScriptError("Type a callback's array parameter as an array", parameter);
      }
      if (extra.owner !== undefined && kind !== "object" && !isUnknown) {
        throw new TlaTypeScriptError("Type a callback's array parameter as an object", parameter);
      }
    }
    return value === undefined
      ? current
      : bindPatternInline(parameter.name, value, current, context);
  }, found.scope(scope));
};

const getDomain = (value: Expression) => apply("DOMAIN", [value]);

const mapKeys = (
  value: Expression,
  base: string,
  context: Context,
  getElement: (shared: Expression, key: Expression) => Expression,
) =>
  share(value, base, context, (shared) => {
    const key = context.names.getFresh(base === "map" ? "key" : "index");
    return map(getElement(shared, identifier(key)), [bound(key, getDomain(shared))]);
  });

const getValues = (value: Expression, context: Context): Unordered => ({
  set: mapKeys(value, "map", context, (shared, key) => index(shared, [key])),
  isMapped: true,
});

const getEntries = (value: Expression, context: Context): Unordered => ({
  set: mapKeys(value, "map", context, (shared, key) => tuple([key, index(shared, [key])])),
  isMapped: false,
});

const getElements = (value: Expression, context: Context) =>
  mapKeys(value, "sequence", context, (shared, key) => index(shared, [key]));

// Whether a value of a node's type may be an error, as any type that an Error is assignable to.
const mayBeError = (node: ts.Expression, context: Context) => {
  const error = context.checker
    .getSymbolsInScope(node.getSourceFile(), ts.SymbolFlags.Interface)
    .find(
      (symbol) =>
        symbol.name === "Error" &&
        (symbol.declarations ?? []).some(
          (declaration) => declaration.getSourceFile().isDeclarationFile,
        ),
    );
  return (
    error !== undefined &&
    context.checker.isTypeAssignableTo(
      context.checker.getDeclaredTypeOfSymbol(error),
      context.checker.getTypeAtLocation(node),
    )
  );
};

// A set built from a Set, Map, or object, whose element order TLA+ doesn't keep.
const translateUnordered = (
  node: ts.Expression,
  scope: Scope,
  context: Context,
): Unordered | undefined => {
  const translate = (inner: ts.Expression) => translateExpression(inner, scope, context);
  if (ts.isParenthesizedExpression(node)) {
    return translateUnordered(node.expression, scope, context);
  }
  if (
    ts.isArrayLiteralExpression(node) &&
    node.elements.length === 1 &&
    ts.isSpreadElement(node.elements[0])
  ) {
    const spread = node.elements[0].expression;
    const kind = getKind(spread, context);
    if (kind === "set") return { set: translate(spread), isMapped: false };
    if (kind === "map") return getEntries(translate(spread), context);
    return translateUnordered(spread, scope, context);
  }
  if (!isMethodCall(node)) return undefined;
  const receiver = node.expression.expression;
  const method = node.expression.name.text;
  if (ts.isIdentifier(receiver) && receiver.text === "Object") {
    const argument = node.arguments[0];
    const kind = getKind(argument, context);
    if (
      isBuiltInObject(argument, context) ||
      (context.heap !== undefined &&
        (kind === "object" || kind === "sequence" || kind === "string"))
    ) {
      return undefined;
    }
    // A number, a boolean, or a symbol converts to an object with no own properties.
    if (
      isNumberLike(argument, context) ||
      isBooleanType(context.checker.getTypeAtLocation(argument)) ||
      isEvery(context.checker.getTypeAtLocation(argument), ts.TypeFlags.ESSymbolLike)
    ) {
      return { set: set([]), isMapped: false };
    }
    const record = translate(argument);
    const listed =
      method === "keys"
        ? { set: getDomain(record), isMapped: false }
        : method === "values"
          ? getValues(record, context)
          : method === "entries"
            ? getEntries(record, context)
            : undefined;
    // An error is a record of fields that JavaScript keeps as no own enumerable property.
    return listed === undefined || !mayBeError(argument, context)
      ? listed
      : {
          ...listed,
          set: ifExpression(useJavaScript("IsError", [record], context), set([]), listed.set),
        };
  }
  const kind = getKind(receiver, context);
  if (kind === "set" && (method === "values" || method === "keys")) {
    return { set: translate(receiver), isMapped: false };
  }
  if (kind === "set" && method === "entries") {
    const element = context.names.getFresh("element");
    return {
      set: map(tuple([identifier(element), identifier(element)]), [
        bound(element, translate(receiver)),
      ]),
      isMapped: false,
    };
  }
  if (kind === "map" && method === "keys") {
    return { set: getDomain(translate(receiver)), isMapped: false };
  }
  if (kind === "map" && method === "values") return getValues(translate(receiver), context);
  if (kind === "map" && method === "entries") return getEntries(translate(receiver), context);
  if (method === "toArray") return translateUnordered(receiver, scope, context);
  if (method !== "filter" && method !== "map") return undefined;
  const source = translateUnordered(receiver, scope, context);
  if (source === undefined) return undefined;
  const callback = node.arguments[0];
  rejectIndex(callback, "Elements of a set have no index", scope, context);
  const element = bindElement(callback, scope, context);
  return method === "filter"
    ? {
        set: filter(
          bound(element.variable, source.set),
          translateTest(callback, element.scope, context),
        ),
        isMapped: source.isMapped,
      }
    : {
        set: map(translateCallback(callback, element.scope, context), [
          bound(element.variable, source.set),
        ]),
        isMapped: true,
      };
};

// The elements of a set, an array, or an iterator over a collection, as a TLA+ set.
export const translateSet = (node: ts.Expression, scope: Scope, context: Context) => {
  const unordered = translateUnordered(node, scope, context);
  if (unordered !== undefined) return unordered.set;
  if (isHeapArray(node, context)) {
    return getElements(translateHeapElements(node, scope, context), context);
  }
  const kind = getKind(node, context);
  const value = translateExpression(node, scope, context);
  if (kind === "set") return value;
  if (kind !== "sequence") throw new TlaTypeScriptError("Expected a Set or an array", node);
  return getElements(value, context);
};

// The number of elements in a collection, or undefined if the receiver isn't one.
export const translateSize = (node: ts.Expression, scope: Scope, context: Context) => {
  const unordered = translateUnordered(node, scope, context);
  if (unordered?.isMapped) {
    throw new TlaTypeScriptError(
      "map() can merge equal elements, so count before mapping",
      node.parent,
    );
  }
  if (unordered !== undefined) return apply("Cardinality", [unordered.set]);
  const kind = getKind(node, context);
  const value = translateExpression(node, scope, context);
  if (kind === "sequence" || kind === "string") return apply("Len", [value]);
  if (kind === "set") return apply("Cardinality", [value]);
  if (kind === "map") return apply("Cardinality", [getDomain(value)]);
  return undefined;
};

const COLLECTION_NAMES = new Set([
  "Map",
  "ReadonlyMap",
  "WeakMap",
  "Set",
  "ReadonlySet",
  "WeakSet",
]);

const PRIMITIVE_FLAGS =
  ts.TypeFlags.NumberLike |
  ts.TypeFlags.BooleanLike |
  ts.TypeFlags.StringLike |
  ts.TypeFlags.BigIntLike |
  ts.TypeFlags.ESSymbolLike |
  ts.TypeFlags.Undefined |
  ts.TypeFlags.Null |
  ts.TypeFlags.Void;

// What the size getter of Map.prototype or Set.prototype gives a receiver that a script calls it
// on, or undefined where it throws a TypeError, as the receiver isn't a collection of that kind.
export const translateSizeGetter = (
  owner: "Map" | "Set",
  receiver: ts.Expression | undefined,
  scope: Scope,
  context: Context,
) => {
  if (receiver === undefined) return undefined;
  const type = context.checker.getTypeAtLocation(receiver);
  const name = type.getSymbol()?.getName() ?? "";
  const kind = getKind(receiver, context);
  if ([owner, `Readonly${owner}`].includes(name) && kind === owner.toLowerCase()) {
    return translateSize(receiver, scope, context);
  }
  const inner = skipCasts(receiver);
  const isOther =
    isEvery(type, PRIMITIVE_FLAGS) ||
    kind === "sequence" ||
    kind === "string" ||
    COLLECTION_NAMES.has(name) ||
    ts.isObjectLiteralExpression(inner) ||
    ts.isArrowFunction(inner) ||
    ts.isFunctionExpression(inner);
  if (isOther) return undefined;
  throw new TlaTypeScriptError(`Give the receiver of ${owner}.prototype.size a type`, receiver);
};

// [x \in S |-> e] from source.map((x) => [x, e]), as new Map() and Object.fromEntries() take it.
export const translateFunctionConstructor = (
  node: ts.Expression,
  scope: Scope,
  context: Context,
) => {
  if (!isMethodCall(node) || node.expression.name.text !== "map") return undefined;
  const receiver = node.expression.expression;
  const source =
    translateUnordered(receiver, scope, context)?.set ??
    (getKind(receiver, context) === "sequence"
      ? getElements(translateExpression(receiver, scope, context), context)
      : undefined);
  const callback = node.arguments[0];
  const parameter = getCallback(callback, scope, context).parameters[0];
  const body =
    (ts.isArrowFunction(callback) || ts.isFunctionExpression(callback)) &&
    !ts.isBlock(callback.body)
      ? callback.body
      : undefined;
  const pair = body !== undefined && ts.isParenthesizedExpression(body) ? body.expression : body;
  const isKeyedByParameter =
    pair !== undefined &&
    ts.isArrayLiteralExpression(pair) &&
    pair.elements.length === 2 &&
    parameter !== undefined &&
    ts.isIdentifier(parameter.name) &&
    ts.isIdentifier(pair.elements[0]) &&
    pair.elements[0].text === parameter.name.text;
  if (source === undefined || !isKeyedByParameter) {
    throw new TlaTypeScriptError(
      "Build a Map or record from a set with set.values().map((key) => [key, value])",
      node,
    );
  }
  const element = bindElement(callback, scope, context);
  const value = translateExpression(pair.elements[1], element.scope, context);
  return functionOf([bound(element.variable, source)], value);
};

// A sequence from Array.from({ length: n }, callback) or new Array(n).fill(value).
export const translateArrayConstructor = (node: MethodCall, scope: Scope, context: Context) => {
  const receiver = node.expression.expression;
  const method = node.expression.name.text;
  // Array.from converts its length with ToLength, and new Array throws unless it's an index.
  const getIndices = (length: ts.Expression, operator: "ToLength" | "ArrayLength") => {
    const value = translateExpression(length, scope, context);
    return apply("..", [
      number(1),
      context.hasSpecialNumbers ? useJavaScript(operator, [value], context) : value,
    ]);
  };
  const callback = node.arguments[1];
  const options = node.arguments[0];
  if (
    ts.isIdentifier(receiver) &&
    receiver.text === "Array" &&
    method === "from" &&
    node.arguments.length === 2 &&
    ts.isObjectLiteralExpression(options)
  ) {
    const length = options.properties.find((property) => property.name?.getText() === "length");
    if (length === undefined || !ts.isPropertyAssignment(length)) {
      throw new TlaTypeScriptError("Array.from needs { length: n }", node);
    }
    const position = context.names.getFresh("index");
    const inner = bindIndexed(callback, undefined, identifier(position), scope, context);
    return functionOf(
      [bound(position, getIndices(length.initializer, "ToLength"))],
      translateCallback(callback, inner, context),
    );
  }
  if (method !== "fill" || node.arguments.length !== 1) return undefined;
  const array =
    ts.isNewExpression(receiver) || ts.isCallExpression(receiver) ? receiver : undefined;
  const length =
    array !== undefined &&
    ts.isIdentifier(array.expression) &&
    array.expression.text === "Array" &&
    array.arguments?.length === 1
      ? array.arguments[0]
      : undefined;
  if (length === undefined) return undefined;
  const position = context.names.getFresh("index");
  return functionOf(
    [bound(position, getIndices(length, "ArrayLength"))],
    translateExpression(node.arguments[0], scope, context),
  );
};

// The positions a search passes before it reaches a position, from the end when it searches back.
const getPassed = (passed: string, position: string, sequence: Expression, isLast: boolean) =>
  bound(
    passed,
    isLast
      ? apply("..", [apply("+", [identifier(position), number(1)]), apply("Len", [sequence])])
      : apply("..", [number(1), apply("-", [identifier(position), number(1)])]),
  );

// The first index in a sequence whose element passes a test, or the last when isLast, and whether
// any does.
const translateFoundIndex = (
  sequence: Expression,
  callback: ts.Expression,
  isLast: boolean,
  owner: Expression | undefined,
  scope: Scope,
  context: Context,
) => {
  const getTest = (position: string) =>
    translateTest(
      callback,
      bindIndexed(callback, sequence, identifier(position), scope, context, { owner }),
      context,
    );
  const position = context.names.getFresh("index");
  const passed = context.names.getFresh("passed");
  return {
    exists: quantify("Exists", [bound(position, getDomain(sequence))], getTest(position)),
    found: choose(
      position,
      getDomain(sequence),
      junction("And", [
        getTest(position),
        quantify("Forall", [getPassed(passed, position, sequence, isLast)], not(getTest(passed))),
      ]),
    ),
  };
};

// A call of an array method, on an array or, through Array.prototype, on an array-like object that
// its callbacks take as their array.
interface ArrayCall {
  node: ts.CallExpression;
  method: string;
  arguments: readonly ts.Expression[];
  elementType: ts.Type | undefined;
  owner: Expression | undefined;
  // The indices of an array-like object's elements, where it may have holes.
  indices?: Expression;
}

const translateSequenceOperation = (
  call: ArrayCall,
  sequence: Expression,
  scope: Scope,
  context: Context,
  isDefined: boolean,
) => {
  const node = call.node;
  const method = call.method;
  const translate = (inner: ts.Expression) => translateExpression(inner, scope, context);
  const argument = call.arguments[0];
  const getLength = () => apply("Len", [sequence]);
  // An index after ToNumber, which stops on an object.
  const getIndex = (inner: ts.Expression) =>
    isNumberLike(inner, context)
      ? translate(inner)
      : useJavaScript("ToNumber", [translate(inner)], context);
  // An index that counts back from the end when it's negative, as at() and slice() take it.
  const getRelative = (inner: ts.Expression, operator: "RelativeIndex" | "ClampedIndex") =>
    ts.isNumericLiteral(inner) && Number.isInteger(Number(inner.text))
      ? translate(inner)
      : useJavaScript(operator, [getIndex(inner), getLength()], context);
  const orUndefined = (exists: Expression, value: Expression) => {
    if (isDefined) return value;
    return ifExpression(exists, value, getUndefined(context));
  };
  const translateEach =
    (
      format: (bounds: ReturnType<typeof bound>[], body: Expression) => Expression,
      translateElement = translateCallback,
    ) =>
    () => {
      const position = context.names.getFresh("index");
      const inner = bindIndexed(argument, sequence, identifier(position), scope, context, {
        owner: call.owner,
        indices: call.indices,
      });
      return format(
        [bound(position, getDomain(sequence))],
        translateElement(argument, inner, context),
      );
    };
  const withSearch = (
    isLast: boolean,
    use: (isFound: (position: Expression) => Expression) => Expression,
  ) =>
    share(translate(argument), "value", context, (value) => {
      const checker = context.checker;
      const elementType = call.elementType;
      const isComparableElement =
        elementType !== undefined &&
        isComparableType(elementType, checker.getTypeAtLocation(argument), checker);
      // includes compares by SameValueZero, and indexOf by ===, where NaN differs from itself.
      const getEqual = (position: Expression) =>
        context.hasSpecialNumbers
          ? useJavaScript(
              method === "includes" ? "SameValueZero" : "StrictEquals",
              [index(sequence, [position]), value],
              context,
            )
          : isComparableElement
            ? apply("=", [index(sequence, [position]), value])
            : useJavaScript("SameValue", [index(sequence, [position]), value], context);
      const from = call.arguments[1];
      // An undefined fromIndex is 0, where indexOf starts anyway but lastIndexOf stops.
      const isUndefined =
        from !== undefined &&
        (context.checker.getTypeAtLocation(from).flags & ts.TypeFlags.Undefined) !== 0;
      if (from === undefined || (isUndefined && !isLast)) return use(getEqual);
      if (!isUndefined && !isNumberLike(from, context)) {
        throw new TlaTypeScriptError("Pass a number as the index to search from", from);
      }
      const start = isUndefined
        ? number(0)
        : ts.isNumericLiteral(from) && Number.isInteger(Number(from.text))
          ? translate(from)
          : useJavaScript("RelativeIndex", [translate(from), getLength()], context);
      // A search back from index start reaches position start + 1, as positions count from 1.
      return share(start, "start", context, (shared) =>
        use((position) =>
          junction("And", [
            isLast
              ? apply("<=", [position, apply("+", [shared, number(1)])])
              : apply(">", [position, shared]),
            getEqual(position),
          ]),
        ),
      );
    });
  const getSearchIndex = (isLast: boolean) => () =>
    withSearch(isLast, (isFound) => {
      const position = context.names.getFresh("index");
      const passed = context.names.getFresh("passed");
      const found = choose(
        position,
        getDomain(sequence),
        junction("And", [
          isFound(identifier(position)),
          quantify(
            "Forall",
            [getPassed(passed, position, sequence, isLast)],
            not(isFound(identifier(passed))),
          ),
        ]),
      );
      return ifExpression(
        quantify("Exists", [bound(position, getDomain(sequence))], isFound(identifier(position))),
        call.indices === undefined ? apply("-", [found, number(1)]) : index(call.indices, [found]),
        number(-1),
      );
    });
  // The callback takes (accumulator, element, index, array), and Reduce gives it the accumulator
  // and the position of the element.
  const getReduced = (isRight: boolean) => () => {
    const accumulator = context.names.getFresh("accumulator");
    const position = context.names.getFresh("index");
    const inner = bindIndexed(argument, sequence, identifier(position), scope, context, {
      accumulator: identifier(accumulator),
      owner: call.owner,
      indices: call.indices,
    });
    const initial = call.arguments[1];
    return useJavaScript(
      "Reduce",
      [
        sequence,
        lambda([accumulator, position], translateCallback(argument, inner, context)),
        boolean(isRight),
        boolean(initial !== undefined),
        initial === undefined ? getUndefined(context) : translate(initial),
      ],
      context,
    );
  };
  const getFound = (isLast: boolean) => () => {
    const result = translateFoundIndex(sequence, argument, isLast, call.owner, scope, context);
    return orUndefined(result.exists, index(sequence, [result.found]));
  };
  const getFoundIndex = (isLast: boolean) => () => {
    const result = translateFoundIndex(sequence, argument, isLast, call.owner, scope, context);
    return ifExpression(result.exists, apply("-", [result.found, number(1)]), number(-1));
  };
  const operations = new Map<string, () => Expression>([
    [
      "at",
      () => {
        const position = apply("+", [getRelative(argument, "RelativeIndex"), number(1)]);
        return orUndefined(
          apply("\\in", [position, getDomain(sequence)]),
          index(sequence, [position]),
        );
      },
    ],
    [
      "includes",
      () =>
        withSearch(false, (isFound) => {
          const position = context.names.getFresh("index");
          return quantify(
            "Exists",
            [bound(position, getDomain(sequence))],
            isFound(identifier(position)),
          );
        }),
    ],
    ["indexOf", getSearchIndex(false)],
    ["lastIndexOf", getSearchIndex(true)],
    [
      "slice",
      () => {
        const start = argument === undefined ? number(0) : getRelative(argument, "ClampedIndex");
        const last = translateClampedIndex(
          call.arguments[1],
          getLength(),
          getLength(),
          scope,
          context,
        );
        const first =
          start.kind === "Number" ? number(start.value + 1) : apply("+", [start, number(1)]);
        return apply("SubSeq", [sequence, first, last]);
      },
    ],
    [
      "concat",
      () =>
        [
          sequence,
          ...call.arguments.map((inner) =>
            getKind(inner, context) === "sequence" ? translate(inner) : tuple([translate(inner)]),
          ),
        ].reduce((left, right) => apply("\\o", [left, right])),
    ],
    [
      "with",
      () =>
        useJavaScript(
          "SequenceWith",
          [sequence, translate(argument), translate(call.arguments[1])],
          context,
        ),
    ],
    ["toReversed", () => reverseSequence(sequence, context)],
    ...ITERATOR_METHODS.map((iteratorMethod): [string, () => Expression] => [
      iteratorMethod,
      () => {
        if (!isArrayIteration(node, context)) {
          throw new TlaTypeScriptError(
            `Iterate ${iteratorMethod}() only in a for-of or a spread`,
            node,
          );
        }
        const position = context.names.getFresh("index");
        const key = apply("-", [identifier(position), number(1)]);
        const visited =
          iteratorMethod === "values"
            ? sequence
            : functionOf(
                [bound(position, getDomain(sequence))],
                iteratorMethod === "keys"
                  ? key
                  : tuple([key, index(sequence, [identifier(position)])]),
              );
        // The iterator inherits the method that a for-of or a spread calls to iterate it.
        return context.heap === undefined
          ? visited
          : ifExpression(
              junction("And", [
                useJavaScript(
                  "HoldsBuiltIn",
                  [
                    getHeap(scope, node, context),
                    translateBuiltInValue("Iterator.prototype", node, context),
                    useJavaScript("WellKnownSymbol", [string("iterator")], context),
                    string("Iterator.prototype.@@iterator"),
                  ],
                  context,
                ),
                holdsArrayIteratorNext(getHeap(scope, node, context), node, context),
              ]),
              visited,
              apply("Assert", [
                boolean(false),
                string("tla-ts can't iterate an iterator whose prototype a script changed"),
              ]),
            );
      },
    ]),
    [
      "hasOwnProperty",
      () =>
        useJavaScript(
          "SequenceHasOwn",
          [sequence, argument === undefined ? getUndefined(context) : translate(argument)],
          context,
        ),
    ],
    [
      "toSorted",
      () =>
        useJavaScript(
          "SortSequence",
          [sequence, translateSortOrder(argument, scope, context)],
          context,
        ),
    ],
    ["toSpliced", () => translateSpliced(sequence, call.arguments, false, scope, context)],
    ["map", translateEach((bounds, body) => functionOf(bounds, body))],
    [
      "flat",
      () => {
        const depth =
          argument === undefined || argument.getText() === "undefined"
            ? 1
            : argument.getText() === "Infinity"
              ? Infinity
              : ts.isNumericLiteral(argument)
                ? Math.trunc(Number(argument.text))
                : undefined;
        if (depth === undefined || call.elementType === undefined) {
          throw new TlaTypeScriptError("Give flat() a depth that is a number literal", node);
        }
        return flattenTypes(sequence, [call.elementType], depth, node, context);
      },
    ],
    [
      "flatMap",
      () => {
        const callee = getCallbackFunction(argument, scope, context);
        const returned =
          callee === undefined
            ? undefined
            : context.checker.getSignatureFromDeclaration(callee)?.getReturnType();
        if (returned === undefined) {
          throw new TlaTypeScriptError("Give flatMap() a callback whose type tells", node);
        }
        return flattenTypes(
          translateEach((bounds, body) => functionOf(bounds, body))(),
          [returned],
          1,
          node,
          context,
        );
      },
    ],
    ["every", translateEach((bounds, body) => quantify("Forall", bounds, body), translateTest)],
    ["some", translateEach((bounds, body) => quantify("Exists", bounds, body), translateTest)],
    [
      "filter",
      () => {
        if (getCallback(argument, scope, context).parameters.length < 2) {
          const element = bindElement(argument, scope, context);
          return apply("SelectSeq", [
            sequence,
            lambda([element.variable], translateTest(argument, element.scope, context)),
          ]);
        }
        // SelectSeq tests only elements, so this selects the indices that pass and maps them back.
        const position = context.names.getFresh("index");
        const selected = apply("SelectSeq", [
          functionOf([bound(position, getDomain(sequence))], identifier(position)),
          lambda(
            [position],
            translateTest(
              argument,
              bindIndexed(argument, sequence, identifier(position), scope, context, {
                owner: call.owner,
                indices: call.indices,
              }),
              context,
            ),
          ),
        ]);
        return share(selected, "selected", context, (indices) => {
          const kept = context.names.getFresh("index");
          return functionOf(
            [bound(kept, getDomain(indices))],
            index(sequence, [index(indices, [identifier(kept)])]),
          );
        });
      },
    ],
    [
      "toString",
      () => {
        if (argument !== undefined) {
          throw new TlaTypeScriptError(`Unsupported array method: ${method}`, node);
        }
        return useJavaScript(
          call.elementType !== undefined && (call.elementType.flags & ts.TypeFlags.StringLike) !== 0
            ? "Join"
            : "JoinValues",
          [sequence, string(",")],
          context,
        );
      },
    ],
    [
      "join",
      () => {
        const isText = (type: ts.Type | undefined) =>
          type !== undefined && (type.flags & ts.TypeFlags.StringLike) !== 0;
        if (argument !== undefined && !isText(context.checker.getTypeAtLocation(argument))) {
          throw new TlaTypeScriptError("join() needs a string separator", node);
        }
        return useJavaScript(
          isText(call.elementType) ? "Join" : "JoinValues",
          [sequence, argument === undefined ? string(",") : translate(argument)],
          context,
        );
      },
    ],
    ["reduce", getReduced(false)],
    ["reduceRight", getReduced(true)],
    ["find", getFound(false)],
    ["findLast", getFound(true)],
    ["findIndex", getFoundIndex(false)],
    ["findLastIndex", getFoundIndex(true)],
  ]);
  const operation = operations.get(method);
  if (operation === undefined)
    throw new TlaTypeScriptError(`Unsupported array method: ${method}`, node);
  return operation();
};

const translateUnorderedMethod = (
  node: MethodCall,
  source: Unordered,
  scope: Scope,
  context: Context,
  isDefined: boolean,
) => {
  const method = node.expression.name.text;
  const argument = node.arguments[0];
  if (method === "includes" || method === "has") {
    if (!context.hasSpecialNumbers) {
      return apply("\\in", [translateExpression(argument, scope, context), source.set]);
    }
    const element = context.names.getFresh("element");
    return quantify(
      "Exists",
      [bound(element, source.set)],
      useJavaScript(
        "SameValueZero",
        [identifier(element), translateExpression(argument, scope, context)],
        context,
      ),
    );
  }
  if (method !== "every" && method !== "some" && method !== "find") {
    throw new TlaTypeScriptError(`Unsupported method on a set's elements: ${method}`, node);
  }
  rejectIndex(argument, "Elements of a set have no index", scope, context);
  const element = bindElement(argument, scope, context);
  const body = translateTest(argument, element.scope, context);
  const bounds = [bound(element.variable, source.set)];
  if (method === "every") return quantify("Forall", bounds, body);
  if (method === "some") return quantify("Exists", bounds, body);
  const chosen = choose(element.variable, source.set, body);
  if (isDefined) return chosen;
  return ifExpression(quantify("Exists", bounds, body), chosen, getUndefined(context));
};

const translateSetMethod = (node: MethodCall, scope: Scope, context: Context) => {
  const method = node.expression.name.text;
  const operations = new Map<string, (values: Expression, other: Expression) => Expression>([
    ["has", (values, other) => apply("\\in", [other, values])],
    ["union", (values, other) => apply("\\cup", [values, other])],
    ["intersection", (values, other) => apply("\\cap", [values, other])],
    ["difference", (values, other) => apply("\\", [values, other])],
    [
      "symmetricDifference",
      (values, other) =>
        apply("\\cup", [apply("\\", [values, other]), apply("\\", [other, values])]),
    ],
    ["isSubsetOf", (values, other) => apply("\\subseteq", [values, other])],
    ["isSupersetOf", (values, other) => apply("\\subseteq", [other, values])],
    ["isDisjointFrom", (values, other) => apply("=", [apply("\\cap", [values, other]), set([])])],
  ]);
  const operation = operations.get(method);
  if (operation === undefined || node.arguments[0] === undefined) {
    throw new TlaTypeScriptError(`Unsupported Set method: ${method}`, node);
  }
  const argument = node.arguments[0];
  const kind = getKind(argument, context);
  if (method !== "has" && kind !== "set" && kind !== "map") {
    throw new TlaTypeScriptError(`Pass a Set or a Map to ${method}()`, argument);
  }
  const values = translateExpression(node.expression.expression, scope, context);
  const other = translateSetKey(argument, scope, context);
  return operation(values, method !== "has" && kind === "map" ? getDomain(other) : other);
};

const translateMapMethod = (
  node: MethodCall,
  scope: Scope,
  context: Context,
  isDefined: boolean,
) => {
  const method = node.expression.name.text;
  if ((method !== "has" && method !== "get") || node.arguments[0] === undefined) {
    throw new TlaTypeScriptError(`Unsupported Map method: ${method}`, node);
  }
  const value = translateExpression(node.expression.expression, scope, context);
  const key = translateSetKey(node.arguments[0], scope, context);
  if (method === "has") return apply("\\in", [key, getDomain(value)]);
  if (isDefined) return index(value, [key]);
  return share(value, "map", context, (sharedMap) =>
    share(key, "key", context, (sharedKey) =>
      ifExpression(
        apply("\\in", [sharedKey, getDomain(sharedMap)]),
        index(sharedMap, [sharedKey]),
        getUndefined(context),
      ),
    ),
  );
};

const removeLast = (current: Expression) =>
  apply("SubSeq", [current, number(1), apply("-", [apply("Len", [current]), number(1)])]);

// Flattens a sequence by levels while its elements' types are all arrays, and stops at a level
// whose types hold no array. A level that may hold both has elements that tla-ts can't tell apart.
const flattenTypes = (
  sequence: Expression,
  types: readonly ts.Type[],
  depth: number,
  node: ts.Node,
  context: Context,
  level = 0,
): Expression => {
  const checker = context.checker;
  const members = types.flatMap((type) => (type.isUnion() ? type.types : [type]));
  const isArray = (type: ts.Type) => checker.isArrayType(type) || checker.isTupleType(type);
  // An object type that an array fits, such as {}, which TypeScript may give [{}, [{}]] as its
  // elements' type, may hold an array. The array that flat() gives is one.
  const array = checker.getTypeAtLocation(node);
  const mayBeArray = (type: ts.Type) =>
    isArray(type) ||
    (type.flags &
      (ts.TypeFlags.Any |
        ts.TypeFlags.Unknown |
        ts.TypeFlags.NonPrimitive |
        ts.TypeFlags.TypeParameter)) !==
      0 ||
    ((type.flags & ts.TypeFlags.Object) !== 0 && checker.isTypeAssignableTo(array, type));
  if (depth < 1 || !members.some(mayBeArray)) return sequence;
  // A type that holds itself, as type Nested = Nested[] does, would flatten forever.
  if (!members.every(isArray) || level > 32) {
    throw new TlaTypeScriptError(
      "Flatten only an array whose elements are all arrays, or none of them",
      node,
    );
  }
  return flattenTypes(
    useJavaScript("Flatten", [sequence], context),
    members.flatMap((member) => checker.getIndexTypeOfType(member, ts.IndexKind.Number) ?? []),
    depth - 1,
    node,
    context,
    level + 1,
  );
};

// An array's keys(), values(), or entries() that a for-of or a spread reads at once, which visits
// what a sequence of them holds. Anywhere else the iterator is an object, whose identity and
// progress a sequence can't show.
export const isArrayIteration = (node: ts.Node, context: Context) =>
  isMethodCall(node) &&
  ITERATOR_METHODS.includes(node.expression.name.text) &&
  node.arguments.length === 0 &&
  getKind(node.expression.expression, context) === "sequence" &&
  ((ts.isForOfStatement(node.parent) && node.parent.expression === node) ||
    ts.isSpreadElement(node.parent));

// A call that makes an array's iterator as an object in the heap, or a call of that iterator's
// next. The iterator reads an array that the heap holds as it steps, or a literal that nothing
// else holds, which can't change.
export const getArrayIteratorCall = (node: ts.Node, context: Context) => {
  if (
    context.heap === undefined ||
    !ts.isCallExpression(node) ||
    node.arguments.length > 0 ||
    !(
      ts.isPropertyAccessExpression(node.expression) ||
      ts.isElementAccessExpression(node.expression)
    ) ||
    node.expression.questionDotToken !== undefined
  ) {
    return undefined;
  }
  const callee = node.expression;
  const receiver = callee.expression;
  if (ts.isPropertyAccessExpression(callee) && callee.name.text === "next") {
    return context.checker.getTypeAtLocation(receiver).getSymbol()?.name === "ArrayIterator"
      ? { kind: undefined, receiver, key: "next", path: "%ArrayIteratorPrototype%.next" }
      : undefined;
  }
  const kind = getKeptIterator(node, context);
  return kind !== undefined &&
    (isHeapArray(receiver, context) ||
      (ts.isArrayLiteralExpression(receiver) && getKind(receiver, context) === "sequence"))
    ? {
        kind,
        receiver,
        key: ts.isElementAccessExpression(callee) ? "@@iterator" : kind,
        path: `Array.prototype.${kind}`,
      }
    : undefined;
};

// %ArrayIteratorPrototype%, with its next, whose own properties a script may read.
export const translateArrayIteratorPrototype = (node: ts.Node, context: Context) => {
  context.builtIns.add("%ArrayIteratorPrototype%.next");
  return translateBuiltInValue("%ArrayIteratorPrototype%", node, context);
};

// Whether the receiver of an array iterator call still reads the built-in method it calls.
export const translateHoldsIteratorMethod = (
  call: NonNullable<ReturnType<typeof getArrayIteratorCall>>,
  heap: Expression,
  receiver: Expression,
  context: Context,
) => {
  // A sequence reads its methods from Array.prototype.
  context.builtIns.add("Array.prototype");
  return useJavaScript(
    "HoldsBuiltIn",
    [
      heap,
      receiver,
      call.key === "@@iterator"
        ? useJavaScript("WellKnownSymbol", [string("iterator")], context)
        : string(call.key),
      string(call.path),
    ],
    context,
  );
};

// An index argument as ClampedIndex counts it, or a fallback where it's missing or undefined.
const translateClampedIndex = (
  argument: ts.Expression | undefined,
  fallback: Expression,
  length: Expression,
  scope: Scope,
  context: Context,
) => {
  if (argument === undefined) return fallback;
  const value = translateExpression(argument, scope, context);
  if (isNumberLike(argument, context)) {
    return useJavaScript("ClampedIndex", [value, length], context);
  }
  return share(value, "index", context, (shared) =>
    ifExpression(
      apply("=", [shared, getUndefined(context)]),
      fallback,
      useJavaScript(
        "ClampedIndex",
        [useJavaScript("ToNumber", [shared], context), length],
        context,
      ),
    ),
  );
};

// What toSpliced() or splice() keeps of a sequence with the items it inserts, or what splice()
// removes.
export const translateSpliced = (
  sequence: Expression,
  methodArguments: readonly ts.Expression[],
  isRemoved: boolean,
  scope: Scope,
  context: Context,
) => {
  if (methodArguments.some(ts.isSpreadElement)) {
    throw new TlaTypeScriptError("Unsupported array method: splice", methodArguments[0]);
  }
  const [first, count] = methodArguments;
  return share(sequence, "sequence", context, (shared) => {
    const length = apply("Len", [shared]);
    const start = translateClampedIndex(first, number(0), length, scope, context);
    return share(start, "start", context, (at) => {
      const remaining = apply("-", [length, at]);
      const skipped =
        first === undefined
          ? number(0)
          : count === undefined
            ? remaining
            : useJavaScript(
                "ClampedCount",
                [
                  isNumberLike(count, context)
                    ? translateExpression(count, scope, context)
                    : useJavaScript(
                        "ToNumber",
                        [translateExpression(count, scope, context)],
                        context,
                      ),
                  remaining,
                ],
                context,
              );
      const end = apply("+", [at, skipped]);
      return isRemoved
        ? apply("SubSeq", [shared, apply("+", [at, number(1)]), end])
        : apply("\\o", [
            apply("\\o", [
              apply("SubSeq", [shared, number(1), at]),
              tuple(
                methodArguments
                  .slice(2)
                  .map((argument) => translateExpression(argument, scope, context)),
              ),
            ]),
            apply("SubSeq", [shared, apply("+", [end, number(1)]), length]),
          ]);
    });
  });
};

const reverseSequence = (sequence: Expression, context: Context) => {
  const position = context.names.getFresh("index");
  return functionOf(
    [bound(position, apply("DOMAIN", [sequence]))],
    index(sequence, [
      apply("+", [apply("-", [apply("Len", [sequence]), identifier(position)]), number(1)]),
    ]),
  );
};

// The comparator that sort() orders by: whether its callback gives a number below 0, or else the
// order of the elements' strings.
export const translateSortOrder = (
  comparator: ts.Expression | undefined,
  scope: Scope,
  context: Context,
) => {
  if (
    comparator === undefined ||
    (context.checker.getTypeAtLocation(comparator).flags & ts.TypeFlags.Undefined) !== 0
  ) {
    return identifier("DefaultSortBefore");
  }
  const found = getCallback(comparator, scope, context);
  // An order whose comparator throws would vanish where nothing reads the sorted array.
  if (mayThrow(found.body, context)) {
    throw new TlaTypeScriptError("Unsupported comparator: one that may throw", comparator);
  }
  const names = [context.names.getFresh("left"), context.names.getFresh("right")];
  const inner = found.parameters.reduce(
    (current, parameter, position) =>
      position < names.length
        ? bindPatternInline(parameter.name, identifier(names[position]), current, context)
        : current,
    found.scope(scope),
  );
  const result = translateCallback(comparator, inner, context);
  const callee = getCallbackFunction(comparator, scope, context);
  const returned =
    callee === undefined
      ? undefined
      : context.checker.getSignatureFromDeclaration(callee)?.getReturnType();
  const isNumber = returned !== undefined && isEvery(returned, ts.TypeFlags.NumberLike);
  return lambda(
    names,
    isNumber && !context.hasSpecialNumbers
      ? apply("<", [result, number(0)])
      : useJavaScript(
          "LessThan",
          [isNumber ? result : useJavaScript("ToNumber", [result], context), number(0)],
          context,
        ),
  );
};

// The methods that reorder or overwrite an array in place, and give the array.
const REORDER_METHODS = new Set(["sort", "reverse", "fill", "copyWithin"]);

// The methods that change only an array value in place, which an object's method of the same name
// doesn't.
export const SEQUENCE_UPDATES = new Set([...REORDER_METHODS, "splice"]);

// A sequence after sort, reverse, fill, or copyWithin.
const translateReorder = (
  sequence: Expression,
  node: MethodCall,
  scope: Scope,
  context: Context,
) => {
  const method = node.expression.name.text;
  const [first, second, third] = node.arguments;
  if (node.arguments.some(ts.isSpreadElement)) {
    throw new TlaTypeScriptError(`Unsupported array method: ${method}`, node);
  }
  if (method === "reverse") return reverseSequence(sequence, context);
  if (method === "sort") {
    return useJavaScript(
      "SortSequence",
      [sequence, translateSortOrder(first, scope, context)],
      context,
    );
  }
  return share(sequence, "sequence", context, (shared) => {
    const length = apply("Len", [shared]);
    const clamp = (argument: ts.Expression | undefined, fallback: Expression) =>
      translateClampedIndex(argument, fallback, length, scope, context);
    return method === "fill"
      ? useJavaScript(
          "SequenceFill",
          [
            shared,
            first === undefined
              ? getUndefined(context)
              : translateExpression(first, scope, context),
            clamp(second, number(0)),
            clamp(third, length),
          ],
          context,
        )
      : useJavaScript(
          "SequenceCopyWithin",
          [shared, clamp(first, number(0)), clamp(second, number(0)), clamp(third, length)],
          context,
        );
  });
};

const UPDATES = new Map<Kind, Map<string, Update>>([
  [
    "sequence",
    new Map<string, Update>([
      [
        "push",
        (current, values) =>
          values.length === 1
            ? apply("Append", [current, values[0]])
            : apply("\\o", [current, tuple(values)]),
      ],
      ["unshift", (current, values) => apply("\\o", [tuple(values), current])],
      ["pop", (current) => removeLast(current)],
      // Tail of an empty sequence is an error in TLC, where JavaScript's shift changes nothing.
      ["shift", (current) => apply("SubSeq", [current, number(2), apply("Len", [current])])],
    ]),
  ],
  [
    "set",
    new Map<string, Update>([
      ["add", (current, values) => apply("\\cup", [current, set([values[0]])])],
      ["delete", (current, values) => apply("\\", [current, set([values[0]])])],
      ["clear", () => set([])],
    ]),
  ],
  [
    "map",
    new Map<string, Update>([
      ["set", (current, values) => apply("@@", [apply(":>", [values[0], values[1]]), current])],
      [
        "delete",
        (current, values, context) => {
          const key = context.names.getFresh("key");
          return functionOf(
            [bound(key, apply("\\", [getDomain(current), set([values[0]])]))],
            index(current, [identifier(key)]),
          );
        },
      ],
      ["clear", () => tuple([])],
    ]),
  ],
]);

export const MUTATING_METHODS = new Set([
  ...[...UPDATES.values()].flatMap((updates) => [...updates.keys()]),
  ...SEQUENCE_UPDATES,
]);

// The value of a collection after a mutating method call, or undefined if the method doesn't
// mutate.
// A method of an array value, which runs only where the prototype still holds the built-in method,
// as a script that writes Array.prototype or Object.prototype may replace it.
export const checkArrayMethod = (
  value: Expression,
  node: MethodCall,
  scope: Scope,
  context: Context,
) => {
  const method = node.expression.name.text;
  // toString runs the array's join.
  const methods = method === "toString" ? [method, "join"] : [method];
  return context.hasInheritedElements && context.heap !== undefined
    ? ifExpression(
        junction(
          "And",
          methods.map((checked) =>
            useJavaScript(
              "HoldsBuiltIn",
              [
                getHeap(scope, node, context),
                translateBuiltInValue("Array.prototype", node, context),
                string(checked),
                string(`${checked === "hasOwnProperty" ? "Object" : "Array"}.prototype.${checked}`),
              ],
              context,
            ),
          ),
        ),
        value,
        apply("Assert", [
          boolean(false),
          string("tla-ts can't call an array method that a script put on a prototype"),
        ]),
      )
    : value;
};

export const getUpdatedValue = (
  current: Expression,
  kind: Kind,
  node: MethodCall,
  scope: Scope,
  context: Context,
) => {
  if (kind === "sequence" && SEQUENCE_UPDATES.has(node.expression.name.text)) {
    return checkArrayMethod(
      node.expression.name.text === "splice"
        ? translateSpliced(current, node.arguments, false, scope, context)
        : translateReorder(current, node, scope, context),
      node,
      scope,
      context,
    );
  }
  const values = node.arguments.map((argument, position) =>
    position === 0 && (kind === "set" || kind === "map")
      ? translateSetKey(argument, scope, context)
      : translateExpression(argument, scope, context),
  );
  const updated = UPDATES.get(kind)?.get(node.expression.name.text)?.(current, values, context);
  return kind === "sequence" && updated !== undefined
    ? checkArrayMethod(updated, node, scope, context)
    : updated;
};

export const translateMethod = (
  node: MethodCall,
  scope: Scope,
  context: Context,
  isDefined: boolean,
) => {
  const receiver = node.expression.expression;
  const unordered = translateUnordered(receiver, scope, context);
  if (unordered !== undefined) {
    return translateUnorderedMethod(node, unordered, scope, context, isDefined);
  }
  // A mutating method on a fresh copy, such as new Set(s).add(x), returns the updated copy.
  const isCopy =
    ts.isNewExpression(receiver) &&
    receiver.arguments?.length === 1 &&
    ts.isIdentifier(receiver.expression) &&
    (receiver.expression.text === "Set" || receiver.expression.text === "Map");
  const kind = getKind(receiver, context);
  const updated = isCopy
    ? getUpdatedValue(translateExpression(receiver, scope, context), kind, node, scope, context)
    : undefined;
  if (updated !== undefined) return updated;
  // A fresh array literal that a method reorders in place is the array that the call gives.
  if (
    kind === "sequence" &&
    REORDER_METHODS.has(node.expression.name.text) &&
    ts.isArrayLiteralExpression(skipCasts(receiver))
  ) {
    return checkArrayMethod(
      translateReorder(translateExpression(receiver, scope, context), node, scope, context),
      node,
      scope,
      context,
    );
  }
  if (kind === "sequence") {
    const method = node.expression.name.text;
    const sequence = translateMethodElements(
      method,
      translateExpression(receiver, scope, context),
      undefined,
      node,
      scope,
      context,
    );
    const call = {
      node,
      method,
      arguments: node.arguments,
      elementType: context.checker.getIndexTypeOfType(
        context.checker.getTypeAtLocation(receiver),
        ts.IndexKind.Number,
      ),
      owner: undefined,
    };
    const translateWith = (shared: Expression) =>
      translateSequenceOperation(call, shared, scope, context, isDefined);
    return checkArrayMethod(
      SINGLE_USE_METHODS.has(method)
        ? translateWith(sequence)
        : share(sequence, "sequence", context, translateWith),
      node,
      scope,
      context,
    );
  }
  if (kind === "set") return translateSetMethod(node, scope, context);
  if (kind === "map") return translateMapMethod(node, scope, context, isDefined);
  const symbolMethod = node.expression.name.text;
  const receiverNames = getTypeNames(context.checker.getTypeAtLocation(receiver), context.checker);
  if (
    receiverNames?.length === 1 &&
    receiverNames[0] === "symbol" &&
    (symbolMethod === "toString" || symbolMethod === "valueOf") &&
    node.arguments.length === 0
  ) {
    return translateSymbolProperty(receiver, symbolMethod, node, scope, context);
  }
  if (context.heap !== undefined && kind === "object" && isDateType(receiver, context)) {
    const method = node.expression.name.text;
    const field = DATE_FIELDS.get(method);
    const isKnown = field !== undefined || TIME_METHODS.has(method) || method === "toISOString";
    if (!isKnown || node.arguments.length > 0) {
      return translateUnknown(node, `Unsupported call: ${node.expression.getText()}`, context);
    }
    const time = useJavaScript(
      "DateTime",
      [
        getHeap(scope, node, context),
        translateExpression(receiver, scope, context),
        string(method),
      ],
      context,
    );
    if (method === "toISOString") {
      return share(time, "time", context, (shared) =>
        ifExpression(
          apply("=", [shared, identifier("NaN")]),
          apply("Assert", [
            boolean(false),
            string("tla-ts can't throw the RangeError of toISOString here"),
          ]),
          useJavaScript("ISOString", [shared], context),
        ),
      );
    }
    return field === undefined
      ? useJavaScript("TimeNumber", [time], context)
      : useJavaScript("DateField", [time, string(field)], context);
  }
  // valueOf on a value whose type doesn't tell what it is, such as this in a callback, which may
  // be a primitive or a wrapper object.
  if (
    context.heap !== undefined &&
    node.expression.name.text === "valueOf" &&
    node.arguments.length === 0 &&
    (kind === "object" || kind === "other") &&
    !isNumberLike(receiver, context) &&
    !isBooleanLike(receiver, context) &&
    !WRAPPERS.has(context.checker.getTypeAtLocation(receiver).getSymbol()?.name ?? "")
  ) {
    return useJavaScript(
      "ValueOf",
      [
        getHeap(scope, node, context),
        translateExpression(receiver, scope, context),
        tuple(
          (["Boolean.prototype", "Number.prototype", "String.prototype"] as const).map(
            (prototype) => translateBuiltInValue(prototype, node, context),
          ),
        ),
      ],
      context,
    );
  }
  const regExpCall = translateRegExpCall(node, scope, context);
  if (regExpCall !== undefined) return regExpCall;
  const primitiveCall = getPrimitiveCall(node, kind, context);
  const primitiveMethod = primitiveCall?.methods.get(primitiveCall.method);
  const isTyped =
    primitiveCall !== undefined &&
    primitiveMethod !== undefined &&
    primitiveCall.methodArguments.length <= primitiveMethod.parameters.length &&
    primitiveCall.methodArguments.every((argument, position) =>
      primitiveMethod.parameters[position] === "number"
        ? isNumberLike(argument, context) ||
          isEvery(context.checker.getTypeAtLocation(argument), ts.TypeFlags.Undefined)
        : isEvery(context.checker.getTypeAtLocation(argument), ts.TypeFlags.StringLike),
    );
  if (
    primitiveCall === undefined &&
    kind === "object" &&
    getStoredToStringReceiver(node, context) !== undefined
  ) {
    return translateLocalCall(node, scope, context);
  }
  if (primitiveCall === undefined || primitiveMethod === undefined || !isTyped) {
    return translateUnknown(node, `Unsupported call: ${node.expression.getText()}`, context);
  }
  const translateOptional = (argument: ts.Expression | undefined) =>
    argument === undefined ? getUndefined(context) : translateExpression(argument, scope, context);
  return translatePrimitiveMethod(
    primitiveMethod,
    primitiveCall.wrapper !== undefined
      ? useJavaScript(
          "WrappedPrimitive",
          [
            getHeap(scope, node, context),
            translateExpression(receiver, scope, context),
            string(primitiveCall.wrapper),
            string(primitiveCall.method),
          ],
          context,
        )
      : primitiveCall.converter === undefined
        ? translateExpression(receiver, scope, context)
        : useJavaScript(primitiveCall.converter, [translateOptional(primitiveCall.owner)], context),
    primitiveCall.methodArguments.map(translateOptional),
    context,
  );
};

// The JavaScript module's operators for each method that runs a regexp, without objects and with
// them.
const REGEXP_OPERATORS = new Map([
  ["exec", ["RegExpExec", "RegExpExecIn"]],
  ["test", ["RegExpTest", "RegExpTestIn"]],
  ["match", ["RegExpMatch", "RegExpMatchIn"]],
  ["search", ["RegExpSearchIndex", "RegExpSearchIn"]],
  ["split", ["RegExpSplit", "RegExpSplitIn"]],
  ["replace", ["RegExpReplace", "RegExpReplaceIn"]],
  ["replaceAll", ["RegExpReplaceAll", "RegExpReplaceIn"]],
]);

interface RegExpCall {
  method: string;
  operator: string;
  heapOperator: string;
  regexp: ts.Expression;
  text: ts.Expression;
  // Whether the text is a String object, which the call converts to its string.
  isWrapped: boolean;
  // The arguments after the regexp and the text: split's limit, or replace's replacement.
  values: readonly ts.Expression[];
}

// A regexp's exec or test of a string, or a string's method that calls a regexp's.
const getRegExpCall = (node: ts.Node, context: Context): RegExpCall | undefined => {
  if (!isMethodCall(node)) return undefined;
  const receiver = node.expression.expression;
  const method = node.expression.name.text;
  const values = node.arguments;
  const isRegExp = (value: ts.Expression | undefined) =>
    value !== undefined && context.checker.getTypeAtLocation(value).getSymbol()?.name === "RegExp";
  const isText = (value: ts.Expression | undefined) =>
    value !== undefined &&
    isEvery(context.checker.getTypeAtLocation(value), ts.TypeFlags.StringLike);
  const isWrapped =
    context.heap !== undefined &&
    context.checker.getTypeAtLocation(receiver).getSymbol()?.name === "String";
  const operators = REGEXP_OPERATORS.get(method);
  if (operators === undefined) return undefined;
  const getCall = (regexp: ts.Expression, text: ts.Expression, rest: readonly ts.Expression[]) => ({
    method,
    operator: operators[0],
    heapOperator: operators[1],
    regexp,
    text,
    isWrapped: text === receiver && isWrapped,
    values: rest,
  });
  if (isRegExp(receiver) && (method === "exec" || method === "test")) {
    return values.length === 1 && isText(values[0]) ? getCall(receiver, values[0], []) : undefined;
  }
  // search and match make a regexp of a string.
  const isMade =
    (method === "search" || method === "match") && getStringRegExp(values[0]) !== undefined;
  if ((!isText(receiver) && !isWrapped) || (!isRegExp(values[0]) && !isMade)) return undefined;
  const limit = values.at(1);
  const isKnown =
    ((method === "match" || method === "search") && values.length === 1) ||
    (method === "split" &&
      (limit === undefined ||
        (values.length === 2 &&
          (isNumberLike(limit, context) ||
            isEvery(context.checker.getTypeAtLocation(limit), ts.TypeFlags.Undefined))))) ||
    ((method === "replace" || method === "replaceAll") && values.length === 2);
  return isKnown ? getCall(values[0], receiver, values.slice(1)) : undefined;
};

// The string that a regexp call reads, which ToString gives for a String object.
export const translateRegExpText = (
  call: RegExpCall,
  node: ts.Node,
  scope: Scope,
  context: Context,
) =>
  call.isWrapped
    ? useJavaScript(
        "WrapperString",
        [getHeap(scope, node, context), translateExpression(call.text, scope, context)],
        context,
      )
    : translateExpression(call.text, scope, context);

// A call that a script with objects runs as a statement, since it reads or changes the heap.
export const getHeapRegExpCall = (node: ts.Node, context: Context) => {
  const call = context.heap === undefined ? undefined : getRegExpCall(node, context);
  return call === undefined || getStringRegExp(call.regexp) !== undefined ? undefined : call;
};

// A RegExp's exec or test, or a String method that calls a regexp's, as an expression, where a
// regexp is the record of its pattern. With objects, a statement runs the call where it can, and
// an expression only one that reads a literal and gives no object, so that no one can observe the
// object that the literal makes. tla-ts then follows the built-in methods only while a script
// hasn't changed those that the call reads.
const translateRegExpCall = (node: MethodCall, scope: Scope, context: Context) => {
  const call = getRegExpCall(node, context);
  if (
    call === undefined ||
    (context.heap !== undefined &&
      ((!ts.isRegularExpressionLiteral(call.regexp) &&
        getStringRegExp(call.regexp) === undefined) ||
        call.method === "exec" ||
        call.method === "match"))
  ) {
    return undefined;
  }
  const translate = (value: ts.Expression) => translateExpression(value, scope, context);
  const changeable = [
    "RegExp.prototype",
    ...(call.method === "test" ? [] : ["String.prototype"]),
    ...(call.method === "split" ? ["RegExp"] : []),
  ];
  const regexp =
    context.heap === undefined
      ? getStringRegExp(call.regexp) === undefined
        ? translate(call.regexp)
        : translateRegExpValue(call.regexp, context)
      : useJavaScript(
          "RegExpFresh",
          [
            getHeap(scope, node, context),
            translateRegExpValue(call.regexp, context),
            set(changeable.map(string)),
          ],
          context,
        );
  const replacement = call.values.at(0);
  if (
    (call.method === "replace" || call.method === "replaceAll") &&
    replacement !== undefined &&
    !isEvery(context.checker.getTypeAtLocation(replacement), ts.TypeFlags.StringLike)
  ) {
    return share(regexp, "regexp", context, (sharedRegexp) =>
      share(translateRegExpText(call, node, scope, context), "text", context, (text) =>
        share(
          useJavaScript(
            "RegExpMatchesOf",
            [sharedRegexp, text, boolean(call.method === "replaceAll")],
            context,
          ),
          "matches",
          context,
          (matches) =>
            translateRegExpReplacer(replacement, sharedRegexp, text, matches, scope, context),
        ),
      ),
    );
  }
  return useJavaScript(
    call.operator,
    [
      regexp,
      translateRegExpText(call, node, scope, context),
      ...(call.method === "split" && replacement === undefined
        ? [getUndefined(context)]
        : call.values.map(translate)),
    ],
    context,
  );
};

// replace or replaceAll with a function, whose body gives each match's replacement with its
// parameters bound to the matched text, the captures, the position, the text, and the groups.
export const translateRegExpReplacer = (
  replacer: ts.Expression,
  regexp: Expression,
  text: Expression,
  matches: Expression,
  scope: Scope,
  context: Context,
) => {
  const callback = getCallback(replacer, scope, context);
  const callee = getCallee(replacer, context);
  const signature = callee && context.checker.getSignatureFromDeclaration(callee);
  const returned = signature?.getReturnType();
  if (
    returned === undefined ||
    !isEvery(returned, ts.TypeFlags.StringLike) ||
    callback.parameters.some((parameter) => !ts.isIdentifier(parameter.name))
  ) {
    throw new TlaTypeScriptError("Pass a function that returns a string here", replacer);
  }
  const position = context.names.getFresh("position");
  const bodyScope = bindNames(
    callback.scope(scope),
    callback.parameters.map((parameter, argument) => ({
      name: useJavaScript(
        context.heap === undefined ? "RegExpArgument" : "RegExpArgumentIn",
        [regexp, text, index(matches, [identifier(position)]), number(argument)],
        context,
      ),
      symbol: getSymbol(parameter.name, context.checker),
    })),
  );
  return useJavaScript(
    "RegExpReplaceWith",
    [
      text,
      matches,
      functionOf(
        [bound(position, apply("DOMAIN", [matches]))],
        translateBody(callback.body, bodyScope, context),
      ),
    ],
    context,
  );
};

// A method call on a string or a number, or String.prototype.method.call(value, ...arguments),
// which converts the value as the method reads it.
const getPrimitiveCall = (node: MethodCall, kind: Kind, context: Context) => {
  const receiver = node.expression.expression;
  const prototype =
    node.expression.name.text === "call" && ts.isPropertyAccessExpression(receiver)
      ? PRIMITIVE_PROTOTYPES.get(receiver.expression.getText())
      : undefined;
  if (prototype !== undefined && ts.isPropertyAccessExpression(receiver)) {
    return {
      ...prototype,
      method: receiver.name.text,
      owner: node.arguments.at(0),
      methodArguments: node.arguments.slice(1),
      wrapper: undefined,
    };
  }
  // A String, Number, or Boolean object, or an instance of a class that extends one, whose
  // primitive the method reads.
  const symbol =
    kind === "object" ? context.checker.getTypeAtLocation(receiver).getSymbol() : undefined;
  const declaration = symbol?.valueDeclaration;
  const wrapper =
    declaration !== undefined && ts.isClassLike(declaration)
      ? getBuiltInBase(declaration, context)
      : symbol?.name;
  const methods =
    kind === "string" || wrapper === "String"
      ? new Map([...STRING_METHODS, ...STRING_VALUE_METHODS])
      : isNumberLike(receiver, context) || wrapper === "Number"
        ? NUMBER_METHODS
        : isBooleanLike(receiver, context) || wrapper === "Boolean"
          ? BOOLEAN_METHODS
          : isBigIntLike(receiver, context)
            ? BIGINT_METHODS
            : undefined;
  return (
    methods && {
      methods,
      converter: undefined,
      method: node.expression.name.text,
      owner: undefined,
      methodArguments: node.arguments,
      wrapper: wrapper !== undefined && WRAPPERS.has(wrapper) ? wrapper : undefined,
    }
  );
};

// A call of a String.prototype method through call, directly or through a variable that its
// declaration gives the method, on a value that a statement converts to a string: undefined,
// null, and symbols throw a TypeError, and objects convert through ToPrimitive.
export const getStringCall = (node: ts.Node, context: Context) => {
  if (context.heap === undefined || !isMethodCall(node) || node.expression.name.text !== "call") {
    return undefined;
  }
  const callee = node.expression.expression;
  const method = getPrototypeMethod(callee, "String", context);
  const primitive = method === undefined ? undefined : STRING_METHODS.get(method);
  const owner = node.arguments.at(0);
  const values = node.arguments.slice(1);
  if (
    method === undefined ||
    primitive === undefined ||
    owner === undefined ||
    ts.isSpreadElement(owner) ||
    values.length > primitive.parameters.length ||
    !values.every((value, position) =>
      primitive.parameters[position] === "number"
        ? isNumberLike(value, context)
        : isEvery(context.checker.getTypeAtLocation(value), ts.TypeFlags.StringLike),
    )
  ) {
    return undefined;
  }
  // String.prototype.method.call of a primitive reads it as a string in an expression, and tla-ts
  // can't convert a function, whose source text it doesn't keep.
  const type = context.checker.getTypeAtLocation(owner);
  const isDirect = ts.isPropertyAccessExpression(callee);
  const isPrimitive = isEvery(
    type,
    ts.TypeFlags.StringLike | ts.TypeFlags.NumberLike | ts.TypeFlags.BooleanLike,
  );
  return (isDirect && isPrimitive) ||
    getTypeNames(type, context.checker)?.includes("function") === true
    ? undefined
    : { method, primitive, callee, owner, values };
};

// The value of a primitive's method, given the primitive that it reads and its arguments.
export const translatePrimitiveMethod = (
  method: PrimitiveMethod,
  text: Expression,
  values: readonly Expression[],
  context: Context,
) => {
  const result = useJavaScript(
    method.operator,
    [
      text,
      ...method.parameters.map((_, position) => values[position] ?? getUndefined(context)),
      ...(method.trimmed ?? []).map(boolean),
      ...(method.tag === undefined ? [] : [string(method.tag)]),
    ],
    context,
  );
  // A script that holds only integers can't hold the NaN that a method may give.
  return method.isNaNable === true && !context.hasSpecialNumbers
    ? useJavaScript("PlainNumber", [result], context)
    : result;
};

// The types of the objects that wrap a primitive.
const WRAPPERS = new Set(["Boolean", "Number", "String"]);

interface PrimitiveMethod {
  operator: string;
  // The kinds of the arguments, where one that a call omits is undefined.
  parameters: ("number" | "string")[];
  trimmed?: [boolean, boolean];
  // The element that an HTML method wraps the string in.
  tag?: string;
  isNaNable?: boolean;
}

const STRING_METHODS = new Map<string, PrimitiveMethod>([
  ["at", { operator: "StringAt", parameters: ["number"] }],
  ["charAt", { operator: "CharAt", parameters: ["number"] }],
  ["charCodeAt", { operator: "CharCodeAt", parameters: ["number"], isNaNable: true }],
  ["codePointAt", { operator: "CodePointAt", parameters: ["number"] }],
  ["slice", { operator: "StringSlice", parameters: ["number", "number"] }],
  ["substring", { operator: "Substring", parameters: ["number", "number"] }],
  ["substr", { operator: "Substr", parameters: ["number", "number"] }],
  ["indexOf", { operator: "StringIndexOf", parameters: ["string", "number"] }],
  ["lastIndexOf", { operator: "StringLastIndexOf", parameters: ["string", "number"] }],
  ["includes", { operator: "StringIncludes", parameters: ["string", "number"] }],
  ["startsWith", { operator: "StartsWith", parameters: ["string", "number"] }],
  ["endsWith", { operator: "EndsWith", parameters: ["string", "number"] }],
  ["toLowerCase", { operator: "ToLowerCase", parameters: [] }],
  ["toUpperCase", { operator: "ToUpperCase", parameters: [] }],
  ["padStart", { operator: "PadStart", parameters: ["number", "string"] }],
  ["padEnd", { operator: "PadEnd", parameters: ["number", "string"] }],
  ["trim", { operator: "StringTrim", parameters: [], trimmed: [true, true] }],
  ["trimStart", { operator: "StringTrim", parameters: [], trimmed: [true, false] }],
  ["trimEnd", { operator: "StringTrim", parameters: [], trimmed: [false, true] }],
  ["split", { operator: "StringSplit", parameters: ["string", "number"] }],
  ["replace", { operator: "StringReplace", parameters: ["string", "string"] }],
  ["replaceAll", { operator: "StringReplaceAll", parameters: ["string", "string"] }],
  ["repeat", { operator: "StringRepeat", parameters: ["number"] }],
  ["concat", { operator: "StringConcat", parameters: ["string", "string", "string"] }],
  ["isWellFormed", { operator: "IsWellFormed", parameters: [] }],
  ["toWellFormed", { operator: "ToWellFormed", parameters: [] }],
  ["normalize", { operator: "StringNormalize", parameters: ["string"] }],
  ["localeCompare", { operator: "LocaleCompare", parameters: ["string"] }],
  ["big", { operator: "CreateHTML", parameters: [], tag: "big" }],
  ["blink", { operator: "CreateHTML", parameters: [], tag: "blink" }],
  ["bold", { operator: "CreateHTML", parameters: [], tag: "b" }],
  ["fixed", { operator: "CreateHTML", parameters: [], tag: "tt" }],
  ["italics", { operator: "CreateHTML", parameters: [], tag: "i" }],
  ["small", { operator: "CreateHTML", parameters: [], tag: "small" }],
  ["strike", { operator: "CreateHTML", parameters: [], tag: "strike" }],
  ["sub", { operator: "CreateHTML", parameters: [], tag: "sub" }],
  ["sup", { operator: "CreateHTML", parameters: [], tag: "sup" }],
]);

// The methods that give a string itself, which only a string or a String object has, so that
// String.prototype.method.call doesn't convert another value.
const STRING_VALUE_METHODS = new Map<string, PrimitiveMethod>([
  ["toString", { operator: "PrimitiveOf", parameters: [] }],
  ["valueOf", { operator: "PrimitiveOf", parameters: [] }],
]);

const NUMBER_METHODS = new Map<string, PrimitiveMethod>([
  ["toString", { operator: "NumberToString", parameters: ["number"] }],
  ["valueOf", { operator: "PrimitiveOf", parameters: [] }],
]);

const BIGINT_METHODS = new Map<string, PrimitiveMethod>([
  ["toString", { operator: "BigIntToString", parameters: ["number"] }],
  ["valueOf", { operator: "PrimitiveOf", parameters: [] }],
]);

const BOOLEAN_METHODS = new Map<string, PrimitiveMethod>([
  ["toString", { operator: "BooleanToString", parameters: [] }],
  ["valueOf", { operator: "PrimitiveOf", parameters: [] }],
]);

// The prototypes whose methods a script may call on another value, with the operator that
// converts the value.
const PRIMITIVE_PROTOTYPES = new Map([
  ["String.prototype", { methods: STRING_METHODS, converter: "ThisString" }],
  ["Number.prototype", { methods: NUMBER_METHODS, converter: "ThisNumber" }],
  ["Boolean.prototype", { methods: BOOLEAN_METHODS, converter: "ThisBoolean" }],
  ["BigInt.prototype", { methods: BIGINT_METHODS, converter: "ThisBigInt" }],
]);

export const ARRAY_LIKE_METHODS = new Set([
  "at",
  "join",
  "slice",
  "with",
  "toReversed",
  "toSorted",
  "toSpliced",
  "every",
  "some",
  "filter",
  "map",
  "indexOf",
  "lastIndexOf",
  "includes",
  "find",
  "findIndex",
  "findLast",
  "findLastIndex",
  "reduce",
  "reduceRight",
]);

// The array methods that make an array through ArraySpeciesCreate, which reads the constructor of
// the array that they copy.
const SPECIES_METHODS = new Set(["concat", "filter", "flat", "flatMap", "map", "slice", "splice"]);

// The elements that an array method reads: a sequence's own, or an array-like object's through an
// operator of the JavaScript module. A method that makes an array checks the array's constructor,
// which for a sequence a script may change only through Array.prototype.
export const translateMethodElements = (
  method: string,
  owner: Expression,
  read: "ArrayLike" | "ArrayLikeValues" | "PresentElements" | undefined,
  node: ts.Node,
  scope: Scope,
  context: Context,
) => {
  if (!SPECIES_METHODS.has(method)) {
    return read === undefined
      ? owner
      : useJavaScript(read, [getHeap(scope, node, context), owner], context);
  }
  if (read !== undefined) {
    const heap = getHeap(scope, node, context);
    return useJavaScript(
      "SpeciesElements",
      [
        heap,
        owner,
        translateBuiltInValue("Array", node, context),
        useJavaScript(read, [heap, owner], context),
      ],
      context,
    );
  }
  return context.hasInheritedElements
    ? useJavaScript(
        "Species",
        [
          useJavaScript(
            "Get",
            [
              getHeap(scope, node, context),
              translateBuiltInValue("Array.prototype", node, context),
              string("constructor"),
            ],
            context,
          ),
          translateBuiltInValue("Array", node, context),
          owner,
        ],
        context,
      )
    : owner;
};

// The array methods that visit only the elements an array-like object has, skipping its holes.
export const HOLE_SKIPPING_METHODS = new Set([
  "every",
  "some",
  "filter",
  "forEach",
  "indexOf",
  "lastIndexOf",
  "reduce",
  "reduceRight",
]);

// The array methods that read each index below the length through Get, so that a hole reads as
// what a prototype holds there, or undefined.
export const EVERY_INDEX_METHODS = new Set([
  "at",
  "join",
  "with",
  "toReversed",
  "toSorted",
  "toSpliced",
  "includes",
  "find",
  "findIndex",
  "findLast",
  "findLastIndex",
]);

// Array.prototype.method.call(object, ...arguments) on an array-like object, or a method call on
// an array that the heap holds, which runs on the object's elements, or undefined for any other
// call.
export const getArrayLikeCall = (node: ts.CallExpression, context: Context) => {
  const callee = node.expression;
  if (!ts.isPropertyAccessExpression(callee)) return undefined;
  const target = callee.expression;
  const isCall =
    callee.name.text === "call" &&
    ts.isPropertyAccessExpression(target) &&
    target.expression.getText() === "Array.prototype";
  const method = isCall ? target.name.text : callee.name.text;
  const object = isCall ? node.arguments.at(0) : isHeapArray(target, context) ? target : undefined;
  return ARRAY_LIKE_METHODS.has(method) &&
    object !== undefined &&
    getKind(object, context) === "object"
    ? { method, object, methodArguments: isCall ? node.arguments.slice(1) : node.arguments }
    : undefined;
};

export const IN_PLACE_METHODS = new Set([
  "push",
  "pop",
  "shift",
  "unshift",
  "sort",
  "reverse",
  "copyWithin",
]);

// What a method that changes an array that the heap holds does: the heap after, the value that it
// gives, and whether it throws a TypeError.
export const translateArrayChange = (
  method: string,
  heap: Expression,
  ref: Expression,
  items: readonly ts.Expression[],
  scope: Scope,
  context: Context,
) => {
  const translateNumber = (argument: ts.Expression) =>
    isNumberLike(argument, context)
      ? translateExpression(argument, scope, context)
      : useJavaScript("ToNumber", [translateExpression(argument, scope, context)], context);
  const [first, second, third] = items;
  const reordered =
    method === "reverse"
      ? useJavaScript("ArrayReverse", [heap, ref], context)
      : method === "sort"
        ? useJavaScript(
            "ArraySort",
            [heap, ref, translateSortOrder(first, scope, context)],
            context,
          )
        : method === "copyWithin"
          ? useJavaScript(
              "ArrayCopyWithin",
              [
                heap,
                ref,
                first === undefined ? number(0) : translateNumber(first),
                second === undefined ? number(0) : translateNumber(second),
                third === undefined ||
                (context.checker.getTypeAtLocation(third).flags & ts.TypeFlags.Undefined) !== 0
                  ? getUndefined(context)
                  : translateNumber(third),
              ],
              context,
            )
          : undefined;
  return reordered === undefined
    ? useJavaScript(
        "ArrayChange",
        [heap, ref, string(method), translateElements(items, scope, context)],
        context,
      )
    : record("Record", [
        { name: "heap", value: reordered },
        { name: "value", value: ref },
        { name: "isThrown", value: boolean(false) },
      ]);
};

// A splice whose result nothing reads, as tla-ts doesn't make the array of what it removes.
export const isSpliceStatement = (node: ts.CallExpression, context: Context) =>
  ts.isPropertyAccessExpression(node.expression) &&
  node.expression.name.text === "splice" &&
  ts.isExpressionStatement(node.parent) &&
  node.arguments.length > 0 &&
  node.arguments.slice(0, 2).every((argument) => isNumberLike(argument, context));

// A call of a method that changes an array that the heap holds in place.
export const getHeapArrayChange = (node: ts.Node, context: Context) =>
  ts.isCallExpression(node) &&
  ts.isPropertyAccessExpression(node.expression) &&
  (IN_PLACE_METHODS.has(node.expression.name.text) || isSpliceStatement(node, context)) &&
  isHeapArray(node.expression.expression, context) &&
  (["push", "unshift"].includes(node.expression.name.text) ||
    !node.arguments.some(ts.isSpreadElement))
    ? {
        method: node.expression.name.text,
        receiver: node.expression.expression,
        items: node.arguments,
        isOptional: node.expression.questionDotToken !== undefined,
      }
    : undefined;

// The elements that the iterator of an array that the heap holds gives, as for-of and spread read
// them, where Array.prototype still holds the built-in iterator.
export const translateHeapElements = (node: ts.Expression, scope: Scope, context: Context) =>
  share(translateExpression(node, scope, context), "array", context, (array) =>
    getHeapElements(getHeap(scope, node, context), array, node, context),
  );

// The elements that the iterator of an array that the heap holds visits.
export const getHeapElements = (
  heap: Expression,
  array: Expression,
  node: ts.Node,
  context: Context,
) =>
  translateArrayIteration(
    useJavaScript("ArrayLikeValues", [heap, array], context),
    heap,
    node,
    context,
    array,
  );

// What an array's iteration gives, where the receiver still holds the built-in iterator and array
// iterators the built-in next. A sequence reads its iterator from Array.prototype.
export const translateArrayIteration = (
  value: Expression,
  heap: Expression,
  node: ts.Node,
  context: Context,
  receiver = translateBuiltInValue("Array.prototype", node, context),
) =>
  ifExpression(
    junction("And", [
      useJavaScript(
        "HoldsBuiltIn",
        [
          heap,
          receiver,
          useJavaScript("WellKnownSymbol", [string("iterator")], context),
          string("Array.prototype.values"),
        ],
        context,
      ),
      holdsArrayIteratorNext(heap, node, context),
    ]),
    value,
    apply("Assert", [
      boolean(false),
      string("tla-ts can't iterate an array whose iterator a script replaced"),
    ]),
  );

const holdsArrayIteratorNext = (heap: Expression, node: ts.Node, context: Context) =>
  useJavaScript(
    "HoldsBuiltIn",
    [
      heap,
      translateArrayIteratorPrototype(node, context),
      string("next"),
      string("%ArrayIteratorPrototype%.next"),
    ],
    context,
  );

export const translateArrayLikeCall = (node: ts.CallExpression, scope: Scope, context: Context) => {
  const call = getArrayLikeCall(node, context);
  if (call === undefined) return undefined;
  const method = call.method;
  const object = call.object;
  const methodArguments = call.methodArguments;
  const operate = (owner: Expression, sequence: Expression, indices?: Expression) =>
    translateSequenceOperation(
      { node, method, arguments: methodArguments, elementType: undefined, owner, indices },
      sequence,
      scope,
      context,
      false,
    );
  // A search from an index counts from the length, which the present elements don't have.
  const isSkippingHoles =
    HOLE_SKIPPING_METHODS.has(method) && (!method.endsWith("ndexOf") || methodArguments.length < 2);
  return share(translateExpression(object, scope, context), "object", context, (owner) =>
    isSkippingHoles
      ? share(
          translateMethodElements(method, owner, "PresentElements", node, scope, context),
          "present",
          context,
          (present) => operate(owner, field(present, "values"), field(present, "indices")),
        )
      : share(
          translateMethodElements(
            method,
            owner,
            EVERY_INDEX_METHODS.has(method) ? "ArrayLikeValues" : "ArrayLike",
            node,
            scope,
            context,
          ),
          "sequence",
          context,
          (sequence) => operate(owner, sequence),
        ),
  );
};

// The kinds of the keys that a new Set or Map holds, which TLC compares, so that they must agree:
// TLC stops where it compares a number with a string. Model values, such as undefined, null, and
// symbols, compare with any value. Where the Set or Map's type doesn't tell, this reads the keys
// that the script gives the variable that holds it.
const getKeyKinds = (node: ts.NewExpression, context: Context) => {
  const checker = context.checker;
  const getKinds = (type: ts.Type) => {
    const names = getTypeNames(type, checker);
    return (
      names &&
      names
        .filter((name) => !["undefined", "null", "symbol"].includes(name))
        .map((name) => (name === "function" ? "object" : name))
    );
  };
  const type = checker.getTypeAtLocation(node);
  const keyType = isTypeReference(type) ? checker.getTypeArguments(type).at(0) : undefined;
  const declared = keyType && getKinds(keyType);
  if (declared !== undefined) return new Set(declared);
  const holder = node.parent;
  const name = ts.isVariableDeclaration(holder)
    ? holder.name
    : ts.isBinaryExpression(holder) && holder.operatorToken.kind === ts.SyntaxKind.EqualsToken
      ? holder.left
      : undefined;
  const symbol = name && ts.isIdentifier(name) ? getSymbol(name, checker) : undefined;
  const isEntries = node.expression.getText() === "Map";
  const given = node.arguments?.at(0);
  const initial =
    given === undefined
      ? []
      : ts.isArrayLiteralExpression(given)
        ? given.elements.map((element) =>
            isEntries && ts.isArrayLiteralExpression(element) ? element.elements.at(0) : element,
          )
        : [undefined];
  const getUses = (current: ts.Node): (ts.Expression | undefined)[] => {
    const access = current.parent;
    const call = access?.parent;
    const isKeyCall =
      ts.isIdentifier(current) &&
      getSymbol(current, checker) === symbol &&
      ts.isPropertyAccessExpression(access) &&
      access.expression === current &&
      KEY_METHODS.has(access.name.text) &&
      ts.isCallExpression(call) &&
      call.expression === access;
    const nested: (ts.Expression | undefined)[] = [];
    ts.forEachChild(current, (child) => {
      nested.push(...getUses(child));
    });
    return isKeyCall && ts.isCallExpression(call) ? [call.arguments.at(0), ...nested] : nested;
  };
  // A Set or Map that no variable holds has only the keys it starts with.
  const keys = [...initial, ...(symbol === undefined ? [] : getUses(node.getSourceFile()))];
  const kinds = keys.map((key) =>
    key === undefined || ts.isSpreadElement(key)
      ? undefined
      : getKinds(checker.getTypeAtLocation(key)),
  );
  return kinds.every((kind) => kind !== undefined) ? new Set(kinds.flat()) : undefined;
};

// The methods of a Set or a Map that take a key.
const KEY_METHODS = new Set(["add", "has", "delete", "set", "get"]);

export const translateNew = (node: ts.NewExpression, scope: Scope, context: Context) => {
  const constructor = node.expression.getText();
  const argument = node.arguments?.[0];
  // new Array(length) makes an array of holes, which a sequence can't hold, and new Array with
  // any other arguments makes an array of them.
  if (constructor === "Array" && node.arguments?.some(ts.isSpreadElement) !== true) {
    const elements = (node.arguments ?? []).map((element) =>
      translateExpression(element, scope, context),
    );
    if (argument === undefined || elements.length > 1 || !isNumberLike(argument, context)) {
      return tuple(elements);
    }
    return ifExpression(
      apply("=", [elements[0], number(0)]),
      tuple([]),
      apply("Assert", [boolean(false), string("TLA+ sequences can't have holes")]),
    );
  }
  const kind = constructor === "WeakSet" ? "Set" : constructor === "WeakMap" ? "Map" : constructor;
  const made = translateNewCollection(node, kind, scope, context);
  if (kind === constructor || argument === undefined) return made;
  // A weak collection throws a TypeError on a key that Symbol.for registered, which tla-ts can't
  // throw where the collection is made.
  const key = context.names.getFresh("key");
  return share(made, "made", context, (shared) =>
    ifExpression(
      quantify(
        "Exists",
        [bound(key, kind === "Set" ? shared : getDomain(shared))],
        useJavaScript(
          "IsRegisteredSymbol",
          [getHeap(scope, node, context), identifier(key)],
          context,
        ),
      ),
      apply("Assert", [
        boolean(false),
        string(`tla-ts can't throw the TypeError of a new ${constructor} with a registered symbol`),
      ]),
      shared,
    ),
  );
};

// The set or the map that new Set or new Map makes, or a weak one, which holds its keys alike.
const translateNewCollection = (
  node: ts.NewExpression,
  kind: string,
  scope: Scope,
  context: Context,
) => {
  const constructor = node.expression.getText();
  const argument = node.arguments?.[0];
  if (constructor === "Set" || constructor === "Map") {
    const kinds = getKeyKinds(node, context);
    if (kinds === undefined || kinds.size > 1) {
      throw new TlaTypeScriptError(
        `Give a ${constructor} keys of one kind, as TLC can't compare a number with a string`,
        node,
      );
    }
  }
  if (kind === "Set") {
    if (argument === undefined) return set([]);
    if (ts.isArrayLiteralExpression(argument) && !argument.elements.some(ts.isSpreadElement)) {
      return set(argument.elements.map((element) => translateSetKey(element, scope, context)));
    }
    return translateSet(argument, scope, context);
  }
  if (kind !== "Map") {
    return translateUnknown(node, `Unsupported constructor: new ${constructor}`, context);
  }
  if (argument === undefined) return tuple([]);
  if (ts.isArrayLiteralExpression(argument)) {
    if (argument.elements.length === 0) return tuple([]);
    return argument.elements
      .toReversed()
      .map((entry) => {
        if (!ts.isArrayLiteralExpression(entry) || entry.elements.length !== 2) {
          throw new TlaTypeScriptError("Write each Map entry as [key, value]", entry);
        }
        return apply(":>", [
          translateSetKey(entry.elements[0], scope, context),
          translateExpression(entry.elements[1], scope, context),
        ]);
      })
      .reduce((left, right) => apply("@@", [left, right]));
  }
  if (getKind(argument, context) === "map") return translateExpression(argument, scope, context);
  const map = translateFunctionConstructor(argument, scope, context);
  if (map === undefined)
    throw new TlaTypeScriptError(`Unsupported constructor: new ${constructor}`, node);
  return map;
};
