import ts from "typescript";
import { type Context, getCallee, getSymbol } from "./context";
import { TsproverError } from "./errors";
import { translateExpression } from "./expressions";
import { wrap, wrapEquated } from "./formula";
import { translateBody } from "./functions";
import { bindNames, bindPatternInline, type Scope } from "./scope";
import { getKind, type Kind } from "./types";

interface Unordered {
  set: string;
  // Whether map() built the set, so that it may have fewer elements than the array would.
  isMapped: boolean;
}

interface Element {
  variable: string;
  scope: Scope;
}

const getCallback = (callback: ts.Expression, context: Context) => {
  const callee = getCallee(callback, context);
  if (callee?.body === undefined) throw new TsproverError("Pass a function here", callback);
  return { parameters: callee.parameters, body: callee.body };
};

const translateCallback = (callback: ts.Expression, scope: Scope, context: Context) =>
  translateBody(getCallback(callback, context).body, scope, context);

const rejectIndex = (callback: ts.Expression, message: string, context: Context) => {
  if (getCallback(callback, context).parameters[1] !== undefined) {
    throw new TsproverError(message, callback);
  }
};

// Binds a callback's element parameter to a fresh variable, which a quantifier then binds.
const bindElement = (callback: ts.Expression, scope: Scope, context: Context): Element => {
  const parameter = getCallback(callback, context).parameters[0];
  if (parameter === undefined) return { variable: context.names.getFresh("element"), scope };
  if (!ts.isIdentifier(parameter.name)) {
    const variable = context.names.getFresh("element");
    return { variable, scope: bindPatternInline(parameter.name, variable, scope, context) };
  }
  const variable = context.names.getFresh(parameter.name.text);
  const symbol = getSymbol(parameter.name, context.checker);
  return { variable, scope: bindNames(scope, [{ name: variable, symbol }]) };
};

// Binds a callback's (element, index) parameters for the TLA+ index of a sequence, which counts
// from 1 where JavaScript counts from 0.
const bindIndexed = (
  callback: ts.Expression,
  element: string | undefined,
  index: string,
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
    : bindPatternInline(parameters[1].name, `(${index} - 1)`, withElement, context);
};

const getValues = (value: string, context: Context): Unordered => {
  const key = context.names.getFresh("key");
  return { set: `{${wrap(value)}[${key}] : ${key} \\in DOMAIN ${wrap(value)}}`, isMapped: true };
};

const getEntries = (value: string, context: Context): Unordered => {
  const key = context.names.getFresh("key");
  return {
    set: `{<<${key}, ${wrap(value)}[${key}]>> : ${key} \\in DOMAIN ${wrap(value)}}`,
    isMapped: false,
  };
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
  if (!ts.isCallExpression(node) || !ts.isPropertyAccessExpression(node.expression)) {
    return undefined;
  }
  const receiver = node.expression.expression;
  const method = node.expression.name.text;
  if (ts.isIdentifier(receiver) && receiver.text === "Object") {
    const record = translate(node.arguments[0]);
    if (method === "keys") return { set: `DOMAIN ${wrap(record)}`, isMapped: false };
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
      set: `{<<${element}, ${element}>> : ${element} \\in ${wrap(translate(receiver))}}`,
      isMapped: false,
    };
  }
  if (kind === "map" && method === "keys") {
    return { set: `DOMAIN ${wrap(translate(receiver))}`, isMapped: false };
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
  const body = translateCallback(callback, element.scope, context);
  return method === "filter"
    ? { set: `{${element.variable} \\in ${wrap(source.set)} : ${body}}`, isMapped: source.isMapped }
    : { set: `{${body} : ${element.variable} \\in ${wrap(source.set)}}`, isMapped: true };
};

// The elements of a set, an array, or an iterator over a collection, as a TLA+ set.
export const translateSet = (node: ts.Expression, scope: Scope, context: Context) => {
  const unordered = translateUnordered(node, scope, context);
  if (unordered !== undefined) return unordered.set;
  const kind = getKind(node, context);
  const value = translateExpression(node, scope, context);
  if (kind === "set") return value;
  if (kind !== "sequence") throw new TsproverError("Expected a Set or an array", node);
  const index = context.names.getFresh("index");
  return `{${wrap(value)}[${index}] : ${index} \\in DOMAIN ${wrap(value)}}`;
};

// The number of elements in a collection, or undefined if the receiver isn't one.
export const translateSize = (node: ts.Expression, scope: Scope, context: Context) => {
  const unordered = translateUnordered(node, scope, context);
  if (unordered?.isMapped) {
    throw new TsproverError("map() can merge equal elements, so count before mapping", node.parent);
  }
  if (unordered !== undefined) return `Cardinality(${unordered.set})`;
  const kind = getKind(node, context);
  const value = translateExpression(node, scope, context);
  if (kind === "sequence" || kind === "string") return `Len(${value})`;
  if (kind === "set") return `Cardinality(${value})`;
  if (kind === "map") return `Cardinality(DOMAIN ${wrap(value)})`;
  return undefined;
};

// [x \in S |-> e] from source.map((x) => [x, e]), as new Map() and Object.fromEntries() take it.
export const translateFunctionConstructor = (
  node: ts.Expression,
  scope: Scope,
  context: Context,
) => {
  if (
    !ts.isCallExpression(node) ||
    !ts.isPropertyAccessExpression(node.expression) ||
    node.expression.name.text !== "map"
  ) {
    return undefined;
  }
  const receiver = node.expression.expression;
  const source =
    translateUnordered(receiver, scope, context)?.set ??
    (getKind(receiver, context) === "sequence"
      ? `{${wrap(translateExpression(receiver, scope, context))}[index] : index \\in DOMAIN ${wrap(translateExpression(receiver, scope, context))}}`
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
    throw new TsproverError(
      "Build a Map or record from a set with set.values().map((key) => [key, value])",
      node,
    );
  }
  const element = bindElement(callback, scope, context);
  const value = translateExpression(pair.elements[1], element.scope, context);
  return `[${element.variable} \\in ${source} |-> ${value}]`;
};

// A sequence from Array.from({ length: n }, callback) or new Array(n).fill(value).
export const translateArrayConstructor = (
  node: ts.CallExpression,
  receiver: ts.Expression,
  method: string,
  scope: Scope,
  context: Context,
) => {
  const translateLength = (length: ts.Expression) =>
    wrap(translateExpression(length, scope, context));
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
      throw new TsproverError("Array.from needs { length: n }", node);
    }
    const index = context.names.getFresh("index");
    const inner = bindIndexed(callback, undefined, index, scope, context);
    return `[${index} \\in 1..${translateLength(length.initializer)} |-> ${translateCallback(callback, inner, context)}]`;
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
  const index = context.names.getFresh("index");
  return `[${index} \\in 1..${translateLength(length)} |-> ${translateExpression(node.arguments[0], scope, context)}]`;
};

// The first index in a sequence whose element passes a test, or undefined if none does.
const translateFirstIndex = (
  sequence: string,
  callback: ts.Expression,
  scope: Scope,
  context: Context,
) => {
  const getTest = (index: string) =>
    translateCallback(
      callback,
      bindIndexed(callback, `${wrap(sequence)}[${index}]`, index, scope, context),
      context,
    );
  const index = context.names.getFresh("index");
  const earlier = context.names.getFresh("earlier");
  return {
    exists: `\\E ${index} \\in DOMAIN ${wrap(sequence)} : ${getTest(index)}`,
    first: `CHOOSE ${index} \\in DOMAIN ${wrap(sequence)} : ${wrap(getTest(index))} /\\ \\A ${earlier} \\in 1..(${index} - 1) : ~${wrap(getTest(earlier))}`,
  };
};

const translateSequenceMethod = (
  node: ts.CallExpression,
  receiver: ts.Expression,
  method: string,
  scope: Scope,
  context: Context,
  isDefined: boolean,
) => {
  const translate = (inner: ts.Expression) => translateExpression(inner, scope, context);
  const sequence = translate(receiver);
  const argument = node.arguments[0];
  const isNegative = (inner: ts.Expression): inner is ts.PrefixUnaryExpression =>
    ts.isPrefixUnaryExpression(inner) && inner.operator === ts.SyntaxKind.MinusToken;
  // An index that may count back from the end, as slice() and at() take it.
  const getOffset = (inner: ts.Expression) =>
    isNegative(inner) ? `Len(${sequence}) - ${wrap(translate(inner.operand))}` : translate(inner);
  const orUndefined = (exists: string, value: string) => {
    if (isDefined) return value;
    context.prelude.add("Undefined");
    return `IF ${exists} THEN ${value} ELSE Undefined`;
  };
  if (method === "at") {
    const index = isNegative(argument)
      ? `${getOffset(argument)} + 1`
      : `${wrap(translate(argument))} + 1`;
    return orUndefined(`${index} \\in DOMAIN ${wrap(sequence)}`, `${wrap(sequence)}[${index}]`);
  }
  if (method === "includes" || method === "indexOf") {
    const value = translate(argument);
    const index = context.names.getFresh("index");
    const isFound = `${wrap(sequence)}[${index}] = ${wrap(value)}`;
    if (method === "includes") return `\\E ${index} \\in DOMAIN ${wrap(sequence)} : ${isFound}`;
    const earlier = context.names.getFresh("earlier");
    return `IF \\E ${index} \\in DOMAIN ${wrap(sequence)} : ${isFound} THEN (CHOOSE ${index} \\in DOMAIN ${wrap(sequence)} : ${isFound} /\\ \\A ${earlier} \\in 1..(${index} - 1) : ${wrap(sequence)}[${earlier}] # ${wrap(value)}) - 1 ELSE -1`;
  }
  if (method === "slice") {
    const start = argument === undefined ? "0" : getOffset(argument);
    const end = node.arguments[1] === undefined ? undefined : wrap(getOffset(node.arguments[1]));
    const last =
      end === undefined
        ? `Len(${sequence})`
        : `IF ${end} < Len(${sequence}) THEN ${end} ELSE Len(${sequence})`;
    const first = /^\d+$/.test(start) ? String(Number(start) + 1) : `${wrap(start)} + 1`;
    return `SubSeq(${sequence}, ${first}, ${last})`;
  }
  if (method === "concat") {
    return [
      sequence,
      ...node.arguments.map((inner) =>
        getKind(inner, context) === "sequence" ? translate(inner) : `<<${translate(inner)}>>`,
      ),
    ]
      .map(wrap)
      .join(" \\o ");
  }
  if (method === "with") {
    return `[${wrap(sequence)} EXCEPT ![${wrap(translate(argument))} + 1] = ${wrapEquated(translate(node.arguments[1]))}]`;
  }
  if (method === "toReversed") {
    const index = context.names.getFresh("index");
    return `[${index} \\in DOMAIN ${wrap(sequence)} |-> ${wrap(sequence)}[Len(${sequence}) - ${index} + 1]]`;
  }
  if (method === "map" || method === "every" || method === "some") {
    const index = context.names.getFresh("index");
    const inner = bindIndexed(argument, `${wrap(sequence)}[${index}]`, index, scope, context);
    const body = translateCallback(argument, inner, context);
    if (method === "map") return `[${index} \\in DOMAIN ${wrap(sequence)} |-> ${body}]`;
    return `${method === "every" ? "\\A" : "\\E"} ${index} \\in DOMAIN ${wrap(sequence)} : ${body}`;
  }
  if (method === "filter") {
    rejectIndex(argument, "filter() can't take an index", context);
    const element = bindElement(argument, scope, context);
    return `SelectSeq(${sequence}, LAMBDA ${element.variable} : ${translateCallback(argument, element.scope, context)})`;
  }
  if (method === "find" || method === "findIndex") {
    const result = translateFirstIndex(sequence, argument, scope, context);
    if (method === "findIndex") return `IF ${result.exists} THEN (${result.first}) - 1 ELSE -1`;
    return orUndefined(result.exists, `${wrap(sequence)}[${result.first}]`);
  }
  throw new TsproverError(`Unsupported array method: ${method}`, node);
};

const translateUnorderedMethod = (
  node: ts.CallExpression,
  source: Unordered,
  method: string,
  scope: Scope,
  context: Context,
  isDefined: boolean,
) => {
  const argument = node.arguments[0];
  if (method === "includes" || method === "has") {
    return `${wrap(translateExpression(argument, scope, context))} \\in ${wrap(source.set)}`;
  }
  if (method !== "every" && method !== "some" && method !== "find") {
    throw new TsproverError(`Unsupported method on a set's elements: ${method}`, node);
  }
  rejectIndex(argument, "Elements of a set have no index", context);
  const element = bindElement(argument, scope, context);
  const body = translateCallback(argument, element.scope, context);
  const binding = `${element.variable} \\in ${wrap(source.set)} : ${body}`;
  if (method === "every") return `\\A ${binding}`;
  if (method === "some") return `\\E ${binding}`;
  if (isDefined) return `CHOOSE ${binding}`;
  context.prelude.add("Undefined");
  return `IF \\E ${binding} THEN CHOOSE ${binding} ELSE Undefined`;
};

const translateSetMethod = (
  node: ts.CallExpression,
  receiver: ts.Expression,
  method: string,
  scope: Scope,
  context: Context,
) => {
  const set = wrap(translateExpression(receiver, scope, context));
  const other =
    node.arguments[0] === undefined
      ? ""
      : wrap(translateExpression(node.arguments[0], scope, context));
  const operations = new Map([
    ["has", `${other} \\in ${set}`],
    ["union", `${set} \\cup ${other}`],
    ["intersection", `${set} \\cap ${other}`],
    ["difference", `${set} \\ ${other}`],
    ["symmetricDifference", `(${set} \\ ${other}) \\cup (${other} \\ ${set})`],
    ["isSubsetOf", `${set} \\subseteq ${other}`],
    ["isSupersetOf", `${other} \\subseteq ${set}`],
    ["isDisjointFrom", `${set} \\cap ${other} = {}`],
  ]);
  const operation = operations.get(method);
  if (operation === undefined) throw new TsproverError(`Unsupported Set method: ${method}`, node);
  return operation;
};

const translateMapMethod = (
  node: ts.CallExpression,
  receiver: ts.Expression,
  method: string,
  scope: Scope,
  context: Context,
  isDefined: boolean,
) => {
  const map = wrap(translateExpression(receiver, scope, context));
  const key =
    node.arguments[0] === undefined
      ? ""
      : wrap(translateExpression(node.arguments[0], scope, context));
  if (method === "has") return `${key} \\in DOMAIN ${map}`;
  if (method !== "get") throw new TsproverError(`Unsupported Map method: ${method}`, node);
  if (isDefined) return `${map}[${key}]`;
  context.prelude.add("Undefined");
  return `IF ${key} \\in DOMAIN ${map} THEN ${map}[${key}] ELSE Undefined`;
};

// The value of a collection after a mutating method call, or undefined if the method doesn't
// mutate.
export const getUpdatedValue = (
  current: string,
  kind: Kind,
  method: string,
  node: ts.CallExpression,
  scope: Scope,
  context: Context,
) => {
  const values = node.arguments.map((argument) => translateExpression(argument, scope, context));
  const value = wrap(current);
  if (kind === "sequence" && method === "push") {
    return values.length === 1
      ? `Append(${current}, ${values[0]})`
      : `${value} \\o <<${values.join(", ")}>>`;
  }
  if (kind === "sequence" && method === "unshift") return `<<${values.join(", ")}>> \\o ${value}`;
  if (kind === "sequence" && method === "pop") return `SubSeq(${current}, 1, Len(${current}) - 1)`;
  if (kind === "sequence" && method === "shift") return `Tail(${current})`;
  if (kind === "set" && method === "add") return `${value} \\cup {${values[0]}}`;
  if (kind === "set" && method === "delete") return `${value} \\ {${values[0]}}`;
  if (kind === "set" && method === "clear") return "{}";
  if (kind === "map" && method === "set") return `(${values[0]} :> ${values[1]}) @@ ${value}`;
  if (kind === "map" && method === "delete") {
    const key = context.names.getFresh("key");
    return `[${key} \\in DOMAIN ${value} \\ {${values[0]}} |-> ${value}[${key}]]`;
  }
  if (kind === "map" && method === "clear") return "<<>>";
  return undefined;
};

// A method call on a collection.
export const translateMethod = (
  node: ts.CallExpression,
  receiver: ts.Expression,
  method: string,
  scope: Scope,
  context: Context,
  isDefined: boolean,
) => {
  const unordered = translateUnordered(receiver, scope, context);
  if (unordered !== undefined) {
    return translateUnorderedMethod(node, unordered, method, scope, context, isDefined);
  }
  // A mutating method on a fresh copy, such as new Set(s).add(x), returns the updated copy.
  const isCopy =
    ts.isNewExpression(receiver) &&
    receiver.arguments?.length === 1 &&
    ts.isIdentifier(receiver.expression) &&
    (receiver.expression.text === "Set" || receiver.expression.text === "Map");
  const kind = getKind(receiver, context);
  const updated = isCopy
    ? getUpdatedValue(
        translateExpression(receiver, scope, context),
        kind,
        method,
        node,
        scope,
        context,
      )
    : undefined;
  if (updated !== undefined) return updated;
  if (kind === "sequence") {
    return translateSequenceMethod(node, receiver, method, scope, context, isDefined);
  }
  if (kind === "set") return translateSetMethod(node, receiver, method, scope, context);
  if (kind === "map") return translateMapMethod(node, receiver, method, scope, context, isDefined);
  throw new TsproverError(`Unsupported call: ${node.expression.getText()}`, node);
};

export const translateNew = (node: ts.NewExpression, scope: Scope, context: Context) => {
  const constructor = node.expression.getText();
  const argument = node.arguments?.[0];
  if (constructor === "Set") {
    if (argument === undefined) return "{}";
    if (ts.isArrayLiteralExpression(argument) && !argument.elements.some(ts.isSpreadElement)) {
      return `{${argument.elements.map((element) => translateExpression(element, scope, context)).join(", ")}}`;
    }
    return translateSet(argument, scope, context);
  }
  if (constructor !== "Map") {
    throw new TsproverError(`Unsupported constructor: new ${constructor}`, node);
  }
  if (argument === undefined) return "<<>>";
  if (ts.isArrayLiteralExpression(argument)) {
    if (argument.elements.length === 0) return "<<>>";
    return argument.elements
      .toReversed()
      .map((entry) => {
        if (!ts.isArrayLiteralExpression(entry) || entry.elements.length !== 2) {
          throw new TsproverError("Write each Map entry as [key, value]", entry);
        }
        return `(${translateExpression(entry.elements[0], scope, context)} :> ${translateExpression(entry.elements[1], scope, context)})`;
      })
      .join(" @@ ");
  }
  if (getKind(argument, context) === "map") return translateExpression(argument, scope, context);
  const map = translateFunctionConstructor(argument, scope, context);
  if (map === undefined)
    throw new TsproverError(`Unsupported constructor: new ${constructor}`, node);
  return map;
};
