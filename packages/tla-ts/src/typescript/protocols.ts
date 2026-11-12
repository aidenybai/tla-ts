import ts from "@typescript/typescript6";
import type { Expression } from "../ast";
import {
  allocate,
  bindOnce,
  type Frame,
  inlineBody,
  inlineValues,
  type Path,
  throwError,
  throwTypeError,
  translateJoined,
} from "./actions";
import {
  type Context,
  findNodes,
  type FunctionNode,
  getAccessKey,
  getAccessorFunctions,
  getGetters,
  getCallee,
  getReturnedFunctions,
  getUndefined,
  isInertValue,
  isMethodCall,
  isNestedFunction,
  skipCasts,
} from "./context";
import { TlaTypeScriptError } from "../errors";
import { translateExpression } from "./expressions";
import { type Formula, ifThenElse, leaf } from "./formula";
import { getBuiltIn } from "./intrinsics";
import { getCandidateValue, getHeap, isProxyValue, translateObjectValue } from "./heap";
import { useJavaScript } from "./javascript";
import { getKind, isHeapType } from "./types";
import {
  apply,
  boolean,
  field,
  identifier,
  index,
  junction,
  not,
  number,
  record,
  string,
  tuple,
} from "./tla";

// The key that a name writes, as @@name for Symbol.name.
const getKey = (name: ts.Node): string | undefined =>
  ts.isComputedPropertyName(name) || ts.isElementAccessExpression(name)
    ? getKey(ts.isComputedPropertyName(name) ? name.expression : name.argumentExpression)
    : ts.isPropertyAccessExpression(name)
      ? name.expression.getText() === "Symbol"
        ? `@@${name.name.text}`
        : name.name.text
      : ts.isIdentifier(name) || ts.isStringLiteral(name)
        ? name.text
        : undefined;

const isRunnable = (node: ts.Node): node is FunctionNode =>
  (ts.isFunctionDeclaration(node) ||
    ts.isFunctionExpression(node) ||
    ts.isArrowFunction(node) ||
    ts.isMethodDeclaration(node) ||
    ts.isGetAccessorDeclaration(node)) &&
  node.body !== undefined &&
  (ts.isArrowFunction(node) ||
    ts.isGetAccessorDeclaration(node) ||
    node.asteriskToken === undefined) &&
  (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Async) === 0;

const written = new WeakMap<ts.SourceFile, Map<string, FunctionNode[]>>();

// The functions that a script writes under a key, as methods and as getters, by key. A call of what
// JavaScript reads under the key, as a protocol such as iteration does, branches on which of them
// it is.
export const getWrittenFunctions = (node: ts.Node, key: string, context: Context) => {
  const file = node.getSourceFile();
  const known = written.get(file);
  if (known !== undefined) return known.get(key) ?? [];
  const found = new Map<string, FunctionNode[]>();
  const add = (name: ts.Node, value: ts.Node) => {
    const role = getKey(name);
    const candidate = ts.isExpression(value)
      ? (getCallee(skipCasts(value), context) ?? skipCasts(value))
      : value;
    if (role === undefined || !isRunnable(candidate)) return;
    const known = found.get(role) ?? [];
    if (!known.includes(candidate)) found.set(role, [...known, candidate]);
  };
  findNodes(file, (inner): inner is ts.Node => {
    if (ts.isPropertyAssignment(inner)) add(inner.name, inner.initializer);
    if (ts.isMethodDeclaration(inner) || ts.isGetAccessorDeclaration(inner)) add(inner.name, inner);
    if (ts.isBinaryExpression(inner) && inner.operatorToken.kind === ts.SyntaxKind.EqualsToken) {
      add(skipCasts(inner.left), inner.right);
    }
    return false;
  });
  written.set(file, found);
  return found.get(key) ?? [];
};

export const getMethods = (node: ts.Node, key: string, context: Context) =>
  getWrittenFunctions(node, key, context).filter(
    (candidate) => !ts.isGetAccessorDeclaration(candidate),
  );

const getKeyGetters = (node: ts.Node, key: string, context: Context) => [
  ...getWrittenFunctions(node, key, context).filter(ts.isGetAccessorDeclaration),
  ...getAccessorFunctions(node, "get", context),
];

export const isNullish = (value: Expression, context: Context) =>
  apply("\\/", [
    apply("=", [value, getUndefined(context)]),
    apply("=", [value, identifier("Null")]),
  ]);

export const bind = (
  path: Path,
  name: string,
  value: Expression,
  context: Context,
  continueWith: (path: Path, value: Expression) => Formula,
) => {
  const fresh = context.names.getFresh(name);
  return bindOnce(path, fresh, value, continueWith(path, identifier(fresh)));
};

// Calls a value with a receiver and arguments, branching on which of the candidates it is, or
// does what otherwise does with the call's continuation where it's none of them.
export const callValue = (
  site: ts.Node,
  candidates: readonly FunctionNode[],
  value: Expression,
  receiver: Expression,
  values: Expression[],
  path: Path,
  context: Context,
  frame: Frame,
  otherwise: (next: (inner: Path, value?: Expression) => Formula) => Formula,
  continueWith: (path: Path, result: Expression) => Formula,
): Formula =>
  translateJoined(
    site,
    path,
    context,
    (after, result) => continueWith(after, result ?? getUndefined(context)),
    (next) =>
      candidates.reduceRight((rest, candidate) => {
        const candidateValue = getCandidateValue(candidate, context);
        if (candidateValue === undefined || frame.inlining.has(candidate)) return rest;
        const received = ts.isArrowFunction(candidate)
          ? undefined
          : { value: receiver, method: candidate };
        return ifThenElse(
          apply("=", [
            useJavaScript("CodeOf", [getHeap(path.scope, site, context), value], context),
            candidateValue,
          ]),
          values.length === 0
            ? inlineBody(site, candidate, [], received, path, context, frame, next)
            : inlineValues(candidate, values, received, path, context, frame, next),
          rest,
        );
      }, otherwise(next)),
  );

// Calls a method that the iterator protocol read, which throws a TypeError where it isn't callable.
export const callMethod = (
  site: ts.Node,
  key: string,
  value: Expression,
  receiver: Expression,
  path: Path,
  context: Context,
  frame: Frame,
  throwWith: (path: Path) => Formula,
  continueWith: (path: Path, result: Expression) => Formula,
) =>
  callValue(
    site,
    getMethods(site, key, context),
    value,
    receiver,
    [],
    path,
    context,
    frame,
    () =>
      ifThenElse(
        apply("=", [
          useJavaScript("TypeOfIn", [getHeap(path.scope, site, context), value], context),
          string("function"),
        ]),
        leaf(
          apply("Assert", [boolean(false), string("tla-ts can't tell which function this calls")]),
        ),
        throwWith(path),
      ),
    continueWith,
  );

// Reads a property, running the getter it holds where that's one of the candidates.
export const readWith = (
  site: ts.Node,
  object: Expression,
  property: Expression,
  getters: readonly FunctionNode[],
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value: Expression) => Formula,
): Formula => {
  const heap = getHeap(path.scope, site, context);
  const got = useJavaScript("Get", [heap, object, property], context);
  if (getters.length === 0) return bind(path, "property", got, context, continueWith);
  return bind(
    path,
    "getter",
    useJavaScript("GetterOf", [heap, object, property], context),
    context,
    (bound, getter) =>
      callValue(
        site,
        getters,
        getter,
        object,
        [],
        bound,
        context,
        frame,
        (next) => next(bound, got),
        (after, value) => bind(after, "property", value, context, continueWith),
      ),
  );
};

// Reads a property, running its getter where it's one that the script writes.
export const read = (
  site: ts.Node,
  object: Expression,
  key: string,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value: Expression) => Formula,
): Formula =>
  readWith(
    site,
    object,
    key.startsWith("@@")
      ? useJavaScript("WellKnownSymbol", [string(key.slice(2))], context)
      : string(key),
    getKeyGetters(site, key, context),
    path,
    context,
    frame,
    continueWith,
  );

// The key that a pattern's element reads, where a name or a string gives it.
const getElementKey = (element: ts.BindingElement) => {
  const name = element.propertyName ?? element.name;
  return ts.isIdentifier(name) || ts.isStringLiteral(name) ? name.text : undefined;
};

// Whether binding a name runs code, through a default that isn't inert or a computed key.
const isRunning = (name: ts.BindingName): boolean =>
  !ts.isIdentifier(name) &&
  name.elements.some(
    (element) =>
      !ts.isOmittedExpression(element) &&
      ((element.initializer !== undefined && !isInertValue(element.initializer)) ||
        (element.propertyName !== undefined && ts.isComputedPropertyName(element.propertyName)) ||
        isRunning(element.name)),
  );

// The elements of an object pattern on an object whose getters the binding runs first: those that
// read a key that the script defines a getter under, before any element whose default or key runs
// code, after which a getter would run out of order.
const getGetterElements = (pattern: ts.BindingName, context: Context) => {
  if (!ts.isObjectBindingPattern(pattern) || context.heap === undefined) return [];
  const type = context.checker.getNonNullableType(context.checker.getTypeAtLocation(pattern));
  if (!isHeapType(type, pattern, context)) return [];
  const stop = pattern.elements.findIndex(
    (element) => element.dotDotDotToken !== undefined || getElementKey(element) === undefined,
  );
  const plain = stop === -1 ? pattern.elements : pattern.elements.slice(0, stop);
  const running = plain.findIndex(
    (element) =>
      (element.initializer !== undefined && !isInertValue(element.initializer)) ||
      isRunning(element.name),
  );
  const keys = getGetterKeys(pattern);
  return (running === -1 ? plain : plain.slice(0, running + 1)).filter((element) =>
    keys.has(getElementKey(element) ?? ""),
  );
};

// An object pattern's rest element, with the one key that the script defines a getter under that
// it may copy, where nothing that the pattern evaluates before the copy runs code.
const getRestGetter = (pattern: ts.BindingName, context: Context) => {
  if (!ts.isObjectBindingPattern(pattern) || context.heap === undefined) return undefined;
  const element = pattern.elements.at(-1);
  const others = pattern.elements.slice(0, -1);
  const type = context.checker.getNonNullableType(context.checker.getTypeAtLocation(pattern));
  if (
    element?.dotDotDotToken === undefined ||
    !isHeapType(type, pattern, context) ||
    others.some(
      (other) =>
        getElementKey(other) === undefined ||
        (other.initializer !== undefined && !isInertValue(other.initializer)) ||
        isRunning(other.name),
    )
  ) {
    return undefined;
  }
  const excluded = others.map(getElementKey);
  const keys = [...getGetterKeys(pattern)].filter((key) => !excluded.includes(key));
  return keys.length === 1 ? { element, key: keys[0] } : undefined;
};

// Whether a pattern's binding runs getters that haven't run yet.
export const isGetterPattern = (pattern: ts.BindingName, path: Path, context: Context) =>
  [...getGetterElements(pattern, context), getRestGetter(pattern, context)?.element].some(
    (element) => element !== undefined && !path.scope.read?.has(element),
  );

// Reads the properties of an object pattern's elements whose getters may run, in order, so that
// binding the pattern takes the values that they gave.
export const readPatternGetters = (
  pattern: ts.BindingName,
  value: Expression,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path) => Formula,
): Formula => {
  const elements = getGetterElements(pattern, context);
  const rest = getRestGetter(pattern, context);
  const finish = (current: Path, values: readonly Expression[]) =>
    continueWith({
      ...current,
      scope: {
        ...current.scope,
        read: new Map([
          ...(current.scope.read ?? []),
          ...[...elements, ...(rest === undefined ? [] : [rest.element])].map(
            (inner, position): [ts.BindingElement, Expression] => [inner, values[position]],
          ),
        ]),
      },
    });
  const readFrom = (current: Path, values: readonly Expression[]): Formula => {
    const element = elements.at(values.length);
    // The rest copies the key's value, running its getter, where the object has it as its own
    // enumerable property.
    if (element === undefined && rest !== undefined) {
      return ifThenElse(
        useJavaScript(
          "IsEnumerableOwn",
          [getHeap(current.scope, rest.element, context), value, string(rest.key)],
          context,
        ),
        read(rest.element, value, rest.key, current, context, frame, (after, got) =>
          finish(after, [...values, apply(":>", [string(rest.key), got])]),
        ),
        finish(current, [...values, tuple([])]),
      );
    }
    if (element === undefined) return finish(current, values);
    return read(
      element,
      value,
      getElementKey(element) ?? "",
      current,
      context,
      frame,
      (after, got) => readFrom(after, [...values, got]),
    );
  };
  return ifThenElse(
    isNullish(value, context),
    leaf(
      apply("Assert", [
        boolean(false),
        string("tla-ts can't throw the TypeError of destructuring a value that isn't an object"),
      ]),
    ),
    readFrom(path, []),
  );
};

// The fields that ToPropertyDescriptor reads, in the order it reads them.
const DESCRIPTOR_FIELDS = ["enumerable", "configurable", "value", "writable", "get", "set"];

const getterKeys = new WeakMap<ts.SourceFile, Set<string>>();

// The keys that a script defines getters under, in object literals and classes or with
// Object.defineProperty.
export const getGetterKeys = (node: ts.Node) => {
  const file = node.getSourceFile();
  const known = getterKeys.get(file);
  if (known !== undefined) return known;
  const keys = new Set<string>();
  findNodes(file, (inner): inner is ts.Node => {
    const key = ts.isGetAccessorDeclaration(inner) ? getKey(inner.name) : undefined;
    if (key !== undefined) keys.add(key);
    if (
      ts.isCallExpression(inner) &&
      ts.isPropertyAccessExpression(inner.expression) &&
      inner.expression.name.text === "defineProperty"
    ) {
      const defined = inner.arguments.at(1);
      const attributes = inner.arguments.at(2);
      const definedKey =
        defined === undefined
          ? undefined
          : ts.isNumericLiteral(defined)
            ? String(Number(defined.text))
            : ts.isStringLiteral(defined)
              ? defined.text
              : undefined;
      if (
        definedKey !== undefined &&
        attributes !== undefined &&
        ts.isObjectLiteralExpression(attributes) &&
        attributes.properties.some(
          (property) => property.name !== undefined && getKey(property.name) === "get",
        )
      ) {
        keys.add(definedKey);
      }
    }
    return false;
  });
  getterKeys.set(file, keys);
  return keys;
};

// An Object.defineProperty whose descriptor may hold a getter that the script defines under one of
// its fields, which the statement reads field by field, so that the getters run.
export const isDescriptorRead = (node: ts.Node, context: Context): node is ts.CallExpression =>
  context.heap !== undefined &&
  ts.isCallExpression(node) &&
  ts.isPropertyAccessExpression(node.expression) &&
  node.expression.expression.getText() === "Object" &&
  node.expression.name.text === "defineProperty" &&
  node.arguments.length >= 3 &&
  DESCRIPTOR_FIELDS.some((key) => getGetterKeys(node).has(key)) &&
  getFieldGetters(node, context).every((getter) => isRunnableGetter(getter, context));

// The getters that reading a descriptor's fields may run.
const getFieldGetters = (node: ts.Node, context: Context) => [
  ...new Set(DESCRIPTOR_FIELDS.flatMap((key) => getKeyGetters(node, key, context))),
];

// Whether tla-ts can run a getter's body, which makes each function expression it returns as an
// object. A statement that might run one it can't keeps reading properties as an expression,
// which stops only where the getter runs.
const isRunnableGetter = (getter: FunctionNode, context: Context) =>
  findNodes(getter, ts.isReturnStatement).every(
    (statement) =>
      statement.expression === undefined ||
      !ts.isFunctionExpression(statement.expression) ||
      isNestedFunction(statement.expression, context),
  );

// The getters that reading an array-like object's elements may run, where the script defines one
// under an index and tla-ts can run each of them, or undefined.
export const getElementGetters = (node: ts.Node, context: Context) => {
  const getters = getAccessorFunctions(node, "get", context);
  return [...getGetterKeys(node)].some((key) => /^(0|[1-9][0-9]*)$/.test(key)) &&
    getters.length > 0 &&
    getters.every((getter) => isRunnableGetter(getter, context))
    ? getters
    : undefined;
};

export const getDescriptorGetters = (node: ts.Node, context: Context) =>
  isDescriptorRead(node, context)
    ? getFieldGetters(node, context)
    : isDescriptorsRead(node, context)
      ? [...new Set([...getFieldGetters(node, context), ...getReadGetters(node, context)])]
      : [];

// Names the heap that a change gives, for what follows it.
const withHeap = (path: Path, heap: Expression, context: Context): Path => {
  const symbol = context.heap;
  return symbol === undefined
    ? path
    : {
        ...path,
        scope: { ...path.scope, bindings: new Map([...path.scope.bindings, [symbol, heap]]) },
      };
};

const isObjectArgument = (value: Expression, context: Context) =>
  useJavaScript("IsObjectArgument", [value], context);

// ToPropertyDescriptor, which reads each field of a descriptor object that it has, running its
// getter, throws a TypeError at a get or set that isn't callable before it reads the rest, and
// throws one at the end where the descriptor mixes an accessor's fields with a value's.
const readFields = (
  site: ts.CallExpression,
  attributes: Expression,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, descriptor: Expression) => Formula,
): Formula => {
  const readFrom = (
    current: Path,
    index: number,
    fields: { has: Expression; value: Expression }[],
  ): Formula => {
    const heap = getHeap(current.scope, site, context);
    const property = DESCRIPTOR_FIELDS[index];
    if (property === undefined) {
      const toRecord = (pick: (read: { has: Expression; value: Expression }) => Expression) =>
        record(
          "Record",
          fields.map((read, position) => ({
            name: DESCRIPTOR_FIELDS[position],
            value: pick(read),
          })),
        );
      return bind(
        current,
        "descriptor",
        useJavaScript(
          "ReadDescriptor",
          [heap, toRecord((read) => read.has), toRecord((read) => read.value)],
          context,
        ),
        context,
        (bound, descriptor) =>
          ifThenElse(
            field(descriptor, "isValid"),
            continueWith(bound, descriptor),
            throwTypeError(bound, site, context, frame),
          ),
      );
    }
    return bind(
      current,
      "has",
      useJavaScript("Has", [heap, attributes, string(property)], context),
      context,
      (bound, has) =>
        translateJoined(
          site,
          bound,
          context,
          (after, value) => {
            const read = value ?? getUndefined(context);
            const next = readFrom(after, index + 1, [...fields, { has, value: read }]);
            return property === "get" || property === "set"
              ? ifThenElse(
                  junction("Or", [
                    not(has),
                    apply("=", [read, getUndefined(context)]),
                    apply("=", [
                      useJavaScript(
                        "TypeOfIn",
                        [getHeap(after.scope, site, context), read],
                        context,
                      ),
                      string("function"),
                    ]),
                  ]),
                  next,
                  throwTypeError(after, site, context, frame),
                )
              : next;
          },
          (next) =>
            ifThenElse(
              has,
              read(site, attributes, property, bound, context, frame, next),
              next(bound, getUndefined(context)),
            ),
        ),
    );
  };
  return ifThenElse(
    isObjectArgument(attributes, context),
    readFrom(path, 0, []),
    throwTypeError(path, site, context, frame),
  );
};

// Defines the keys with the descriptors that the statement read, which throws the TypeError or the
// RangeError of a definition that fails.
const define = (
  site: ts.CallExpression,
  target: Expression,
  keys: Expression,
  descriptors: Expression,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path) => Formula,
) =>
  bind(
    path,
    "change",
    useJavaScript(
      "DefineConvertedAll",
      [getHeap(path.scope, site, context), target, keys, descriptors],
      context,
    ),
    context,
    (bound, change) => {
      const after = withHeap(bound, field(change, "heap"), context);
      return ifThenElse(
        field(change, "isDone"),
        continueWith(after),
        ifThenElse(
          field(change, "isRangeError"),
          throwError("RangeError", after, site, context, frame),
          throwTypeError(after, site, context, frame),
        ),
      );
    },
  );

// Object.defineProperty, which checks that its target is an object, and then reads its
// descriptor's fields.
export const readDescriptor = (
  site: ts.CallExpression,
  values: readonly Expression[],
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value: Expression) => Formula,
): Formula =>
  ifThenElse(
    isObjectArgument(values[0], context),
    readFields(site, values[2], path, context, frame, (after, descriptor) =>
      define(
        site,
        values[0],
        tuple([values[1]]),
        tuple([descriptor]),
        after,
        context,
        frame,
        (defined) => continueWith(defined, values[0]),
      ),
    ),
    throwTypeError(path, site, context, frame),
  );

// The keys of an object literal that a definition takes, in the order that JavaScript lists them,
// where each is a name that isn't an index.
const getLiteralKeys = (node: ts.Expression | undefined) => {
  if (node === undefined || !ts.isObjectLiteralExpression(node)) return undefined;
  const keys = node.properties.map((property) =>
    ts.isPropertyAssignment(property) &&
    (ts.isIdentifier(property.name) || ts.isStringLiteral(property.name)) &&
    !/^(0|[1-9][0-9]*)$/.test(property.name.text)
      ? property.name.text
      : undefined,
  );
  return keys.every((key) => key !== undefined) && new Set(keys).size === keys.length
    ? keys.filter((key) => key !== undefined)
    : undefined;
};

// The most keys that tla-ts reads descriptors of where it lists an object's keys as it runs.
const KEYS_LIMIT = 4;

// Object.defineProperties or Object.create, which reads the descriptor under each enumerable own
// key in turn, running its getter, reads each descriptor's fields, and then defines them all.
// Object.create makes its object first, and gives it. An object literal gives its keys as it's
// written, and otherwise the statement lists them as it runs and reads at most a few.
export const readDescriptors = (
  site: ts.CallExpression,
  values: readonly Expression[],
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value: Expression) => Formula,
): Formula => {
  const literalKeys = getLiteralKeys(site.arguments[1]);
  const properties = values[1];
  const readLiteral = (
    current: Path,
    target: Expression,
    index: number,
    descriptors: readonly Expression[],
  ): Formula => {
    const key = literalKeys?.[index];
    if (key === undefined) {
      return define(
        site,
        target,
        tuple((literalKeys ?? []).map(string)),
        tuple([...descriptors]),
        current,
        context,
        frame,
        (after) => continueWith(after, target),
      );
    }
    return bind(
      current,
      "attributes",
      useJavaScript(
        "Get",
        [getHeap(current.scope, site, context), properties, string(key)],
        context,
      ),
      context,
      (bound, attributes) =>
        readFields(site, attributes, bound, context, frame, (after, descriptor) =>
          readLiteral(after, target, index + 1, [...descriptors, descriptor]),
        ),
    );
  };
  // The keys and descriptors that the statement read so far, as a pair that each join passes on.
  const readListed = (
    current: Path,
    target: Expression,
    keys: Expression,
    position: number,
    read: Expression,
  ): Formula => {
    if (position > KEYS_LIMIT) {
      return ifThenElse(
        apply("<=", [apply("Len", [keys]), number(KEYS_LIMIT)]),
        define(
          site,
          target,
          index(read, [number(1)]),
          index(read, [number(2)]),
          current,
          context,
          frame,
          (after) => continueWith(after, target),
        ),
        leaf(
          apply("Assert", [
            boolean(false),
            string(`tla-ts can't read the descriptors of more than ${KEYS_LIMIT} keys`),
          ]),
        ),
      );
    }
    const heap = getHeap(current.scope, site, context);
    const key = index(keys, [number(position)]);
    return translateJoined(
      site,
      current,
      context,
      (after, value) => readListed(after, target, keys, position + 1, value ?? read),
      (next) =>
        ifThenElse(
          junction("And", [
            apply("<=", [number(position), apply("Len", [keys])]),
            useJavaScript("IsEnumerableOwn", [heap, properties, key], context),
          ]),
          readWith(
            site,
            properties,
            key,
            getReadGetters(site, context),
            current,
            context,
            frame,
            (got, attributes) =>
              readFields(site, attributes, got, context, frame, (after, descriptor) =>
                next(
                  after,
                  tuple([
                    apply("Append", [index(read, [number(1)]), key]),
                    apply("Append", [index(read, [number(2)]), descriptor]),
                  ]),
                ),
              ),
          ),
          next(current, read),
        ),
    );
  };
  const readAll = (current: Path, target: Expression): Formula =>
    literalKeys !== undefined
      ? readLiteral(current, target, 0, [])
      : ifThenElse(
          isObjectArgument(properties, context),
          bind(
            current,
            "keys",
            useJavaScript(
              "PropertyKeysOf",
              [getHeap(current.scope, site, context), properties],
              context,
            ),
            context,
            (bound, keys) => readListed(bound, target, keys, 1, tuple([tuple([]), tuple([])])),
          ),
          leaf(
            apply("Assert", [
              boolean(false),
              string("tla-ts can't read descriptors of this value"),
            ]),
          ),
        );
  if (getCallName(site) === "defineProperties") {
    return ifThenElse(
      isObjectArgument(values[0], context),
      readAll(path, values[0]),
      throwTypeError(path, site, context, frame),
    );
  }
  const prototype = values[0];
  return ifThenElse(
    junction("Or", [
      apply("=", [prototype, identifier("Null")]),
      isObjectArgument(prototype, context),
    ]),
    bind(
      path,
      "heap",
      useJavaScript(
        "Allocate",
        [
          getHeap(path.scope, site, context),
          useJavaScript("WithPrototype", [identifier("EmptyObject"), prototype], context),
        ],
        context,
      ),
      context,
      (bound, heap) =>
        readAll(withHeap(bound, heap, context), useJavaScript("Allocated", [heap], context)),
    ),
    throwTypeError(path, site, context, frame),
  );
};

const getCallName = (node: ts.CallExpression) =>
  ts.isPropertyAccessExpression(node.expression) ? node.expression.name.text : undefined;

// Object.defineProperties or Object.create of an object literal of descriptors whose fields may
// hold a getter that the script defines.
export const isDescriptorsRead = (node: ts.Node, context: Context) =>
  context.heap !== undefined &&
  ts.isCallExpression(node) &&
  ts.isPropertyAccessExpression(node.expression) &&
  node.expression.expression.getText() === "Object" &&
  (getCallName(node) === "defineProperties" || getCallName(node) === "create") &&
  node.arguments.length >= 2 &&
  !node.arguments.some(ts.isSpreadElement) &&
  (getLiteralKeys(node.arguments[1]) !== undefined
    ? DESCRIPTOR_FIELDS.some((key) => getGetterKeys(node).has(key))
    : getReadGetters(node, context).some(
        (getter) => !getGetters(node, context).includes(getter),
      )) &&
  [...getFieldGetters(node, context), ...getReadGetters(node, context)].every((getter) =>
    isRunnableGetter(getter, context),
  );

// The getters that a read may run where the script defines a getter under its key: the functions
// that descriptors give as getters, and the function objects that functions return.
const getReadGetters = (node: ts.Node, context: Context) => [
  ...new Set([
    ...getAccessorFunctions(node, "get", context),
    ...getReturnedFunctions(node, context),
  ]),
];

// Whether an access writes, deletes, or calls what it names, rather than only reading it.
const isWritten = (node: ts.Expression) => {
  const parent = node.parent;
  return (
    (ts.isBinaryExpression(parent) &&
      parent.left === node &&
      parent.operatorToken.kind >= ts.SyntaxKind.FirstAssignment &&
      parent.operatorToken.kind <= ts.SyntaxKind.LastAssignment) ||
    (ts.isCallExpression(parent) && parent.expression === node) ||
    ts.isDeleteExpression(parent) ||
    ((ts.isPrefixUnaryExpression(parent) || ts.isPostfixUnaryExpression(parent)) &&
      (parent.operator === ts.SyntaxKind.PlusPlusToken ||
        parent.operator === ts.SyntaxKind.MinusMinusToken))
  );
};

// A read of a key that the script defines a getter under, on an object, where a getter that may
// run changes something, so that the read runs as a statement. A read that a pure getter answers
// runs as an expression.
export const isGetterRead = (
  node: ts.Node,
  context: Context,
): node is ts.PropertyAccessExpression | ts.ElementAccessExpression => {
  if (
    context.heap === undefined ||
    !(ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node))
  ) {
    return false;
  }
  const key = getAccessKey(node);
  if (key === undefined || isWritten(node) || !getGetterKeys(node).has(key)) return false;
  if (getKind(node.expression, context) !== "object") return false;
  const pure = getGetters(node, context);
  const getters = getReadGetters(node, context);
  return (
    getters.some((getter) => !pure.includes(getter)) &&
    getters.every((getter) => isRunnableGetter(getter, context))
  );
};

// Runs a read that a getter may answer, which evaluates the object and then runs the getter that
// it holds, of those that the script defines.
export const runGetterRead = (
  node: ts.PropertyAccessExpression | ts.ElementAccessExpression,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value: Expression) => Formula,
): Formula =>
  allocate(node, path, context, (allocated) =>
    bind(
      allocated,
      "object",
      translateObjectValue(node.expression, allocated.scope, context),
      context,
      (bound, object) =>
        readWith(
          node,
          object,
          string(getAccessKey(node) ?? ""),
          getReadGetters(node, context),
          bound,
          context,
          frame,
          continueWith,
        ),
    ),
  );

export const getReadFunctions = (node: ts.Node, context: Context) => {
  const trap = getProxyOperation(node, context)?.trap;
  const rest = ts.isObjectBindingPattern(node) ? getRestGetter(node, context) : undefined;
  const patternKeys = ts.isObjectBindingPattern(node)
    ? [
        ...getGetterElements(node, context).flatMap((element) => getElementKey(element) ?? []),
        ...(rest === undefined ? [] : [rest.key]),
      ]
    : [];
  return [
    ...(isGetterRead(node, context) ? getReadGetters(node, context) : []),
    ...(trap === undefined ? [] : getMethods(node, trap, context)),
    ...patternKeys.flatMap((key) => getKeyGetters(node, key, context)),
  ];
};

interface ProxyOperation {
  trap:
    | "get"
    | "has"
    | "set"
    | "deleteProperty"
    | "getOwnPropertyDescriptor"
    | "defineProperty"
    | "getPrototypeOf"
    | "setPrototypeOf"
    | "isExtensible"
    | "preventExtensions"
    | "ownKeys"
    | "apply"
    | "construct";
  object: ts.Expression;
  key: string | undefined;
  value?: ts.Expression;
  // The arguments of a call or a new, and the object that a call reads its function from.
  arguments?: readonly ts.Expression[];
  receiver?: ts.Expression;
  // The function of Object or Reflect that runs it.
  method?: string;
  // Whether Reflect runs it, which gives whether it succeeded rather than throwing a TypeError.
  isReflected: boolean;
}

const getLiteralKey = (node: ts.Expression | undefined) =>
  node !== undefined && (ts.isStringLiteralLike(node) || ts.isNumericLiteral(node))
    ? String(ts.isNumericLiteral(node) ? Number(node.text) : node.text)
    : undefined;

// The functions of Object and Reflect that run a proxy's internal methods, with the trap that each
// runs and how many arguments it takes.
const TRAP_CALLS = new Map([
  ["Reflect.get", { trap: "get", arity: 2 }],
  ["Reflect.has", { trap: "has", arity: 2 }],
  ["Reflect.set", { trap: "set", arity: 3 }],
  ["Reflect.deleteProperty", { trap: "deleteProperty", arity: 2 }],
  ["Reflect.getOwnPropertyDescriptor", { trap: "getOwnPropertyDescriptor", arity: 2 }],
  ["Object.getOwnPropertyDescriptor", { trap: "getOwnPropertyDescriptor", arity: 2 }],
  ["Reflect.defineProperty", { trap: "defineProperty", arity: 3 }],
  ["Object.defineProperty", { trap: "defineProperty", arity: 3 }],
  ["Reflect.getPrototypeOf", { trap: "getPrototypeOf", arity: 1 }],
  ["Object.getPrototypeOf", { trap: "getPrototypeOf", arity: 1 }],
  ["Reflect.setPrototypeOf", { trap: "setPrototypeOf", arity: 2 }],
  ["Object.setPrototypeOf", { trap: "setPrototypeOf", arity: 2 }],
  ["Reflect.isExtensible", { trap: "isExtensible", arity: 1 }],
  ["Object.isExtensible", { trap: "isExtensible", arity: 1 }],
  ["Reflect.preventExtensions", { trap: "preventExtensions", arity: 1 }],
  ["Object.preventExtensions", { trap: "preventExtensions", arity: 1 }],
  ["Reflect.ownKeys", { trap: "ownKeys", arity: 1 }],
  ["Object.keys", { trap: "ownKeys", arity: 1 }],
  ["Object.getOwnPropertyNames", { trap: "ownKeys", arity: 1 }],
  ["Object.getOwnPropertySymbols", { trap: "ownKeys", arity: 1 }],
] as const);

// The traps that take a key, which the script must write.
const KEYED_TRAPS = new Set([
  "get",
  "has",
  "set",
  "deleteProperty",
  "getOwnPropertyDescriptor",
  "defineProperty",
]);

const getOperation = (node: ts.Node, context: Context): ProxyOperation | undefined => {
  if (
    (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) &&
    !isWritten(node)
  ) {
    return { trap: "get", object: node.expression, key: getAccessKey(node), isReflected: false };
  }
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.InKeyword) {
    return { trap: "has", object: node.right, key: getLiteralKey(node.left), isReflected: false };
  }
  if (
    ts.isBinaryExpression(node) &&
    node.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
    (ts.isPropertyAccessExpression(node.left) || ts.isElementAccessExpression(node.left))
  ) {
    const key = getAccessKey(node.left);
    return {
      trap: "set",
      object: node.left.expression,
      key,
      value: node.right,
      isReflected: false,
    };
  }
  if (
    ts.isDeleteExpression(node) &&
    (ts.isPropertyAccessExpression(node.expression) ||
      ts.isElementAccessExpression(node.expression))
  ) {
    const key = getAccessKey(node.expression);
    return { trap: "deleteProperty", object: node.expression.expression, key, isReflected: false };
  }
  if (
    (ts.isNewExpression(node) || ts.isCallExpression(node)) &&
    !(node.arguments ?? []).some(ts.isSpreadElement)
  ) {
    const callee = skipCasts(node.expression);
    if (ts.isNewExpression(node) || isProxyValue(callee, context)) {
      return {
        trap: ts.isNewExpression(node) ? "construct" : "apply",
        object: callee,
        key: undefined,
        arguments: node.arguments ?? [],
        receiver:
          ts.isPropertyAccessExpression(callee) || ts.isElementAccessExpression(callee)
            ? callee.expression
            : undefined,
        isReflected: false,
      };
    }
  }
  if (!isMethodCall(node)) return undefined;
  const global = getBuiltIn(node.expression.expression, context);
  const method = node.expression.name.text;
  const call = [...TRAP_CALLS].find((entry) => entry[0] === `${global}.${method}`)?.[1];
  const values = node.arguments;
  if (call === undefined || values.length !== call.arity || values.some(ts.isSpreadElement)) {
    return undefined;
  }
  const isKeyed = KEYED_TRAPS.has(call.trap);
  return {
    trap: call.trap,
    object: values[0],
    key: isKeyed ? getLiteralKey(values[1]) : undefined,
    value: values.at(isKeyed ? 2 : 1),
    method,
    isReflected: global === "Reflect",
  };
};

// An operation on a proxy that the script makes, which runs a trap, so a statement runs it: a
// read, an in, an assignment, or a delete of a key that the script writes, or a function of Object
// or Reflect that runs an internal method.
const getProxyOperation = (node: ts.Node, context: Context) => {
  const operation = context.heap === undefined ? undefined : getOperation(node, context);
  return operation !== undefined &&
    (operation.key !== undefined || !KEYED_TRAPS.has(operation.trap)) &&
    isProxyValue(operation.object, context)
    ? operation
    : undefined;
};

export const isProxyOperation = (node: ts.Node, context: Context): node is ts.Expression =>
  getProxyOperation(node, context) !== undefined;

// Runs a proxy's internal method, as ECMAScript's proxy objects do: the handler's trap, called
// with the target and the values, where the handler has one, or else what forward does with the
// target. A revoked proxy, or a trap that isn't a function, throws a TypeError.
const runTrap = (
  site: ts.Node,
  proxy: Expression,
  trap: string,
  values: Expression[],
  path: Path,
  context: Context,
  frame: Frame,
  forward: (path: Path, target: Expression, handler: Expression) => Formula,
  check: (path: Path, target: Expression, result: Expression, handler: Expression) => Formula,
) => {
  const heap = getHeap(path.scope, site, context);
  return bind(
    path,
    "handler",
    useJavaScript("ProxyHandler", [heap, proxy], context),
    context,
    (withHandler, handler) =>
      ifThenElse(
        apply("=", [handler, identifier("Null")]),
        throwTypeError(withHandler, site, context, frame),
        bind(
          withHandler,
          "target",
          useJavaScript("ProxyTarget", [heap, proxy], context),
          context,
          (withTarget, target) =>
            bind(
              withTarget,
              "trap",
              useJavaScript("Get", [heap, handler, string(trap)], context),
              context,
              (withTrap, method) =>
                ifThenElse(
                  isNullish(method, context),
                  forward(withTrap, target, handler),
                  callValue(
                    site,
                    getMethods(site, trap, context),
                    method,
                    handler,
                    [target, ...values],
                    withTrap,
                    context,
                    frame,
                    () =>
                      ifThenElse(
                        apply("=", [
                          useJavaScript("TypeOfIn", [heap, method], context),
                          string("function"),
                        ]),
                        leaf(
                          apply("Assert", [
                            boolean(false),
                            string("tla-ts can't tell which function this trap calls"),
                          ]),
                        ),
                        throwTypeError(withTrap, site, context, frame),
                      ),
                    (after, result) => check(after, target, result, handler),
                  ),
                ),
            ),
        ),
      ),
  );
};

// Runs an operation on a value that may be a proxy. A proxy runs its trap, and throws a TypeError
// where what the trap gives disagrees with what the target can't change. A change that fails
// throws a TypeError, as scripts run in strict mode, where Reflect's gives false.
export const runProxyOperation = (
  node: ts.Expression,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value: Expression) => Formula,
): Formula => {
  const operation = getProxyOperation(node, context);
  if (operation === undefined) throw new TlaTypeScriptError("Unsupported proxy operation", node);
  const trap = operation.trap;
  const key = string(operation.key ?? "");
  const method = string(operation.method ?? "");
  const javaScript = (name: string, values: Expression[]) => useJavaScript(name, values, context);
  // Evaluates the value that the operation takes, or the arguments of a call or a new, in order.
  const evaluate = (
    path: Path,
    expressions: readonly ts.Expression[],
    values: Expression[],
    then: (path: Path, values: Expression[]) => Formula,
  ): Formula =>
    expressions.length === 0
      ? then(path, values)
      : bind(
          path,
          "value",
          translateExpression(expressions[0], path.scope, context),
          context,
          (bound, value) => evaluate(bound, expressions.slice(1), [...values, value], then),
        );
  const run = (
    path: Path,
    proxy: Expression,
    value: Expression,
    next: (path: Path, value?: Expression) => Formula,
  ) => {
    const throwWith = (after: Path) => throwTypeError(after, node, context, frame);
    // What a change gives where it succeeds: the value that an assignment writes, the proxy that
    // Object's functions give, or true.
    const succeed = (after: Path) =>
      next(
        after,
        operation.isReflected || trap === "deleteProperty"
          ? boolean(true)
          : trap === "set"
            ? value
            : proxy,
      );
    const fail = (after: Path) =>
      operation.isReflected ? next(after, boolean(false)) : throwWith(after);
    // Gives an object that the operation makes, such as a descriptor.
    const give = (after: Path, object: Expression) =>
      bind(
        after,
        "heap",
        javaScript("Allocate", [getHeap(after.scope, node, context), object]),
        context,
        (bound, allocated) =>
          next(withHeap(bound, allocated, context), javaScript("Allocated", [allocated])),
      );
    // Object.keys asks the proxy which keys are enumerable, which runs a getOwnPropertyDescriptor
    // trap that tla-ts follows only where the handler has none.
    const giveKeys = (after: Path, target: Expression, handler: Expression, keys: Expression) => {
      const heap = getHeap(after.scope, node, context);
      const described = javaScript("ForwardTarget", [
        heap,
        target,
        string("getOwnPropertyDescriptor"),
      ]);
      const given = next(after, javaScript("ProxyKeysOf", [heap, described, keys, method]));
      return operation.method !== "keys"
        ? given
        : ifThenElse(
            isNullish(
              javaScript("Get", [heap, handler, string("getOwnPropertyDescriptor")]),
              context,
            ),
            given,
            leaf(
              apply("Assert", [
                boolean(false),
                string("tla-ts can't run the getOwnPropertyDescriptor trap that Object.keys runs"),
              ]),
            ),
          );
    };
    const runWith = (path: Path, values: Expression[], descriptor: Expression) => {
      const heap = getHeap(path.scope, node, context);
      const check = (after: Path, target: Expression, result: Expression, handler: Expression) => {
        const changed = getHeap(after.scope, node, context);
        const agreeing = (isAgreed: Expression, then: Formula) =>
          ifThenElse(isAgreed, then, throwWith(after));
        if (trap === "get") {
          return agreeing(
            javaScript("ProxyAgrees", [changed, target, key, result, string("get")]),
            next(after, result),
          );
        }
        if (trap === "apply") return next(after, result);
        if (trap === "construct") {
          return agreeing(javaScript("IsObjectIn", [changed, result]), next(after, result));
        }
        if (trap === "getOwnPropertyDescriptor") {
          return agreeing(
            javaScript("ProxyDescriptorAgrees", [changed, target, key, result]),
            ifThenElse(
              apply("=", [result, getUndefined(context)]),
              next(after, result),
              give(after, javaScript("ProxyDescriptor", [changed, result])),
            ),
          );
        }
        if (trap === "getPrototypeOf") {
          return agreeing(
            apply("/\\", [
              apply("\\/", [
                apply("=", [result, identifier("Null")]),
                javaScript("IsObjectIn", [changed, result]),
              ]),
              javaScript("ProxyPrototypeAgrees", [changed, target, result]),
            ]),
            next(after, result),
          );
        }
        if (trap === "ownKeys") {
          return agreeing(
            javaScript("IsObjectIn", [changed, result]),
            bind(
              after,
              "keys",
              javaScript("ProxyKeys", [changed, result]),
              context,
              (listed, keys) =>
                ifThenElse(
                  javaScript("ProxyKeysAgree", [changed, target, keys]),
                  giveKeys(listed, target, handler, keys),
                  throwWith(listed),
                ),
            ),
          );
        }
        return bind(
          after,
          "result",
          javaScript("ToBoolean", [result]),
          context,
          (checked, isDone) => {
            if (trap === "has") {
              return ifThenElse(
                apply("\\/", [isDone, javaScript("ProxyCanLack", [changed, target, key])]),
                next(checked, isDone),
                throwWith(checked),
              );
            }
            if (trap === "isExtensible") {
              return ifThenElse(
                apply("=", [isDone, javaScript("IsExtensible", [changed, target])]),
                next(checked, isDone),
                throwWith(checked),
              );
            }
            const agrees =
              trap === "set"
                ? javaScript("ProxyAgrees", [changed, target, key, value, string("set")])
                : trap === "deleteProperty"
                  ? javaScript("ProxyCanLack", [changed, target, key])
                  : trap === "defineProperty"
                    ? javaScript("ProxyDefinitionAgrees", [changed, target, key, descriptor])
                    : trap === "setPrototypeOf"
                      ? javaScript("ProxyPrototypeAgrees", [changed, target, value])
                      : not(javaScript("IsExtensible", [changed, target]));
            return ifThenElse(
              isDone,
              ifThenElse(agrees, succeed(checked), throwWith(checked)),
              fail(checked),
            );
          },
        );
      };
      // What the target does where the handler has no trap. A set reads and defines the proxy's
      // own property, which tla-ts follows only where the handler can't trap those either.
      const forward = (after: Path, target: Expression, handler: Expression) => {
        // What reads the target goes on through proxy targets that have no trap for it.
        const forwarded = (name: string) =>
          javaScript("ForwardTarget", [heap, target, string(name)]);
        if (trap === "apply" || trap === "construct") {
          return leaf(
            apply("Assert", [boolean(false), string("tla-ts can't call the target of a proxy")]),
          );
        }
        if (trap === "get" || trap === "has") {
          return next(
            after,
            javaScript(trap === "get" ? "Get" : "Has", [heap, forwarded(trap), key]),
          );
        }
        if (trap === "getOwnPropertyDescriptor") {
          return ifThenElse(
            javaScript("HasOwn", [heap, forwarded(trap), key]),
            give(after, javaScript("Describe", [heap, forwarded(trap), key])),
            next(after, getUndefined(context)),
          );
        }
        if (trap === "getPrototypeOf" || trap === "isExtensible") {
          return next(
            after,
            javaScript(trap === "getPrototypeOf" ? "Prototype" : "IsExtensible", [
              heap,
              forwarded(trap),
            ]),
          );
        }
        if (trap === "ownKeys") {
          return giveKeys(
            after,
            target,
            handler,
            javaScript("PropertyKeysOf", [heap, forwarded(trap)]),
          );
        }
        if (trap === "preventExtensions") {
          return bind(
            after,
            "heap",
            javaScript("PreventExtensions", [heap, target]),
            context,
            (bound, changed) => succeed(withHeap(bound, changed, context)),
          );
        }
        if (trap === "defineProperty" || trap === "setPrototypeOf") {
          return bind(
            after,
            "change",
            trap === "defineProperty"
              ? javaScript("DefineConverted", [heap, target, key, descriptor])
              : javaScript("SetPrototypeOf", [heap, target, value]),
            context,
            (bound, change) =>
              ifThenElse(
                field(change, "isRangeError"),
                throwError("RangeError", bound, node, context, frame),
                ifThenElse(
                  field(change, "isDone"),
                  succeed(withHeap(bound, field(change, "heap"), context)),
                  fail(bound),
                ),
              ),
          );
        }
        const change = (canChange: string, changed: Expression) =>
          ifThenElse(
            javaScript(canChange, [heap, target, key]),
            bind(after, "heap", changed, context, (bound, written) =>
              succeed(withHeap(bound, written, context)),
            ),
            fail(after),
          );
        if (trap === "deleteProperty") {
          return change("CanDelete", javaScript("Delete", [heap, target, key]));
        }
        return ifThenElse(
          apply("/\\", [
            isNullish(
              javaScript("Get", [heap, handler, string("getOwnPropertyDescriptor")]),
              context,
            ),
            isNullish(javaScript("Get", [heap, handler, string("defineProperty")]), context),
          ]),
          change("CanPut", javaScript("SetProperty", [heap, target, key, value])),
          leaf(
            apply("Assert", [
              boolean(false),
              string("tla-ts can't run the traps that a set through a proxy runs"),
            ]),
          ),
        );
      };
      return runTrap(node, proxy, trap, values, path, context, frame, forward, check);
    };
    const heap = getHeap(path.scope, node, context);
    // Object.defineProperty converts the descriptor first, and gives the trap a copy of it.
    const trapped =
      trap === "defineProperty"
        ? ifThenElse(
            javaScript("IsObjectIn", [heap, value]),
            bind(
              path,
              "descriptor",
              javaScript("ToDescriptor", [heap, value]),
              context,
              (converted, descriptor) =>
                ifThenElse(
                  field(descriptor, "isValid"),
                  bind(
                    converted,
                    "heap",
                    javaScript("Allocate", [heap, javaScript("DescriptorObject", [descriptor])]),
                    context,
                    (bound, allocated) =>
                      runWith(
                        withHeap(bound, allocated, context),
                        [key, javaScript("Allocated", [allocated])],
                        descriptor,
                      ),
                  ),
                  throwWith(converted),
                ),
            ),
            throwWith(path),
          )
        : trap === "apply" || trap === "construct"
          ? ifThenElse(
              trap === "apply"
                ? apply("=", [javaScript("TypeOfIn", [heap, proxy]), string("function")])
                : javaScript("IsConstructor", [heap, proxy]),
              runWith(
                path,
                trap === "apply"
                  ? [
                      operation.receiver === undefined
                        ? getUndefined(context)
                        : translateExpression(operation.receiver, path.scope, context),
                      value,
                    ]
                  : [value, proxy],
                getUndefined(context),
              ),
              throwWith(path),
            )
          : trap === "setPrototypeOf"
            ? ifThenElse(
                apply("\\/", [
                  apply("=", [value, identifier("Null")]),
                  javaScript("IsObjectIn", [heap, value]),
                ]),
                runWith(path, [value], getUndefined(context)),
                throwWith(path),
              )
            : runWith(
                path,
                trap === "get"
                  ? [key, proxy]
                  : trap === "set"
                    ? [key, value, proxy]
                    : KEYED_TRAPS.has(trap)
                      ? [key]
                      : [],
                getUndefined(context),
              );
    // A read or an in of a value that isn't a proxy reads it as JavaScript does elsewhere.
    const isPlain = !operation.isReflected && (trap === "get" || trap === "has");
    return ifThenElse(
      javaScript("IsProxy", [heap, proxy]),
      trapped,
      !isPlain
        ? leaf(
            apply("Assert", [
              boolean(false),
              string("tla-ts can't run this on a value that isn't the proxy it held"),
            ]),
          )
        : trap === "get" && isGetterRead(node, context)
          ? readWith(node, proxy, key, getReadGetters(node, context), path, context, frame, next)
          : next(path, translateExpression(node, path.scope, context)),
    );
  };
  return allocate(node, path, context, (allocated) =>
    translateJoined(
      node,
      allocated,
      context,
      (after, value) => continueWith(after, value ?? getUndefined(context)),
      (next) =>
        bind(
          allocated,
          "object",
          translateObjectValue(operation.object, allocated.scope, context),
          context,
          (bound, proxy) =>
            evaluate(
              bound,
              operation.arguments ?? (operation.value === undefined ? [] : [operation.value]),
              [],
              (valued, values) =>
                run(
                  valued,
                  proxy,
                  operation.arguments === undefined
                    ? (values[0] ?? getUndefined(context))
                    : tuple(values),
                  next,
                ),
            ),
        ),
    ),
  );
};
