import ts from "typescript";
import {
  type Context,
  type Definition,
  getSymbol,
  getTopLevelDeclaration,
  isMapType,
  isSequenceType,
  isSetType,
} from "./context";
import { isNumericKey, translateString } from "./domains";
import { TsproverError } from "./errors";
import {
  type Formula,
  ifThenElse,
  indent,
  letIn,
  render,
  text,
  wrap,
  wrapEquated,
} from "./formula";

interface Field {
  key: string;
  value: string;
}

interface Bound {
  definitions: string[];
  scope: Scope;
}

export interface Scope {
  // The TLA+ expression for each variable, parameter, and local in scope.
  bindings: Map<ts.Symbol, string>;
  // The parameter that names the state before a step, in action properties and constraints.
  previous: ts.Symbol | undefined;
}

type Kind = "sequence" | "set" | "map" | "string" | "other";

interface Unordered {
  set: string;
  // Whether map() built the set, so that it may have fewer elements than the array would.
  isMapped: boolean;
}

type HelperDeclaration = ts.FunctionDeclaration | ts.VariableDeclaration;

const BINARY_OPERATORS = new Map([
  [ts.SyntaxKind.MinusToken, "-"],
  [ts.SyntaxKind.AsteriskToken, "*"],
  [ts.SyntaxKind.AsteriskAsteriskToken, "^"],
  [ts.SyntaxKind.EqualsEqualsEqualsToken, "="],
  [ts.SyntaxKind.ExclamationEqualsEqualsToken, "#"],
  [ts.SyntaxKind.LessThanToken, "<"],
  [ts.SyntaxKind.LessThanEqualsToken, "<="],
  [ts.SyntaxKind.GreaterThanToken, ">"],
  [ts.SyntaxKind.GreaterThanEqualsToken, ">="],
]);

const ORDERING_OPERATORS = new Set([
  ts.SyntaxKind.LessThanToken,
  ts.SyntaxKind.LessThanEqualsToken,
  ts.SyntaxKind.GreaterThanToken,
  ts.SyntaxKind.GreaterThanEqualsToken,
]);

const LOGICAL_OPERATORS = new Map([
  [ts.SyntaxKind.AmpersandAmpersandToken, "/\\"],
  [ts.SyntaxKind.BarBarToken, "\\/"],
]);

// Whether every member of a type, such as each literal in a union, has the given flags.
const isEvery = (type: ts.Type, flags: ts.TypeFlags): boolean =>
  type.isUnion()
    ? type.types.every((member) => isEvery(member, flags))
    : (type.flags & flags) !== 0;

export const getKind = (node: ts.Expression, context: Context): Kind => {
  const checker = context.checker;
  const type = checker.getNonNullableType(checker.getTypeAtLocation(node));
  if (isSequenceType(type, checker)) return "sequence";
  if (isSetType(type)) return "set";
  if (isMapType(type)) return "map";
  if (isEvery(type, ts.TypeFlags.StringLike)) return "string";
  return "other";
};

const isBooleanLike = (node: ts.Expression, context: Context) =>
  isEvery(context.checker.getTypeAtLocation(node), ts.TypeFlags.BooleanLike);

export const isStateModified = (scope: Scope, context: Context) =>
  [...context.variables].some(([symbol, name]) => scope.bindings.get(symbol) !== name);

const withBindings = (scope: Scope, entries: [ts.Symbol, string][]): Scope => ({
  bindings: new Map([...scope.bindings, ...entries]),
  previous: scope.previous,
});

const getFunction = (declaration: HelperDeclaration) => {
  if (ts.isFunctionDeclaration(declaration)) return declaration;
  const initializer = declaration.initializer;
  return initializer !== undefined &&
    (ts.isArrowFunction(initializer) || ts.isFunctionExpression(initializer))
    ? initializer
    : undefined;
};

const getInitializer = (declaration: HelperDeclaration) =>
  ts.isVariableDeclaration(declaration) ? declaration.initializer : undefined;

export const isFunctionValue = (node: ts.Expression | undefined) =>
  node !== undefined && (ts.isArrowFunction(node) || ts.isFunctionExpression(node));

// The function that a callback or call names: one written in place, or a helper or local function
// declared elsewhere.
const getCallee = (node: ts.Expression, context: Context) => {
  if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) return node;
  const declaration = getSymbol(node, context.checker)?.valueDeclaration;
  return declaration !== undefined &&
    (ts.isFunctionDeclaration(declaration) || ts.isVariableDeclaration(declaration))
    ? getFunction(declaration)
    : undefined;
};

const getCallback = (callback: ts.Expression, context: Context) => {
  const fn = getCallee(callback, context);
  if (fn?.body === undefined) throw new TsproverError("Pass a function here", callback);
  return { parameters: fn.parameters, body: fn.body };
};

const getCallbackParameter = (callback: ts.Expression, index: number, context: Context) =>
  getCallback(callback, context).parameters[index];

// Binds a callback's parameter to an element, and returns the bound variable for a quantifier.
const bindElement = (
  callback: ts.Expression,
  scope: Scope,
  context: Context,
): { variable: string; scope: Scope } => {
  const parameter = getCallbackParameter(callback, 0, context);
  if (parameter === undefined) {
    return { variable: context.names.getFresh("element"), scope };
  }
  if (ts.isIdentifier(parameter.name)) {
    const variable = context.names.getFresh(parameter.name.text);
    const symbol = getSymbol(parameter.name, context.checker);
    return { variable, scope: symbol ? withBindings(scope, [[symbol, variable]]) : scope };
  }
  const variable = context.names.getFresh("element");
  return { variable, scope: bindPatternInline(parameter.name, variable, scope, context) };
};

// Binds the names in a destructuring pattern to parts of a value, without LET definitions.
const bindPatternInline = (
  pattern: ts.BindingName,
  value: string,
  scope: Scope,
  context: Context,
): Scope => {
  if (ts.isIdentifier(pattern)) {
    const symbol = getSymbol(pattern, context.checker);
    return symbol ? withBindings(scope, [[symbol, value]]) : scope;
  }
  return pattern.elements.reduce((current, element, index) => {
    if (ts.isOmittedExpression(element)) return current;
    if (element.dotDotDotToken !== undefined || element.initializer !== undefined) {
      throw new TsproverError("Rest elements and default values aren't supported", element);
    }
    const part = ts.isArrayBindingPattern(pattern)
      ? `${wrap(value)}[${index + 1}]`
      : `${wrap(value)}.${(element.propertyName ?? element.name).getText()}`;
    return bindPatternInline(element.name, part, current, context);
  }, scope);
};

// Binds the names in a declaration to LET definitions, and returns the definitions.
export const bindPattern = (
  pattern: ts.BindingName,
  value: string,
  scope: Scope,
  context: Context,
): Bound => {
  if (ts.isIdentifier(pattern)) {
    const name = context.names.getFresh(pattern.text);
    const symbol = getSymbol(pattern, context.checker);
    return {
      definitions: [`${name} == ${indent(value, "      ")}`],
      scope: symbol ? withBindings(scope, [[symbol, name]]) : scope,
    };
  }
  const name = context.names.getFresh("value");
  return {
    definitions: [`${name} == ${indent(value, "      ")}`],
    scope: bindPatternInline(pattern, name, scope, context),
  };
};

// Binds parameters to argument values with LET definitions, as when inlining a call.
export const bindValues = (
  patterns: ts.BindingName[],
  values: string[],
  scope: Scope,
  context: Context,
) =>
  patterns.reduce<Bound>(
    (current, pattern, index) => {
      const result = bindPattern(pattern, values[index], current.scope, context);
      return { definitions: [...current.definitions, ...result.definitions], scope: result.scope };
    },
    { definitions: [], scope },
  );

const translateCallback = (callback: ts.Expression, scope: Scope, context: Context) =>
  translateBody(getCallback(callback, context).body, scope, context);

// A set built from a Set, Map, or object, whose element order TLA+ doesn't keep.
const translateUnordered = (
  node: ts.Expression,
  scope: Scope,
  context: Context,
): Unordered | undefined => {
  const translate = (inner: ts.Expression) => translateExpression(inner, scope, context);
  if (ts.isParenthesizedExpression(node))
    return translateUnordered(node.expression, scope, context);
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
  if (kind === "set" && ["values", "keys"].includes(method)) {
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
  if (getCallbackParameter(node.arguments[0], 1, context) !== undefined) {
    throw new TsproverError("Elements of a set have no index", node.arguments[0]);
  }
  const bound = bindElement(node.arguments[0], scope, context);
  const body = translateCallback(node.arguments[0], bound.scope, context);
  return method === "filter"
    ? { set: `{${bound.variable} \\in ${wrap(source.set)} : ${body}}`, isMapped: source.isMapped }
    : { set: `{${body} : ${bound.variable} \\in ${wrap(source.set)}}`, isMapped: true };
};

const getValues = (fn: string, context: Context): Unordered => {
  const key = context.names.getFresh("key");
  return { set: `{${wrap(fn)}[${key}] : ${key} \\in DOMAIN ${wrap(fn)}}`, isMapped: true };
};

const getEntries = (fn: string, context: Context): Unordered => {
  const key = context.names.getFresh("key");
  return {
    set: `{<<${key}, ${wrap(fn)}[${key}]>> : ${key} \\in DOMAIN ${wrap(fn)}}`,
    isMapped: false,
  };
};

// [x \in S |-> e] from source.map((x) => [x, e]), as new Map() and Object.fromEntries() take it.
const translateFunctionConstructor = (node: ts.Expression, scope: Scope, context: Context) => {
  const isMapCall =
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    node.expression.name.text === "map";
  if (!isMapCall) return undefined;
  const receiver = node.expression.expression;
  const source =
    translateUnordered(receiver, scope, context)?.set ??
    (getKind(receiver, context) === "sequence"
      ? `{${wrap(translateExpression(receiver, scope, context))}[index] : index \\in DOMAIN ${wrap(translateExpression(receiver, scope, context))}}`
      : undefined);
  const callback = node.arguments[0];
  const parameter = getCallbackParameter(callback, 0, context);
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
  const bound = bindElement(callback, scope, context);
  const value = translateExpression(pair.elements[1], bound.scope, context);
  return `[${bound.variable} \\in ${source} |-> ${value}]`;
};

// The sequence of an array literal, joining spread arrays with \o.
const translateArrayLiteral = (node: ts.ArrayLiteralExpression, scope: Scope, context: Context) => {
  const parts: string[] = [];
  const pending: string[] = [];
  const flush = () => {
    if (pending.length > 0) parts.push(`<<${pending.splice(0).join(", ")}>>`);
  };
  for (const element of node.elements) {
    if (!ts.isSpreadElement(element)) {
      pending.push(translateExpression(element, scope, context));
      continue;
    }
    if (getKind(element.expression, context) !== "sequence") {
      throw new TsproverError(
        "Sets have no order, so spread one only into every(), some(), filter(), map(), or find()",
        element,
      );
    }
    flush();
    parts.push(translateExpression(element.expression, scope, context));
  }
  flush();
  return parts.length === 0
    ? "<<>>"
    : parts.map((part) => (parts.length > 1 ? wrap(part) : part)).join(" \\o ");
};

const getField = (key: string) => (isNumericKey(key) ? `[${key}]` : `.${key}`);

const formatRecord = (fields: Field[]) =>
  fields.every((field) => isNumericKey(field.key))
    ? fields.map((field) => `(${field.key} :> ${field.value})`).join(" @@ ")
    : `[${fields.map((field) => `${field.key} |-> ${field.value}`).join(", ")}]`;

const translateObjectLiteral = (
  node: ts.ObjectLiteralExpression,
  scope: Scope,
  context: Context,
) => {
  const getKey = (property: ts.ObjectLiteralElementLike) => {
    if (property.name === undefined) return undefined;
    if (ts.isComputedPropertyName(property.name)) return undefined;
    return property.name.getText().replace(/^["']|["']$/g, "");
  };
  const getValue = (property: ts.ObjectLiteralElementLike) => {
    if (ts.isPropertyAssignment(property)) {
      return translateExpression(property.initializer, scope, context);
    }
    if (ts.isShorthandPropertyAssignment(property)) {
      return translateExpression(property.name, scope, context);
    }
    throw new TsproverError("Unsupported object member", property);
  };
  const spreads = node.properties.filter(ts.isSpreadAssignment);
  if (spreads.length === 0) {
    if (node.properties.length === 0) {
      throw new TsproverError("TLA+ has no empty record, so use a Map", node);
    }
    return formatRecord(
      node.properties.map((property) => {
        const key = getKey(property);
        if (key === undefined)
          throw new TsproverError("Computed keys need a spread base", property);
        return { key, value: getValue(property) };
      }),
    );
  }
  const first = node.properties[0];
  const updates = node.properties.slice(1);
  if (ts.isSpreadAssignment(first) && spreads.length === 1) {
    const baseType = context.checker.getTypeAtLocation(first.expression);
    const base = translateExpression(first.expression, scope, context);
    if (updates.length === 0) return base;
    const isExisting = updates.every((property) => {
      const key = getKey(property);
      return key === undefined || baseType.getProperty(key) !== undefined;
    });
    if (isExisting) {
      const changes = updates.map((property) => {
        const key = getKey(property);
        if (key !== undefined) return `!${getField(key)} = ${wrapEquated(getValue(property))}`;
        const name = property.name;
        if (name === undefined || !ts.isComputedPropertyName(name)) {
          throw new TsproverError("Unsupported object member", property);
        }
        return `![${translateExpression(name.expression, scope, context)}] = ${wrapEquated(getValue(property))}`;
      });
      return `[${wrap(base)} EXCEPT ${changes.join(", ")}]`;
    }
  }
  const type = context.checker.getTypeAtLocation(node);
  const fields = type.getProperties().map((property) => {
    const key = property.name;
    const assigned = [...node.properties]
      .reverse()
      .find((member) =>
        ts.isSpreadAssignment(member)
          ? context.checker.getTypeAtLocation(member.expression).getProperty(property.name) !==
            undefined
          : getKey(member) === property.name,
      );
    if (
      assigned === undefined ||
      (!ts.isSpreadAssignment(assigned) && getKey(assigned) === undefined)
    ) {
      throw new TsproverError(`Can't tell which value ${property.name} takes`, node);
    }
    const value = ts.isSpreadAssignment(assigned)
      ? `${wrap(translateExpression(assigned.expression, scope, context))}${getField(key)}`
      : getValue(assigned);
    return { key, value };
  });
  return formatRecord(fields);
};

const translateMinimum = (set: string, comparison: string, context: Context) => {
  const candidate = context.names.getFresh("candidate");
  const other = context.names.getFresh("other");
  return `CHOOSE ${candidate} \\in ${wrap(set)} : \\A ${other} \\in ${wrap(set)} : ${candidate} ${comparison} ${other}`;
};

const translateMath = (node: ts.CallExpression, method: string, scope: Scope, context: Context) => {
  const translate = (inner: ts.Expression) => translateExpression(inner, scope, context);
  const argument = node.arguments[0];
  if ((method === "floor" || method === "trunc") && node.arguments.length === 1) {
    const division = ts.isParenthesizedExpression(argument) ? argument.expression : argument;
    if (
      !ts.isBinaryExpression(division) ||
      division.operatorToken.kind !== ts.SyntaxKind.SlashToken
    ) {
      throw new TsproverError(
        `Math.${method} only takes a division, as in Math.${method}(a / b)`,
        node,
      );
    }
    const left = wrap(translate(division.left));
    const right = wrap(translate(division.right));
    if (method === "floor") return `${left} \\div ${right}`;
    context.prelude.add("Quot");
    return `Quot(${left}, ${right})`;
  }
  if (method === "abs" && node.arguments.length === 1) {
    const value = wrap(translate(argument));
    return `IF ${value} < 0 THEN -${value} ELSE ${value}`;
  }
  if ((method === "min" || method === "max") && node.arguments.length > 0) {
    const comparison = method === "min" ? "<=" : ">=";
    if (node.arguments.length === 1 && ts.isSpreadElement(argument)) {
      return translateMinimum(
        translateSet(argument.expression, scope, context),
        comparison,
        context,
      );
    }
    return node.arguments
      .map((inner) => wrap(translate(inner)))
      .reduce(
        (result, inner) =>
          `IF ${wrap(result)} ${comparison} ${inner} THEN ${wrap(result)} ELSE ${inner}`,
      );
  }
  throw new TsproverError(`Unsupported call: Math.${method}`, node);
};

// The first index in a sequence whose element passes a test, or undefined if none does.
const translateFirstIndex = (
  sequence: string,
  callback: ts.Expression,
  scope: Scope,
  context: Context,
) => {
  const getTest = (index: string) => {
    const parameter = getCallbackParameter(callback, 0, context);
    const indexParameter = getCallbackParameter(callback, 1, context);
    const withElement =
      parameter === undefined
        ? scope
        : bindPatternInline(parameter.name, `${wrap(sequence)}[${index}]`, scope, context);
    const withIndex =
      indexParameter === undefined
        ? withElement
        : bindPatternInline(indexParameter.name, `(${index} - 1)`, withElement, context);
    return translateCallback(callback, withIndex, context);
  };
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
  const getOffset = (inner: ts.Expression, fallback: string) => {
    if (inner === undefined) return fallback;
    if (ts.isPrefixUnaryExpression(inner) && inner.operator === ts.SyntaxKind.MinusToken) {
      return `Len(${sequence}) - ${wrap(translate(inner.operand))}`;
    }
    return translate(inner);
  };
  const orUndefined = (exists: string, value: string) => {
    if (isDefined) return value;
    context.prelude.add("Undefined");
    return `IF ${exists} THEN ${value} ELSE Undefined`;
  };
  if (method === "at") {
    const index =
      ts.isPrefixUnaryExpression(argument) && argument.operator === ts.SyntaxKind.MinusToken
        ? `Len(${sequence}) - ${wrap(translate(argument.operand))} + 1`
        : `${wrap(translate(argument))} + 1`;
    return orUndefined(`${index} \\in DOMAIN ${wrap(sequence)}`, `${wrap(sequence)}[${index}]`);
  }
  if (method === "includes" || method === "indexOf") {
    const value = translate(argument);
    const index = context.names.getFresh("index");
    if (method === "includes")
      return `\\E ${index} \\in DOMAIN ${wrap(sequence)} : ${wrap(sequence)}[${index}] = ${wrap(value)}`;
    const earlier = context.names.getFresh("earlier");
    return `IF \\E ${index} \\in DOMAIN ${wrap(sequence)} : ${wrap(sequence)}[${index}] = ${wrap(value)} THEN (CHOOSE ${index} \\in DOMAIN ${wrap(sequence)} : ${wrap(sequence)}[${index}] = ${wrap(value)} /\\ \\A ${earlier} \\in 1..(${index} - 1) : ${wrap(sequence)}[${earlier}] # ${wrap(value)}) - 1 ELSE -1`;
  }
  if (method === "slice") {
    const start = getOffset(node.arguments[0], "0");
    const end =
      node.arguments[1] === undefined ? `Len(${sequence})` : getOffset(node.arguments[1], "");
    const clamped =
      node.arguments[1] === undefined
        ? end
        : `IF ${wrap(end)} < Len(${sequence}) THEN ${wrap(end)} ELSE Len(${sequence})`;
    const first = /^\d+$/.test(start) ? String(Number(start) + 1) : `${wrap(start)} + 1`;
    return `SubSeq(${sequence}, ${first}, ${clamped})`;
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
    const parameter = getCallbackParameter(argument, 0, context);
    const indexParameter = getCallbackParameter(argument, 1, context);
    const withElement =
      parameter === undefined
        ? scope
        : bindPatternInline(parameter.name, `${wrap(sequence)}[${index}]`, scope, context);
    const withIndex =
      indexParameter === undefined
        ? withElement
        : bindPatternInline(indexParameter.name, `(${index} - 1)`, withElement, context);
    const body = translateCallback(argument, withIndex, context);
    if (method === "map") return `[${index} \\in DOMAIN ${wrap(sequence)} |-> ${body}]`;
    return `${method === "every" ? "\\A" : "\\E"} ${index} \\in DOMAIN ${wrap(sequence)} : ${body}`;
  }
  if (method === "filter") {
    if (getCallbackParameter(argument, 1, context) !== undefined) {
      throw new TsproverError("filter() can't take an index", argument);
    }
    const bound = bindElement(argument, scope, context);
    return `SelectSeq(${sequence}, LAMBDA ${bound.variable} : ${translateCallback(argument, bound.scope, context)})`;
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
  if (!["every", "some", "find"].includes(method)) {
    throw new TsproverError(`Unsupported method on a set's elements: ${method}`, node);
  }
  if (getCallbackParameter(argument, 1, context) !== undefined) {
    throw new TsproverError("Elements of a set have no index", argument);
  }
  const bound = bindElement(argument, scope, context);
  const body = translateCallback(argument, bound.scope, context);
  if (method === "every") return `\\A ${bound.variable} \\in ${wrap(source.set)} : ${body}`;
  if (method === "some") return `\\E ${bound.variable} \\in ${wrap(source.set)} : ${body}`;
  if (method === "find") {
    const choice = `CHOOSE ${bound.variable} \\in ${wrap(source.set)} : ${body}`;
    if (isDefined) return choice;
    context.prelude.add("Undefined");
    return `IF \\E ${bound.variable} \\in ${wrap(source.set)} : ${body} THEN ${choice} ELSE Undefined`;
  }
  throw new TsproverError(`Unsupported method on a set's elements: ${method}`, node);
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
  const operations: Record<string, string> = {
    has: `${other} \\in ${set}`,
    union: `${set} \\cup ${other}`,
    intersection: `${set} \\cap ${other}`,
    difference: `${set} \\ ${other}`,
    symmetricDifference: `(${set} \\ ${other}) \\cup (${other} \\ ${set})`,
    isSubsetOf: `${set} \\subseteq ${other}`,
    isSupersetOf: `${other} \\subseteq ${set}`,
    isDisjointFrom: `${set} \\cap ${other} = {}`,
  };
  const operation = operations[method];
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
  const fn = wrap(translateExpression(receiver, scope, context));
  const key =
    node.arguments[0] === undefined
      ? ""
      : wrap(translateExpression(node.arguments[0], scope, context));
  if (method === "has") return `${key} \\in DOMAIN ${fn}`;
  if (method === "get") {
    if (isDefined) return `${fn}[${key}]`;
    context.prelude.add("Undefined");
    return `IF ${key} \\in DOMAIN ${fn} THEN ${fn}[${key}] ELSE Undefined`;
  }
  throw new TsproverError(`Unsupported Map method: ${method}`, node);
};

// The result of calling a mutating method on a fresh copy, such as new Set(s).add(x).
const translateCopyUpdate = (
  node: ts.CallExpression,
  receiver: ts.Expression,
  method: string,
  scope: Scope,
  context: Context,
) => {
  const isCopy =
    ts.isNewExpression(receiver) &&
    receiver.arguments?.length === 1 &&
    ts.isIdentifier(receiver.expression) &&
    ["Set", "Map"].includes(receiver.expression.text);
  if (!isCopy) return undefined;
  const current = translateExpression(receiver, scope, context);
  const updated = getUpdatedValue(
    current,
    getKind(receiver, context),
    method,
    node,
    scope,
    context,
  );
  return updated;
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

const translateHelperCall = (
  declaration: HelperDeclaration,
  node: ts.CallExpression | undefined,
  scope: Scope,
  context: Context,
) => {
  const definition = getDefinition(declaration, context);
  const fn = getFunction(declaration);
  const argumentNodes = node === undefined ? [] : [...node.arguments];
  if (definition.readsState && isStateModified(scope, context)) {
    const initializer = getInitializer(declaration);
    if (fn === undefined && initializer !== undefined) {
      return translateExpression(initializer, scope, context);
    }
    if (fn === undefined) throw new TsproverError("Give this a body", declaration);
    return inlineCall(fn, argumentNodes, scope, context);
  }
  if (definition.parameters.length === 0) return definition.name;
  const values = argumentNodes.map((argument, index) =>
    definition.parameters[index].includes("(")
      ? translateOperatorArgument(argument, scope, context)
      : translateExpression(argument, scope, context),
  );
  return `${definition.name}(${values.join(", ")})`;
};

// Substitutes the arguments into a function's body, which then reads the state as it is now.
const inlineCall = (
  fn: ts.FunctionLikeDeclaration,
  argumentNodes: readonly ts.Expression[],
  scope: Scope,
  context: Context,
) => {
  const body = fn.body;
  if (body === undefined) throw new TsproverError("Give this a body", fn);
  const bound = bindValues(
    fn.parameters.map((parameter) => parameter.name),
    argumentNodes.map((argument) => translateExpression(argument, scope, context)),
    scope,
    context,
  );
  const value = translateBody(body, bound.scope, context);
  return bound.definitions.length === 0 ? value : render(letIn(bound.definitions, text(value)));
};

const translateOperatorArgument = (node: ts.Expression, scope: Scope, context: Context) => {
  if (ts.isArrowFunction(node) || ts.isFunctionExpression(node)) {
    const parameters = node.parameters.map((parameter) => {
      if (!ts.isIdentifier(parameter.name)) {
        throw new TsproverError("Destructured parameters aren't supported here", parameter);
      }
      return {
        name: context.names.getFresh(parameter.name.text),
        symbol: getSymbol(parameter.name, context.checker),
      };
    });
    const inner = withBindings(
      scope,
      parameters.flatMap((parameter): [ts.Symbol, string][] =>
        parameter.symbol ? [[parameter.symbol, parameter.name]] : [],
      ),
    );
    return `LAMBDA ${parameters.map((parameter) => parameter.name).join(", ")} : ${translateBody(node.body, inner, context)}`;
  }
  const declaration = getTopLevelDeclaration(getSymbol(node, context.checker));
  if (declaration !== undefined) return getDefinition(declaration, context).name;
  const bound = getSymbol(node, context.checker);
  const binding = bound === undefined ? undefined : scope.bindings.get(bound);
  if (binding !== undefined) return binding;
  throw new TsproverError("Pass a function here", node);
};

const translateCall = (
  node: ts.CallExpression,
  scope: Scope,
  context: Context,
  isDefined: boolean,
): string => {
  const callee = node.expression;
  if (ts.isPropertyAccessExpression(callee)) {
    const receiver = callee.expression;
    const method = callee.name.text;
    if (ts.isIdentifier(receiver) && receiver.text === "Math") {
      return translateMath(node, method, scope, context);
    }
    if (ts.isIdentifier(receiver) && receiver.text === "Object" && method === "fromEntries") {
      const fn = translateFunctionConstructor(node.arguments[0], scope, context);
      if (fn !== undefined) return fn;
    }
    if (
      ts.isIdentifier(receiver) &&
      receiver.text === "Array" &&
      method === "from" &&
      node.arguments.length === 2 &&
      ts.isObjectLiteralExpression(node.arguments[0])
    ) {
      const length = node.arguments[0].properties.find(
        (property) => property.name?.getText() === "length",
      );
      if (length === undefined || !ts.isPropertyAssignment(length)) {
        throw new TsproverError("Array.from needs { length: n }", node);
      }
      const index = context.names.getFresh("index");
      const parameter = getCallbackParameter(node.arguments[1], 1, context);
      const inner =
        parameter === undefined
          ? scope
          : bindPatternInline(parameter.name, `(${index} - 1)`, scope, context);
      return `[${index} \\in 1..${wrap(translateExpression(length.initializer, scope, context))} |-> ${translateCallback(node.arguments[1], inner, context)}]`;
    }
    if (method === "fill" && node.arguments.length === 1) {
      const array =
        ts.isNewExpression(receiver) || ts.isCallExpression(receiver) ? receiver : undefined;
      const isArray =
        array !== undefined &&
        ts.isIdentifier(array.expression) &&
        array.expression.text === "Array" &&
        array.arguments?.length === 1;
      if (isArray) {
        const index = context.names.getFresh("index");
        return `[${index} \\in 1..${wrap(translateExpression(array.arguments![0], scope, context))} |-> ${translateExpression(node.arguments[0], scope, context)}]`;
      }
    }
    const symbol = getSymbol(callee, context.checker);
    const helper = getTopLevelDeclaration(symbol);
    if (helper !== undefined) return translateHelperCall(helper, node, scope, context);
    const unordered = translateUnordered(receiver, scope, context);
    if (unordered !== undefined) {
      return translateUnorderedMethod(node, unordered, method, scope, context, isDefined);
    }
    const copyUpdate = translateCopyUpdate(node, receiver, method, scope, context);
    if (copyUpdate !== undefined) return copyUpdate;
    const kind = getKind(receiver, context);
    if (kind === "sequence") {
      return translateSequenceMethod(node, receiver, method, scope, context, isDefined);
    }
    if (kind === "set") return translateSetMethod(node, receiver, method, scope, context);
    if (kind === "map")
      return translateMapMethod(node, receiver, method, scope, context, isDefined);
    throw new TsproverError(`Unsupported call: ${callee.getText()}`, node);
  }
  const symbol = getSymbol(callee, context.checker);
  const helper = getTopLevelDeclaration(symbol);
  if (helper !== undefined) return translateHelperCall(helper, node, scope, context);
  const operator = symbol === undefined ? undefined : scope.bindings.get(symbol);
  if (operator !== undefined) {
    return `${operator}(${node.arguments.map((argument) => translateExpression(argument, scope, context)).join(", ")})`;
  }
  const local = getCallee(callee, context);
  if (local === undefined) throw new TsproverError(`Unsupported call: ${callee.getText()}`, node);
  if (context.inProgress.has(local)) {
    throw new TsproverError(
      "A local function can't call itself, so declare it at the top level",
      node,
    );
  }
  context.inProgress.add(local);
  const value = inlineCall(local, node.arguments, scope, context);
  context.inProgress.delete(local);
  return value;
};

// The elements of a set, an array, or an iterator over a collection, as a TLA+ set.
const translateSet = (node: ts.Expression, scope: Scope, context: Context) => {
  const unordered = translateUnordered(node, scope, context);
  if (unordered !== undefined) return unordered.set;
  const kind = getKind(node, context);
  const value = translateExpression(node, scope, context);
  if (kind === "set") return value;
  if (kind !== "sequence") throw new TsproverError("Expected a Set or an array", node);
  const index = context.names.getFresh("index");
  return `{${wrap(value)}[${index}] : ${index} \\in DOMAIN ${wrap(value)}}`;
};

const translateNew = (node: ts.NewExpression, scope: Scope, context: Context) => {
  const constructor = node.expression.getText();
  const argument = node.arguments?.[0];
  if (constructor === "Set") {
    if (argument === undefined) return "{}";
    if (ts.isArrayLiteralExpression(argument) && !argument.elements.some(ts.isSpreadElement)) {
      return `{${argument.elements.map((element) => translateExpression(element, scope, context)).join(", ")}}`;
    }
    return translateSet(argument, scope, context);
  }
  if (constructor === "Map") {
    if (argument === undefined) return "<<>>";
    if (ts.isArrayLiteralExpression(argument)) {
      if (argument.elements.length === 0) return "<<>>";
      return [...argument.elements]
        .reverse()
        .map((entry) => {
          if (!ts.isArrayLiteralExpression(entry) || entry.elements.length !== 2) {
            throw new TsproverError("Write each Map entry as [key, value]", entry);
          }
          return `(${translateExpression(entry.elements[0], scope, context)} :> ${translateExpression(entry.elements[1], scope, context)})`;
        })
        .join(" @@ ");
    }
    if (getKind(argument, context) === "map") return translateExpression(argument, scope, context);
    const fn = translateFunctionConstructor(argument, scope, context);
    if (fn !== undefined) return fn;
  }
  throw new TsproverError(`Unsupported constructor: new ${constructor}`, node);
};

const translateIdentifier = (node: ts.Identifier, scope: Scope, context: Context) => {
  if (node.text === "undefined") {
    context.prelude.add("Undefined");
    return "Undefined";
  }
  const symbol = getSymbol(node, context.checker);
  const binding = symbol === undefined ? undefined : scope.bindings.get(symbol);
  if (binding !== undefined) return binding;
  if (symbol !== undefined && symbol === scope.previous) {
    return formatRecord(
      context.checker
        .getTypeAtLocation(node)
        .getProperties()
        .map((property) => ({
          key: property.name,
          value: getPreviousVariable(property.name, node, context),
        })),
    );
  }
  if (symbol !== undefined && symbol.flags & ts.SymbolFlags.EnumMember) {
    return translateConstant(node, symbol, context);
  }
  const declaration = getTopLevelDeclaration(symbol);
  if (declaration !== undefined) return translateReference(declaration, scope, context);
  if (symbol !== undefined && context.variables.has(symbol)) {
    throw new TsproverError(`${node.text} can't be read here`, node);
  }
  throw new TsproverError(`Unknown name: ${node.text}`, node);
};

// A field of the state before the step, which is the variable's unprimed value.
const getPreviousVariable = (name: string, node: ts.Node, context: Context) => {
  const variable = [...context.variables].find(([symbol]) => symbol.name === name);
  if (variable === undefined) throw new TsproverError(`Unknown variable: ${name}`, node);
  return variable[1];
};

// A function passes as its operator's name, and a constant as its value.
const translateReference = (declaration: HelperDeclaration, scope: Scope, context: Context) =>
  getFunction(declaration) === undefined
    ? translateHelperCall(declaration, undefined, scope, context)
    : getDefinition(declaration, context).name;

const translateConstant = (node: ts.Node, symbol: ts.Symbol, context: Context) => {
  const declaration = symbol.valueDeclaration;
  const value =
    declaration !== undefined && ts.isEnumMember(declaration)
      ? context.checker.getConstantValue(declaration)
      : undefined;
  if (typeof value === "string") return translateString(value, context);
  if (typeof value === "number" && Number.isInteger(value)) return String(value);
  throw new TsproverError("Unsupported enum member", node);
};

const translatePropertyAccess = (
  node: ts.PropertyAccessExpression,
  scope: Scope,
  context: Context,
) => {
  if (node.questionDotToken !== undefined) {
    throw new TsproverError("Optional chaining isn't supported", node);
  }
  const receiver = node.expression;
  const name = node.name.text;
  const symbol = getSymbol(node, context.checker);
  if (symbol !== undefined && symbol.flags & ts.SymbolFlags.EnumMember) {
    return translateConstant(node, symbol, context);
  }
  const declaration = getTopLevelDeclaration(symbol);
  if (declaration !== undefined) return translateReference(declaration, scope, context);
  if (scope.previous !== undefined && ts.isIdentifier(receiver)) {
    const receiverSymbol = getSymbol(receiver, context.checker);
    if (receiverSymbol === scope.previous) {
      return getPreviousVariable(name, node, context);
    }
  }
  if (name === "length" || name === "size") {
    const unordered = translateUnordered(receiver, scope, context);
    if (unordered !== undefined) {
      if (unordered.isMapped) {
        throw new TsproverError("map() can merge equal elements, so count before mapping", node);
      }
      return `Cardinality(${unordered.set})`;
    }
    const kind = getKind(receiver, context);
    const value = translateExpression(receiver, scope, context);
    if (kind === "sequence" || kind === "string") return `Len(${value})`;
    if (kind === "set") return `Cardinality(${value})`;
    if (kind === "map") return `Cardinality(DOMAIN ${wrap(value)})`;
  }
  return `${wrap(translateExpression(receiver, scope, context))}.${name}`;
};

const translateElementAccess = (
  node: ts.ElementAccessExpression,
  scope: Scope,
  context: Context,
) => {
  const value = wrap(translateExpression(node.expression, scope, context));
  const index = node.argumentExpression;
  if (getKind(node.expression, context) !== "sequence") {
    return `${value}[${translateExpression(index, scope, context)}]`;
  }
  return ts.isNumericLiteral(index)
    ? `${value}[${Number(index.text) + 1}]`
    : `${value}[${wrap(translateExpression(index, scope, context))} + 1]`;
};

const translateTemplate = (node: ts.TemplateExpression, scope: Scope, context: Context) => {
  const parts = [
    ...(node.head.text === "" ? [] : [JSON.stringify(node.head.text)]),
    ...node.templateSpans.flatMap((span) => {
      const value = translateExpression(span.expression, scope, context);
      const part = getKind(span.expression, context) === "string" ? value : `ToString(${value})`;
      return span.literal.text === "" ? [part] : [part, JSON.stringify(span.literal.text)];
    }),
  ];
  return parts.map((part) => (parts.length > 1 ? wrap(part) : part)).join(" \\o ");
};

const translateBinary = (node: ts.BinaryExpression, scope: Scope, context: Context) => {
  const kind = node.operatorToken.kind;
  const translate = (inner: ts.Expression) => wrap(translateExpression(inner, scope, context));
  // JavaScript converts the other operand of a string + to a string.
  const translateString = (inner: ts.Expression) =>
    getKind(inner, context) === "string"
      ? translate(inner)
      : `ToString(${translateExpression(inner, scope, context)})`;
  const logical = LOGICAL_OPERATORS.get(kind);
  if (logical !== undefined) {
    if (!isBooleanLike(node.left, context) || !isBooleanLike(node.right, context)) {
      throw new TsproverError(
        `${node.operatorToken.getText()} needs booleans, so compare explicitly`,
        node,
      );
    }
    return `${translate(node.left)} ${logical} ${translate(node.right)}`;
  }
  if (kind === ts.SyntaxKind.PlusToken) {
    const isString =
      getKind(node.left, context) === "string" || getKind(node.right, context) === "string";
    if (!isString) return `${translate(node.left)} + ${translate(node.right)}`;
    return `${translateString(node.left)} \\o ${translateString(node.right)}`;
  }
  if (kind === ts.SyntaxKind.PercentToken) {
    context.prelude.add("Rem");
    return `Rem(${translateExpression(node.left, scope, context)}, ${translateExpression(node.right, scope, context)})`;
  }
  if (kind === ts.SyntaxKind.QuestionQuestionToken) {
    context.prelude.add("Null");
    context.prelude.add("Undefined");
    const value = translate(node.left);
    return `IF ${value} \\in {Null, Undefined} THEN ${translate(node.right)} ELSE ${value}`;
  }
  if (kind === ts.SyntaxKind.InKeyword) {
    return `${translate(node.left)} \\in DOMAIN ${translate(node.right)}`;
  }
  if (kind === ts.SyntaxKind.SlashToken) {
    throw new TsproverError("Write division as Math.floor(a / b) or Math.trunc(a / b)", node);
  }
  const operator = BINARY_OPERATORS.get(kind);
  if (
    ORDERING_OPERATORS.has(kind) &&
    (getKind(node.left, context) === "string" || getKind(node.right, context) === "string")
  ) {
    throw new TsproverError("TLA+ strings have no order, so compare them with === only", node);
  }
  if (operator === undefined) {
    throw new TsproverError(
      `Unsupported operator: ${node.operatorToken.getText()}`,
      node.operatorToken,
    );
  }
  return `${translate(node.left)} ${operator} ${translate(node.right)}`;
};

export const translateCondition = (node: ts.Expression, scope: Scope, context: Context) => {
  if (!isBooleanLike(node, context)) {
    throw new TsproverError("Conditions must be booleans, so compare explicitly", node);
  }
  return translateExpression(node, scope, context);
};

// Negates a condition, cancelling ! and turning a negated || into a conjunction of guards, so that
// TLC sees the same formula as a hand-written spec and counts the same successors.
export const translateNegatedCondition = (
  node: ts.Expression,
  scope: Scope,
  context: Context,
): string => {
  if (ts.isParenthesizedExpression(node)) {
    return translateNegatedCondition(node.expression, scope, context);
  }
  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.ExclamationToken) {
    return translateCondition(node.operand, scope, context);
  }
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.BarBarToken) {
    const left = translateNegatedCondition(node.left, scope, context);
    const right = translateNegatedCondition(node.right, scope, context);
    return `${wrap(left)} /\\ ${wrap(right)}`;
  }
  return `~${wrap(translateCondition(node, scope, context))}`;
};

export const translateExpression = (
  node: ts.Expression,
  scope: Scope,
  context: Context,
  isDefined = false,
): string => {
  if (ts.isParenthesizedExpression(node)) {
    return translateExpression(node.expression, scope, context, isDefined);
  }
  if (ts.isNonNullExpression(node))
    return translateExpression(node.expression, scope, context, true);
  if (
    ts.isAsExpression(node) ||
    ts.isSatisfiesExpression(node) ||
    ts.isTypeAssertionExpression(node)
  ) {
    return translateExpression(node.expression, scope, context, isDefined);
  }
  if (ts.isNumericLiteral(node)) {
    if (!Number.isInteger(Number(node.text))) {
      throw new TsproverError(`Only integers are supported: ${node.text}`, node);
    }
    return String(Number(node.text));
  }
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return translateString(node.text, context);
  }
  if (ts.isTemplateExpression(node)) return translateTemplate(node, scope, context);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return "TRUE";
  if (node.kind === ts.SyntaxKind.FalseKeyword) return "FALSE";
  if (node.kind === ts.SyntaxKind.NullKeyword) {
    context.prelude.add("Null");
    return "Null";
  }
  if (ts.isIdentifier(node)) return translateIdentifier(node, scope, context);
  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.ExclamationToken) {
    if (!isBooleanLike(node.operand, context)) {
      throw new TsproverError("! needs a boolean, so compare explicitly", node);
    }
    return `~${wrap(translateExpression(node.operand, scope, context))}`;
  }
  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken) {
    return `-${wrap(translateExpression(node.operand, scope, context))}`;
  }
  if (ts.isBinaryExpression(node)) return translateBinary(node, scope, context);
  if (ts.isConditionalExpression(node)) {
    return `IF ${translateCondition(node.condition, scope, context)} THEN ${translateExpression(node.whenTrue, scope, context)} ELSE ${translateExpression(node.whenFalse, scope, context)}`;
  }
  if (ts.isArrayLiteralExpression(node)) return translateArrayLiteral(node, scope, context);
  if (ts.isObjectLiteralExpression(node)) return translateObjectLiteral(node, scope, context);
  if (ts.isPropertyAccessExpression(node)) return translatePropertyAccess(node, scope, context);
  if (ts.isElementAccessExpression(node)) return translateElementAccess(node, scope, context);
  if (ts.isCallExpression(node)) return translateCall(node, scope, context, isDefined);
  if (ts.isNewExpression(node)) return translateNew(node, scope, context);
  throw new TsproverError(`Unsupported expression: ${node.getText()}`, node);
};

// A function body that computes a value, as a TLA+ expression.
export const translateBody = (body: ts.ConciseBody, scope: Scope, context: Context): string => {
  if (!ts.isBlock(body)) return translateExpression(body, scope, context);
  return render(
    translatePure(body.statements, 0, scope, context, () => {
      throw new TsproverError("This function must return a value on every path", body);
    }),
  );
};

const translatePure = (
  statements: readonly ts.Statement[],
  index: number,
  scope: Scope,
  context: Context,
  next: (scope: Scope) => Formula,
): Formula => {
  if (index === statements.length) return next(scope);
  const statement = statements[index];
  const continueWith = (inner: Scope) => translatePure(statements, index + 1, inner, context, next);
  if (ts.isBlock(statement)) {
    return translatePure(statement.statements, 0, scope, context, continueWith);
  }
  if (ts.isVariableStatement(statement)) {
    const result = statement.declarationList.declarations.reduce<Bound>(
      (current, declaration) => {
        if (declaration.initializer === undefined) {
          throw new TsproverError("Declare locals with a value", declaration);
        }
        if (isFunctionValue(declaration.initializer)) return current;
        const bound = bindPattern(
          declaration.name,
          translateExpression(declaration.initializer, current.scope, context),
          current.scope,
          context,
        );
        return { definitions: [...current.definitions, ...bound.definitions], scope: bound.scope };
      },
      { definitions: [], scope },
    );
    return letIn(result.definitions, continueWith(result.scope));
  }
  if (ts.isIfStatement(statement)) {
    const condition = translateCondition(statement.expression, scope, context);
    const whenTrue = translatePure([statement.thenStatement], 0, scope, context, continueWith);
    const whenFalse =
      statement.elseStatement === undefined
        ? continueWith(scope)
        : translatePure([statement.elseStatement], 0, scope, context, continueWith);
    return ifThenElse(
      condition,
      whenTrue,
      whenFalse,
      translateNegatedCondition(statement.expression, scope, context),
    );
  }
  if (ts.isReturnStatement(statement)) {
    if (statement.expression === undefined) {
      throw new TsproverError("Return a value", statement);
    }
    return text(translateExpression(statement.expression, scope, context));
  }
  if (ts.isThrowStatement(statement)) return text(translateThrow(statement, scope, context));
  if (ts.isSwitchStatement(statement)) {
    return translateSwitch(
      statement,
      scope,
      scope,
      context,
      (clauseStatements, inner, after) => translatePure(clauseStatements, 0, inner, context, after),
      continueWith,
    );
  }
  throw new TsproverError(`Unsupported statement: ${statement.getText()}`, statement);
};

export const translateThrow = (statement: ts.ThrowStatement, scope: Scope, context: Context) => {
  const thrown = statement.expression;
  const message =
    ts.isNewExpression(thrown) && thrown.arguments?.[0] !== undefined
      ? translateExpression(thrown.arguments[0], scope, context)
      : JSON.stringify(thrown.getText());
  return `Assert(FALSE, ${message})`;
};

// A switch as nested IFs. Each clause must end in break, return, or throw.
export const translateSwitch = <State>(
  statement: ts.SwitchStatement,
  state: State,
  scope: Scope,
  context: Context,
  translateClause: (
    statements: readonly ts.Statement[],
    state: State,
    after: (state: State) => Formula,
  ) => Formula,
  continueWith: (state: State) => Formula,
): Formula => {
  const subject = wrap(translateExpression(statement.expression, scope, context));
  const clauses = statement.caseBlock.clauses;
  const translateFrom = (start: number): Formula => {
    if (start === clauses.length) return continueWith(state);
    const end = clauses.findIndex(
      (clause, index) => index >= start && clause.statements.length > 0,
    );
    const group = clauses.slice(start, end === -1 ? clauses.length : end + 1);
    const lastClause = group[group.length - 1];
    const body = lastClause.statements;
    const last = body[body.length - 1];
    const isTerminated =
      last !== undefined &&
      (ts.isBreakStatement(last) || ts.isReturnStatement(last) || ts.isThrowStatement(last));
    const isLast = start + group.length === clauses.length;
    if (body.length > 0 && !isTerminated && !isLast) {
      throw new TsproverError("End each case with break, return, or throw", lastClause);
    }
    const statements = last !== undefined && ts.isBreakStatement(last) ? body.slice(0, -1) : body;
    const formula = translateClause(statements, state, continueWith);
    if (group.some(ts.isDefaultClause)) return formula;
    const condition = group
      .filter(ts.isCaseClause)
      .map(
        (clause) => `${subject} = ${wrap(translateExpression(clause.expression, scope, context))}`,
      )
      .join(" \\/ ");
    return ifThenElse(condition, formula, translateFrom(start + group.length));
  };
  return translateFrom(0);
};

const readsState = (node: ts.Node, context: Context, visited: Set<ts.Declaration>): boolean => {
  if (ts.isIdentifier(node)) {
    const symbol = getSymbol(node, context.checker);
    if (symbol !== undefined && context.variables.has(symbol)) return true;
    const declaration = getTopLevelDeclaration(symbol);
    if (declaration !== undefined && !visited.has(declaration)) {
      visited.add(declaration);
      return readsState(declaration, context, visited);
    }
  }
  return (
    ts.forEachChild(node, (child) => readsState(child, context, visited) || undefined) ?? false
  );
};

// Compiles a top-level helper function or constant into a TLA+ definition, after the definitions
// it uses.
export const getDefinition = (declaration: HelperDeclaration, context: Context): Definition => {
  const existing = context.definitions.get(declaration);
  if (existing !== undefined) {
    if (context.inProgress.has(declaration)) context.recursive.add(declaration);
    return existing;
  }
  const fn = getFunction(declaration);
  if (declaration.name === undefined) throw new TsproverError("Name this function", declaration);
  const parameters = (fn?.parameters ?? []).map((parameter) => {
    if (
      !ts.isIdentifier(parameter.name) ||
      parameter.initializer !== undefined ||
      parameter.dotDotDotToken !== undefined
    ) {
      throw new TsproverError("Use a plain parameter here", parameter);
    }
    const name = context.names.getFresh(parameter.name.text);
    const signatures = context.checker.getTypeAtLocation(parameter.name).getCallSignatures();
    return {
      name,
      declared:
        signatures.length === 0
          ? name
          : `${name}(${signatures[0].parameters.map(() => "_").join(", ")})`,
      symbol: getSymbol(parameter.name, context.checker),
    };
  });
  const definition: Definition = {
    name: context.names.getFresh(declaration.name.getText()),
    parameters: parameters.map((parameter) => parameter.declared),
    readsState: readsState(declaration, context, new Set([declaration])),
  };
  context.definitions.set(declaration, definition);
  context.inProgress.add(declaration);
  const scope: Scope = {
    bindings: new Map([
      ...context.variables,
      ...parameters.flatMap((parameter): [ts.Symbol, string][] =>
        parameter.symbol ? [[parameter.symbol, parameter.name]] : [],
      ),
    ]),
    previous: undefined,
  };
  const body = fn === undefined ? getInitializer(declaration) : fn.body;
  const value = body === undefined ? undefined : translateBody(body, scope, context);
  if (value === undefined) throw new TsproverError("Give this a value", declaration);
  context.inProgress.delete(declaration);
  const head =
    parameters.length === 0
      ? definition.name
      : `${definition.name}(${parameters.map((parameter) => parameter.declared).join(", ")})`;
  context.output.push(`${head} ==\n  ${indent(value, "  ")}`);
  return definition;
};
