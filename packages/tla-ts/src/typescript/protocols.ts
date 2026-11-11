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
  isNestedFunction,
  skipCasts,
} from "./context";
import { translateExpression } from "./expressions";
import { type Formula, ifThenElse, leaf } from "./formula";
import { getCandidateValue, getHeap, isProxyValue, translateObjectValue } from "./heap";
import { useJavaScript } from "./javascript";
import { getKind } from "./types";
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

// The fields that ToPropertyDescriptor reads, in the order it reads them.
const DESCRIPTOR_FIELDS = ["enumerable", "configurable", "value", "writable", "get", "set"];

const getterKeys = new WeakMap<ts.SourceFile, Set<string>>();

// The keys that a script defines getters under, in object literals and classes or with
// Object.defineProperty.
const getGetterKeys = (node: ts.Node) => {
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

export const getReadFunctions = (node: ts.Node, context: Context) => [
  ...(isGetterRead(node, context) ? getReadGetters(node, context) : []),
  ...(isProxyRead(node, context)
    ? getMethods(node, ts.isBinaryExpression(node) ? "has" : "get", context)
    : []),
];

// The key of a read or an in of a proxy that the script makes, which runs a trap, so a statement
// runs it.
const getProxyKey = (node: ts.Node, context: Context) => {
  if (context.heap === undefined) return undefined;
  if (ts.isBinaryExpression(node)) {
    const left = node.left;
    return node.operatorToken.kind === ts.SyntaxKind.InKeyword &&
      (ts.isStringLiteralLike(left) || ts.isNumericLiteral(left)) &&
      isProxyValue(node.right, context)
      ? String(ts.isNumericLiteral(left) ? Number(left.text) : left.text)
      : undefined;
  }
  return (ts.isPropertyAccessExpression(node) || ts.isElementAccessExpression(node)) &&
    !isWritten(node) &&
    isProxyValue(node.expression, context)
    ? getAccessKey(node)
    : undefined;
};

export const isProxyRead = (
  node: ts.Node,
  context: Context,
): node is ts.PropertyAccessExpression | ts.ElementAccessExpression | ts.BinaryExpression =>
  getProxyKey(node, context) !== undefined;

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
  forward: (path: Path, target: Expression) => Formula,
  check: (path: Path, target: Expression, result: Expression) => Formula,
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
                  forward(withTrap, target),
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
                    (after, result) => check(after, target, result),
                  ),
                ),
            ),
        ),
      ),
  );
};

// Runs a read or an in of a value that may be a proxy. A proxy runs its get or has trap, and
// throws a TypeError where what the trap gives disagrees with what the target can't change.
export const runProxyRead = (
  node: ts.PropertyAccessExpression | ts.ElementAccessExpression | ts.BinaryExpression,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value: Expression) => Formula,
): Formula => {
  const key = string(getProxyKey(node, context) ?? "");
  const isHas = ts.isBinaryExpression(node);
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
          translateObjectValue(isHas ? node.right : node.expression, allocated.scope, context),
          context,
          (bound, proxy) => {
            const heap = getHeap(bound.scope, node, context);
            const agrees = (after: Path, target: Expression, result: Expression) =>
              useJavaScript(
                isHas ? "ProxyCanLack" : "ProxyAgrees",
                [
                  getHeap(after.scope, node, context),
                  target,
                  key,
                  ...(isHas ? [] : [result, string("get")]),
                ],
                context,
              );
            return ifThenElse(
              useJavaScript("IsProxy", [heap, proxy], context),
              runTrap(
                node,
                proxy,
                isHas ? "has" : "get",
                isHas ? [key] : [key, proxy],
                bound,
                context,
                frame,
                (forwarded, target) =>
                  next(
                    forwarded,
                    useJavaScript(isHas ? "Has" : "Get", [heap, target, key], context),
                  ),
                (after, target, result) =>
                  bind(
                    after,
                    "result",
                    isHas ? useJavaScript("ToBoolean", [result], context) : result,
                    context,
                    (checked, value) =>
                      ifThenElse(
                        isHas
                          ? apply("\\/", [value, agrees(checked, target, value)])
                          : agrees(checked, target, value),
                        next(checked, value),
                        throwTypeError(checked, node, context, frame),
                      ),
                  ),
              ),
              !isHas && isGetterRead(node, context)
                ? readWith(
                    node,
                    proxy,
                    key,
                    getReadGetters(node, context),
                    bound,
                    context,
                    frame,
                    next,
                  )
                : next(bound, translateExpression(node, bound.scope, context)),
            );
          },
        ),
    ),
  );
};
