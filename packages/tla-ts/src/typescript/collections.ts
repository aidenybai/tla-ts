import ts from "@typescript/typescript6";
import {
  type Context,
  getCallee,
  getSymbol,
  getUndefined,
  isMethodCall,
  type MethodCall,
  share,
} from "./context";
import type { Expression } from "../ast";
import { TlaTypeScriptError } from "../errors";
import { translateExpression } from "./expressions";
import { translateBody } from "./functions";
import { bindNames, bindPatternInline, type Scope } from "./scope";
import {
  apply,
  bound,
  choose,
  except,
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
  set,
  tuple,
} from "./tla";
import { getKind, isBooleanType, type Kind, translateUnknown } from "./types";

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

const getCallback = (callback: ts.Expression, context: Context) => {
  const callee = getCallee(callback, context);
  if (callee?.body === undefined) throw new TlaTypeScriptError("Pass a function here", callback);
  return { parameters: callee.parameters, body: callee.body };
};

const translateCallback = (callback: ts.Expression, scope: Scope, context: Context) =>
  translateBody(getCallback(callback, context).body, scope, context);

// A callback that filter(), every(), some(), and find() test elements with. JavaScript tests what it
// returns for truthiness, which only a boolean has in TLA+.
const translateTest = (callback: ts.Expression, scope: Scope, context: Context) => {
  const callee = getCallee(callback, context);
  const signature = callee && context.checker.getSignatureFromDeclaration(callee);
  if (signature === undefined || !isBooleanType(signature.getReturnType())) {
    throw new TlaTypeScriptError("Return a boolean from this test", callback);
  }
  return translateCallback(callback, scope, context);
};

const rejectIndex = (callback: ts.Expression, message: string, context: Context) => {
  if (getCallback(callback, context).parameters[1] !== undefined) {
    throw new TlaTypeScriptError(message, callback);
  }
};

// Binds a callback's element parameter to a fresh variable, which a quantifier then binds.
const bindElement = (callback: ts.Expression, scope: Scope, context: Context): Element => {
  const parameter = getCallback(callback, context).parameters[0];
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

// Binds a callback's (element, index) parameters for the TLA+ index of a sequence, which counts
// from 1 where JavaScript counts from 0.
const bindIndexed = (
  callback: ts.Expression,
  element: Expression | undefined,
  position: Expression,
  scope: Scope,
  context: Context,
) => {
  const parameters = getCallback(callback, context).parameters;
  const withElement =
    element === undefined || parameters[0] === undefined
      ? scope
      : bindPatternInline(parameters[0].name, element, scope, context);
  return parameters[1] === undefined
    ? withElement
    : bindPatternInline(
        parameters[1].name,
        apply("-", [position, number(1)]),
        withElement,
        context,
      );
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
    const record = translate(node.arguments[0]);
    if (method === "keys") return { set: getDomain(record), isMapped: false };
    if (method === "values") return getValues(record, context);
    if (method === "entries") return getEntries(record, context);
    return undefined;
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
  rejectIndex(callback, "Elements of a set have no index", context);
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
  const parameter = getCallback(callback, context).parameters[0];
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
  const getIndices = (length: ts.Expression) =>
    apply("..", [number(1), translateExpression(length, scope, context)]);
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
      [bound(position, getIndices(length.initializer))],
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
    [bound(position, getIndices(length))],
    translateExpression(node.arguments[0], scope, context),
  );
};

// The first index in a sequence whose element passes a test, or undefined if none does.
const getEarlier = (earlier: string, position: string) =>
  bound(earlier, apply("..", [number(1), apply("-", [identifier(position), number(1)])]));

const translateFirstIndex = (
  sequence: Expression,
  callback: ts.Expression,
  scope: Scope,
  context: Context,
) => {
  const getTest = (position: string) =>
    translateTest(
      callback,
      bindIndexed(
        callback,
        index(sequence, [identifier(position)]),
        identifier(position),
        scope,
        context,
      ),
      context,
    );
  const position = context.names.getFresh("index");
  const earlier = context.names.getFresh("earlier");
  return {
    exists: quantify("Exists", [bound(position, getDomain(sequence))], getTest(position)),
    first: choose(
      position,
      getDomain(sequence),
      junction("And", [
        getTest(position),
        quantify("Forall", [getEarlier(earlier, position)], not(getTest(earlier))),
      ]),
    ),
  };
};

const translateSequenceOperation = (
  node: MethodCall,
  sequence: Expression,
  scope: Scope,
  context: Context,
  isDefined: boolean,
) => {
  const method = node.expression.name.text;
  const translate = (inner: ts.Expression) => translateExpression(inner, scope, context);
  const argument = node.arguments[0];
  const getLength = () => apply("Len", [sequence]);
  const isNegative = (inner: ts.Expression): inner is ts.PrefixUnaryExpression =>
    ts.isPrefixUnaryExpression(inner) && inner.operator === ts.SyntaxKind.MinusToken;
  // An index that may count back from the end, as slice() and at() take it.
  const getOffset = (inner: ts.Expression) =>
    isNegative(inner) ? apply("-", [getLength(), translate(inner.operand)]) : translate(inner);
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
      const inner = bindIndexed(
        argument,
        index(sequence, [identifier(position)]),
        identifier(position),
        scope,
        context,
      );
      return format(
        [bound(position, getDomain(sequence))],
        translateElement(argument, inner, context),
      );
    };
  // Whether the element at a position is the one that includes() or indexOf() looks for, from the
  // fromIndex that counts back from the end when it's negative.
  const withSearch = (use: (isFound: (position: Expression) => Expression) => Expression) =>
    share(translate(argument), "value", context, (value) => {
      const getEqual = (position: Expression) => apply("=", [index(sequence, [position]), value]);
      const from = node.arguments[1];
      if (
        from === undefined ||
        context.checker.getTypeAtLocation(from).flags & ts.TypeFlags.Undefined
      ) {
        return use(getEqual);
      }
      const start = ts.isNumericLiteral(from)
        ? translate(from)
        : share(translate(from), "from", context, (shared) =>
            ifExpression(
              apply("<", [shared, number(0)]),
              apply("+", [getLength(), shared]),
              shared,
            ),
          );
      return share(start, "start", context, (shared) =>
        use((position) => junction("And", [apply(">", [position, shared]), getEqual(position)])),
      );
    });
  const operations = new Map<string, () => Expression>([
    [
      "at",
      () => {
        const position = apply("+", [getOffset(argument), number(1)]);
        return orUndefined(
          apply("\\in", [position, getDomain(sequence)]),
          index(sequence, [position]),
        );
      },
    ],
    [
      "includes",
      () =>
        withSearch((isFound) => {
          const position = context.names.getFresh("index");
          return quantify(
            "Exists",
            [bound(position, getDomain(sequence))],
            isFound(identifier(position)),
          );
        }),
    ],
    [
      "indexOf",
      () =>
        withSearch((isFound) => {
          const position = context.names.getFresh("index");
          const earlier = context.names.getFresh("earlier");
          return ifExpression(
            quantify(
              "Exists",
              [bound(position, getDomain(sequence))],
              isFound(identifier(position)),
            ),
            apply("-", [
              choose(
                position,
                getDomain(sequence),
                junction("And", [
                  isFound(identifier(position)),
                  quantify(
                    "Forall",
                    [getEarlier(earlier, position)],
                    not(isFound(identifier(earlier))),
                  ),
                ]),
              ),
              number(1),
            ]),
            number(-1),
          );
        }),
    ],
    [
      "slice",
      () => {
        const start = argument === undefined ? number(0) : getOffset(argument);
        const end = node.arguments[1] === undefined ? undefined : getOffset(node.arguments[1]);
        const last =
          end === undefined
            ? getLength()
            : share(end, "end", context, (shared) =>
                ifExpression(apply("<", [shared, getLength()]), shared, getLength()),
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
          ...node.arguments.map((inner) =>
            getKind(inner, context) === "sequence" ? translate(inner) : tuple([translate(inner)]),
          ),
        ].reduce((left, right) => apply("\\o", [left, right])),
    ],
    [
      "with",
      () =>
        except(sequence, [
          {
            path: [{ kind: "Index", args: [apply("+", [translate(argument), number(1)])] }],
            value: translate(node.arguments[1]),
          },
        ]),
    ],
    [
      "toReversed",
      () => {
        const position = context.names.getFresh("index");
        return functionOf(
          [bound(position, getDomain(sequence))],
          index(sequence, [
            apply("+", [apply("-", [getLength(), identifier(position)]), number(1)]),
          ]),
        );
      },
    ],
    ["map", translateEach((bounds, body) => functionOf(bounds, body))],
    ["every", translateEach((bounds, body) => quantify("Forall", bounds, body), translateTest)],
    ["some", translateEach((bounds, body) => quantify("Exists", bounds, body), translateTest)],
    [
      "filter",
      () => {
        rejectIndex(argument, "filter() can't take an index", context);
        const element = bindElement(argument, scope, context);
        return apply("SelectSeq", [
          sequence,
          lambda([element.variable], translateTest(argument, element.scope, context)),
        ]);
      },
    ],
    [
      "find",
      () => {
        const result = translateFirstIndex(sequence, argument, scope, context);
        return orUndefined(result.exists, index(sequence, [result.first]));
      },
    ],
    [
      "findIndex",
      () => {
        const result = translateFirstIndex(sequence, argument, scope, context);
        return ifExpression(result.exists, apply("-", [result.first, number(1)]), number(-1));
      },
    ],
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
    return apply("\\in", [translateExpression(argument, scope, context), source.set]);
  }
  if (method !== "every" && method !== "some" && method !== "find") {
    throw new TlaTypeScriptError(`Unsupported method on a set's elements: ${method}`, node);
  }
  rejectIndex(argument, "Elements of a set have no index", context);
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
  const other = translateExpression(argument, scope, context);
  // A Map is like a set of its keys.
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
  const key = translateExpression(node.arguments[0], scope, context);
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

export const removeLast = (current: Expression) =>
  apply("SubSeq", [current, number(1), apply("-", [apply("Len", [current]), number(1)])]);

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
      ["shift", (current) => apply("Tail", [current])],
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

export const MUTATING_METHODS = new Set(
  [...UPDATES.values()].flatMap((updates) => [...updates.keys()]),
);

// The value of a collection after a mutating method call, or undefined if the method doesn't
// mutate.
export const getUpdatedValue = (
  current: Expression,
  kind: Kind,
  node: MethodCall,
  scope: Scope,
  context: Context,
) => {
  const values = node.arguments.map((argument) => translateExpression(argument, scope, context));
  return UPDATES.get(kind)?.get(node.expression.name.text)?.(current, values, context);
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
  if (kind === "sequence") {
    const method = node.expression.name.text;
    const sequence = translateExpression(receiver, scope, context);
    const translateWith = (shared: Expression) =>
      translateSequenceOperation(node, shared, scope, context, isDefined);
    return SINGLE_USE_METHODS.has(method)
      ? translateWith(sequence)
      : share(sequence, "sequence", context, translateWith);
  }
  if (kind === "set") return translateSetMethod(node, scope, context);
  if (kind === "map") return translateMapMethod(node, scope, context, isDefined);
  return translateUnknown(node, `Unsupported call: ${node.expression.getText()}`, context);
};

export const translateNew = (node: ts.NewExpression, scope: Scope, context: Context) => {
  const constructor = node.expression.getText();
  const argument = node.arguments?.[0];
  if (constructor === "Set") {
    if (argument === undefined) return set([]);
    if (ts.isArrayLiteralExpression(argument) && !argument.elements.some(ts.isSpreadElement)) {
      return set(argument.elements.map((element) => translateExpression(element, scope, context)));
    }
    return translateSet(argument, scope, context);
  }
  if (constructor !== "Map") {
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
          translateExpression(entry.elements[0], scope, context),
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
