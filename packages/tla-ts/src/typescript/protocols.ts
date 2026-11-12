import ts from "@typescript/typescript6";
import type { Expression, OperatorDefinition } from "../ast";
import {
  allocate,
  bindOnce,
  getChanged,
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
  getSetters,
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
import { type Formula, ifThenElse, leaf, letIn, render } from "./formula";
import { getBuiltIn } from "./intrinsics";
import {
  getCandidateValue,
  getHeap,
  getIsConstructor,
  getProxyTarget,
  isProxyValue,
  translateObjectValue,
  translatePropertyKey,
} from "./heap";
import { translateAsyncCall } from "./promises";
import { useJavaScript } from "./javascript";
import type { Scope } from "./scope";
import { getKind, isHeapPattern } from "./types";
import {
  apply,
  boolean,
  call,
  define,
  field,
  identifier,
  index,
  junction,
  not,
  number,
  record,
  set,
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
    node.asteriskToken === undefined);

const isAsync = (node: FunctionNode) =>
  (ts.getCombinedModifierFlags(node) & ts.ModifierFlags.Async) !== 0;

// The function that a value is, where it's one that a protocol can run.
export const getFunctionCandidates = (value: ts.Expression, context: Context): FunctionNode[] => {
  const candidate = getCallee(skipCasts(value), context) ?? skipCasts(value);
  return isRunnable(candidate) ? [candidate] : [];
};

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
    const candidates = ts.isExpression(value)
      ? getFunctionCandidates(value, context)
      : isRunnable(value)
        ? [value]
        : [];
    if (role === undefined) return;
    candidates.forEach((candidate) => {
      const known = found.get(role) ?? [];
      if (!known.includes(candidate)) found.set(role, [...known, candidate]);
    });
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

// The methods that a script writes under a key, which are async only where the caller awaits
// what they give.
export const getMethods = (node: ts.Node, key: string, context: Context, isAwaited = false) =>
  getWrittenFunctions(node, key, context).filter(
    (candidate) => !ts.isGetAccessorDeclaration(candidate) && (isAwaited || !isAsync(candidate)),
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
        if (isAsync(candidate) && values.length > 0) {
          throw new TlaTypeScriptError("tla-ts can't pass arguments to this async function", site);
        }
        const received = ts.isArrowFunction(candidate)
          ? undefined
          : { value: receiver, method: candidate };
        return ifThenElse(
          apply("=", [
            useJavaScript("CodeOf", [getHeap(path.scope, site, context), value], context),
            candidateValue,
          ]),
          isAsync(candidate)
            ? translateAsyncCall(site, candidate, received, path, context, frame, next)
            : values.length === 0
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

// Writes a property, running the setter it holds where that's one of the candidates.
export const writeWith = (
  site: ts.Node,
  object: Expression,
  property: Expression,
  value: Expression,
  setters: readonly FunctionNode[],
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path) => Formula,
): Formula => {
  const put = (current: Path, next: (path: Path) => Formula) =>
    bind(
      current,
      "heap",
      useJavaScript(
        "SetProperty",
        [getHeap(current.scope, site, context), object, property, value],
        context,
      ),
      context,
      (written, heap) => next(withHeap(written, heap, context)),
    );
  if (setters.length === 0) return put(path, continueWith);
  return bind(
    path,
    "setter",
    useJavaScript("SetterOf", [getHeap(path.scope, site, context), object, property], context),
    context,
    (bound, setter) =>
      callValue(
        site,
        setters,
        setter,
        object,
        [value],
        bound,
        context,
        frame,
        (next) => put(bound, (after) => next(after)),
        (after) => continueWith(after),
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
  if (!isHeapPattern(type, pattern, context)) return [];
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

// An object pattern's rest element, with the keys that the script defines getters under that it
// may copy, where nothing that the pattern evaluates before the copy runs code.
const getRestGetter = (pattern: ts.BindingName, context: Context) => {
  if (!ts.isObjectBindingPattern(pattern) || context.heap === undefined) return undefined;
  const element = pattern.elements.at(-1);
  const others = pattern.elements.slice(0, -1);
  const type = context.checker.getNonNullableType(context.checker.getTypeAtLocation(pattern));
  if (
    element?.dotDotDotToken === undefined ||
    !isHeapPattern(type, pattern, context) ||
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
  return keys.length > 0 ? { element, keys } : undefined;
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
    // The rest copies a key's value, running its getter, where the object has it as its own
    // enumerable property. Where it has more than one of the keys, their getters run in an order
    // that tla-ts doesn't follow.
    if (element === undefined && rest !== undefined) {
      const isOwn = (key: string) =>
        useJavaScript(
          "IsEnumerableOwn",
          [getHeap(current.scope, rest.element, context), value, string(key)],
          context,
        );
      return rest.keys.reduceRight(
        (otherwise, key) => {
          const others = rest.keys.filter((other) => other !== key);
          const copy = read(rest.element, value, key, current, context, frame, (after, got) =>
            finish(after, [...values, apply(":>", [string(key), got])]),
          );
          return ifThenElse(
            isOwn(key),
            others.length === 0
              ? copy
              : ifThenElse(
                  junction("Or", others.map(isOwn)),
                  leaf(
                    apply("Assert", [
                      boolean(false),
                      string("tla-ts can't copy the properties of more than one getter in order"),
                    ]),
                  ),
                  copy,
                ),
            otherwise,
          );
        },
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
// Object.defineProperty and Object.defineProperties.
export const getGetterKeys = (node: ts.Node) => {
  const file = node.getSourceFile();
  const known = getterKeys.get(file);
  if (known !== undefined) return known;
  const keys = new Set<string>();
  const hasGetter = (attributes: ts.Node | undefined) =>
    attributes !== undefined &&
    ts.isObjectLiteralExpression(attributes) &&
    attributes.properties.some(
      (property) => property.name !== undefined && getKey(property.name) === "get",
    );
  findNodes(file, (inner): inner is ts.Node => {
    const key = ts.isGetAccessorDeclaration(inner) ? getKey(inner.name) : undefined;
    if (key !== undefined) keys.add(key);
    const definitions =
      ts.isCallExpression(inner) &&
      ts.isPropertyAccessExpression(inner.expression) &&
      inner.expression.name.text === "defineProperties"
        ? inner.arguments.at(1)
        : undefined;
    if (definitions !== undefined && ts.isObjectLiteralExpression(definitions)) {
      definitions.properties.forEach((property) => {
        const definedKey = property.name === undefined ? undefined : getKey(property.name);
        if (
          definedKey !== undefined &&
          ts.isPropertyAssignment(property) &&
          hasGetter(property.initializer)
        ) {
          keys.add(definedKey);
        }
      });
    }
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
      if (definedKey !== undefined && hasGetter(attributes)) keys.add(definedKey);
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

// The getters that reading a key may run, such as an array-like object's length, where the script
// defines one under that key and tla-ts can run each of them.
export const getDefinedGetters = (node: ts.Node, key: string, context: Context) => {
  const getters = getKeyGetters(node, key, context);
  return getGetterKeys(node).has(key) &&
    getters.every((getter) => isRunnableGetter(getter, context))
    ? getters
    : [];
};

export const getDescriptorGetters = (node: ts.Node, context: Context) =>
  isDescriptorRead(node, context)
    ? getFieldGetters(node, context)
    : isDescriptorsRead(node, context)
      ? [...new Set([...getFieldGetters(node, context), ...getReadGetters(node, context)])]
      : [];

// Names the heap that a change gives, for what follows it.
export const withHeap = (path: Path, heap: Expression, context: Context): Path => {
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
const defineAll = (
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
      defineAll(
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
      return defineAll(
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
        defineAll(
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

// The getters that the script defines under any key, which reading an object's values may run.
const getOwnValueGetters = (node: ts.Node, context: Context) => [
  ...new Set([...getGetterKeys(node)].flatMap((key) => getKeyGetters(node, key, context))),
];

// The getters that reading an object's values may run, and the setters that Object.assign may run
// as it writes them.
const getOwnValueFunctions = (node: ts.CallExpression, context: Context) => [
  ...getOwnValueGetters(node, context),
  ...(getCallName(node) === "assign" ? getSetters(node, context) : []),
];

// Object.values or Object.entries of an object, or Object.assign from one source, where a getter
// or setter that tla-ts can run may answer a key.
export const isOwnValuesRead = (node: ts.Node, context: Context) =>
  context.heap !== undefined &&
  ts.isCallExpression(node) &&
  ts.isPropertyAccessExpression(node.expression) &&
  node.expression.expression.getText() === "Object" &&
  (((getCallName(node) === "values" || getCallName(node) === "entries") &&
    node.arguments.length === 1) ||
    (getCallName(node) === "assign" && node.arguments.length === 2)) &&
  !node.arguments.some(ts.isSpreadElement) &&
  getOwnValueFunctions(node, context).length > 0 &&
  getOwnValueGetters(node, context).every((getter) => isRunnableGetter(getter, context));

export const getOwnValuesGetters = (node: ts.Node, context: Context) =>
  ts.isCallExpression(node) && isOwnValuesRead(node, context)
    ? getOwnValueFunctions(node, context)
    : [];

// Object.values, Object.entries, or Object.assign, which lists an object's own keys, and then
// reads each that is still an enumerable own property in turn, running its getter. values and
// entries read string keys and gather what they read, and assign reads symbols too and writes each
// value to its target before it reads the next. The statement reads at most a few keys.
export const readOwnValues = (
  site: ts.CallExpression,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value: Expression) => Formula,
): Formula => {
  const method = getCallName(site);
  const getters = getOwnValueGetters(site, context);
  const readFrom = (
    current: Path,
    target: Expression,
    object: Expression,
    keys: Expression,
    position: number,
    read: Expression,
  ): Formula => {
    if (position > KEYS_LIMIT) {
      return ifThenElse(
        apply("<=", [apply("Len", [keys]), number(KEYS_LIMIT)]),
        continueWith(current, method === "assign" ? target : read),
        leaf(
          apply("Assert", [
            boolean(false),
            string(`tla-ts can't read the values of more than ${KEYS_LIMIT} keys`),
          ]),
        ),
      );
    }
    const key = index(keys, [number(position)]);
    const gather = (
      after: Path,
      value: Expression,
      next: (inner: Path, read: Expression) => Formula,
    ) =>
      method === "assign"
        ? writeWith(
            site,
            target,
            key,
            value,
            getSetters(site, context),
            after,
            context,
            frame,
            (written) => next(written, read),
          )
        : next(after, apply("Append", [read, method === "entries" ? tuple([key, value]) : value]));
    return translateJoined(
      site,
      current,
      context,
      (after, value) => readFrom(after, target, object, keys, position + 1, value ?? read),
      (next) =>
        ifThenElse(
          junction("And", [
            apply("<=", [number(position), apply("Len", [keys])]),
            useJavaScript(
              "IsEnumerableOwn",
              [getHeap(current.scope, site, context), object, key],
              context,
            ),
          ]),
          readWith(site, object, key, getters, current, context, frame, (after, value) =>
            gather(after, value, next),
          ),
          next(current, read),
        ),
    );
  };
  const values = site.arguments.map((argument) =>
    method === "assign"
      ? translateObjectValue(argument, path.scope, context)
      : translateExpression(argument, path.scope, context),
  );
  const target = values[0];
  const object = values.at(-1) ?? target;
  return ifThenElse(
    junction(
      "And",
      values.map((value) => isObjectArgument(value, context)),
    ),
    bind(
      path,
      "keys",
      method === "assign"
        ? useJavaScript("PropertyKeysOf", [getHeap(path.scope, site, context), object], context)
        : useJavaScript(
            "OwnKeys",
            [useJavaScript("Lookup", [getHeap(path.scope, site, context), object], context)],
            context,
          ),
      context,
      (listed, keys) => readFrom(listed, target, object, keys, 1, tuple([])),
    ),
    method === "assign"
      ? leaf(
          apply("Assert", [
            boolean(false),
            string("tla-ts can't run getters as Object.assign copies from or to a primitive"),
          ]),
        )
      : continueWith(
          path,
          useJavaScript(
            method === "entries" ? "ObjectEntries" : "ObjectValues",
            [getHeap(path.scope, site, context), object],
            context,
          ),
        ),
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
        ...(rest === undefined ? [] : rest.keys),
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
    | "construct"
    // IsArray, which throws a TypeError for a revoked proxy, though no handler traps it.
    | "isArray";
  object: ts.Expression;
  key: string | undefined;
  value?: ts.Expression;
  // The arguments of a call or a new, and the object that a call reads its function from.
  arguments?: readonly ts.Expression[];
  receiver?: ts.Expression;
  // The function of Object or Reflect that runs it.
  method?: string;
  // The constructor that Reflect.construct gives a construct trap, where it isn't the proxy.
  newTarget?: ts.Expression;
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
  ["Object.seal", { trap: "preventExtensions", arity: 1 }],
  ["Object.freeze", { trap: "preventExtensions", arity: 1 }],
  ["Object.isSealed", { trap: "isExtensible", arity: 1 }],
  ["Object.isFrozen", { trap: "isExtensible", arity: 1 }],
  ["Reflect.ownKeys", { trap: "ownKeys", arity: 1 }],
  ["Object.keys", { trap: "ownKeys", arity: 1 }],
  ["Object.values", { trap: "ownKeys", arity: 1 }],
  ["Object.entries", { trap: "ownKeys", arity: 1 }],
  ["Object.getOwnPropertyNames", { trap: "ownKeys", arity: 1 }],
  ["Object.getOwnPropertySymbols", { trap: "ownKeys", arity: 1 }],
  ["Object.getOwnPropertyDescriptors", { trap: "ownKeys", arity: 1 }],
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

// A key or a value beside a spread, which reads nothing that can run code.
const isPlainOperand = (node: ts.Node): boolean =>
  ts.isIdentifier(node) ||
  ts.isStringLiteral(node) ||
  ts.isNumericLiteral(node) ||
  ts.isNoSubstitutionTemplateLiteral(node) ||
  node.kind === ts.SyntaxKind.TrueKeyword ||
  node.kind === ts.SyntaxKind.FalseKeyword ||
  node.kind === ts.SyntaxKind.NullKeyword ||
  (ts.isComputedPropertyName(node) && isPlainOperand(node.expression));

// The spread of an object literal whose other properties are plain keys and values.
const getSpread = (node: ts.ObjectLiteralExpression) => {
  const spreads = node.properties.filter(ts.isSpreadAssignment);
  const isPlain = node.properties.every(
    (property) =>
      ts.isSpreadAssignment(property) ||
      ts.isShorthandPropertyAssignment(property) ||
      (ts.isPropertyAssignment(property) &&
        isPlainOperand(property.name) &&
        isPlainOperand(property.initializer)),
  );
  return spreads.length === 1 && isPlain ? spreads[0] : undefined;
};

const getOperation = (node: ts.Node, context: Context): ProxyOperation | undefined => {
  // An object's spread beside plain properties, or a rest element alone in a declaration's
  // pattern, copies a proxy's enumerable keys to a new object.
  const parent = node.parent;
  const copied = ts.isObjectLiteralExpression(node)
    ? getSpread(node)?.expression
    : ts.isExpression(node) &&
        parent !== undefined &&
        ts.isVariableDeclaration(parent) &&
        parent.initializer === node &&
        ts.isObjectBindingPattern(parent.name) &&
        parent.name.elements.length === 1 &&
        parent.name.elements[0].dotDotDotToken !== undefined
      ? node
      : undefined;
  if (copied !== undefined) {
    return { trap: "ownKeys", object: copied, key: undefined, method: "copy", isReflected: false };
  }
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
  // Object.assign of one source, and Object.defineProperties, run the internal methods of their
  // second argument on each of its keys.
  if (
    global === "Object" &&
    (method === "assign" || method === "defineProperties") &&
    node.arguments.length === 2
  ) {
    return {
      trap: "ownKeys",
      object: node.arguments[1],
      key: undefined,
      value: node.arguments[0],
      method,
      isReflected: false,
    };
  }
  // Reflect.apply and Reflect.construct of an array that the script writes call or construct.
  const listed = node.arguments.at(method === "apply" ? 2 : 1);
  if (
    global === "Reflect" &&
    (method === "apply" || method === "construct") &&
    listed !== undefined &&
    ts.isArrayLiteralExpression(listed) &&
    !listed.elements.some(
      (element) => ts.isSpreadElement(element) || ts.isOmittedExpression(element),
    ) &&
    (method === "apply" ? node.arguments.length === 3 : node.arguments.length <= 3)
  ) {
    return {
      trap: method,
      object: node.arguments[0],
      key: undefined,
      arguments: listed.elements,
      receiver: method === "apply" ? node.arguments[1] : undefined,
      newTarget: method === "construct" ? node.arguments.at(2) : undefined,
      isReflected: false,
    };
  }
  // Array.isArray, Object.prototype.toString, and JSON.stringify's replacer run IsArray.
  const tested =
    global === "Array" && method === "isArray"
      ? node.arguments.at(0)
      : global === "JSON" && method === "stringify"
        ? node.arguments.at(1)
        : method === "call" && node.expression.expression.getText() === "Object.prototype.toString"
          ? node.arguments.at(0)
          : undefined;
  if (tested !== undefined && !node.arguments.some(ts.isSpreadElement)) {
    return { trap: "isArray", object: tested, key: undefined, isReflected: false };
  }
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

const TRAPS = [
  "get",
  "has",
  "set",
  "deleteProperty",
  "getOwnPropertyDescriptor",
  "defineProperty",
  "getPrototypeOf",
  "setPrototypeOf",
  "isExtensible",
  "preventExtensions",
  "ownKeys",
  "apply",
  "construct",
];

// The traps that an operation on a proxy may run, through each target too.
export const getTrapFunctions = (node: ts.Node, context: Context) =>
  getProxyOperation(node, context) === undefined
    ? []
    : TRAPS.flatMap((trap) => getMethods(node, trap, context));

// Runs visit on each key of a list, in a recursive operator, as a loop's iterations run, that
// carries the values that the traps it runs can change and what it gathers. A visit goes on to
// the next key, or stops with a result, and a throw leaves the operator to reach what catches it.
const loopKeys = (
  site: ts.Node,
  keys: Expression,
  seed: Expression,
  path: Path,
  context: Context,
  frame: Frame,
  visit: (
    current: Path,
    key: Expression,
    gathered: Expression,
    inner: Frame,
    again: (current: Path, gathered: Expression) => Formula,
    stop: (current: Path, result: Expression) => Formula,
  ) => Formula,
  continueWith: (path: Path, result: Expression) => Formula,
): Formula => {
  const changed = getChanged(site, path, context);
  const name = context.names.getFresh("Keys");
  const position = context.names.getFresh("position");
  const gathered = context.names.getFresh("gathered");
  const parameters = changed.map((symbol) => {
    const binding = path.scope.bindings.get(symbol);
    return context.names.getFresh(binding?.kind === "Identifier" ? binding.name : "value");
  });
  const getValues = (current: Path) =>
    changed.flatMap((symbol) => current.scope.bindings.get(symbol) ?? []);
  const withValues = (current: Path, values: Expression[]): Path => ({
    ...current,
    scope: {
      ...current.scope,
      bindings: new Map([
        ...current.scope.bindings,
        ...changed.map((symbol, offset): [ts.Symbol, Expression] => [symbol, values[offset]]),
      ]),
    },
  });
  const end = (current: Path, kind: string, result: Expression, message: Expression) =>
    leaf(tuple([string(kind), result, message, ...getValues(current)]));
  const inner: Path = {
    ...withValues(
      path,
      parameters.map((parameter) => identifier(parameter)),
    ),
    isLooping: true,
    generators: new Map(),
    tasks: undefined,
  };
  const throwTo = frame.throwTo;
  const innerFrame: Frame = {
    ...frame,
    breakTo: undefined,
    continueTo: undefined,
    throwTo:
      throwTo &&
      ((current, thrown) =>
        end(
          current,
          "throw",
          thrown.value,
          thrown.uncaught.kind === "Apply" && thrown.uncaught.operator === "Assert"
            ? (thrown.uncaught.args[1] ?? string(""))
            : string(site.getText()),
        )),
  };
  const operator: OperatorDefinition = {
    ...define(
      name,
      [position, gathered, ...parameters].map((parameter) => ({ name: parameter, arity: 0 })),
      render(
        ifThenElse(
          apply("<=", [identifier(position), apply("Len", [keys])]),
          visit(
            inner,
            index(keys, [identifier(position)]),
            identifier(gathered),
            innerFrame,
            (current, next) =>
              leaf(
                call(name, [
                  apply("+", [identifier(position), number(1)]),
                  next,
                  ...getValues(current),
                ]),
              ),
            (current, result) => end(current, "next", result, string("")),
          ),
          end(inner, "next", identifier(gathered), string("")),
        ),
      ),
    ),
    isRecursive: true,
  };
  const result = context.names.getFresh("keyed");
  const after = {
    ...withValues(
      path,
      changed.map((_, offset) => index(identifier(result), [number(offset + 4)])),
    ),
    isAssigned: path.isAssigned || changed.some((symbol) => context.variables.has(symbol)),
  };
  const value = index(identifier(result), [number(2)]);
  return letIn(
    [operator],
    bindOnce(
      path,
      result,
      call(name, [number(1), seed, ...getValues(path)]),
      throwTo === undefined
        ? continueWith(after, value)
        : ifThenElse(
            apply("=", [index(identifier(result), [number(1)]), string("throw")]),
            throwTo(after, {
              value,
              uncaught: apply("Assert", [boolean(false), index(identifier(result), [number(3)])]),
            }),
            continueWith(after, value),
          ),
    ),
  );
};

// The targets of a proxy that the script makes, through each target that is such a proxy too.
const getTargets = (
  expression: ts.Expression | undefined,
  seen: ts.Expression[],
  context: Context,
): (ts.Expression | undefined)[] =>
  expression !== undefined && !seen.includes(expression) && isProxyValue(expression, context)
    ? [
        expression,
        ...getTargets(getProxyTarget(expression, context), [...seen, expression], context),
      ]
    : [expression];

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
  const targets = getTargets(operation.object, [], context);
  // How many proxies the script makes the proxy hold as targets, one inside another, and the
  // function at the end, which a call runs where no handler on the way traps it.
  const depth = targets.length - 2;
  const end = targets.at(-1);
  const callee = end === undefined ? undefined : getCallee(end, context);
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
    argumentValues: Expression[],
    given: (path: Path, value?: Expression) => Formula,
  ) => {
    // The value that the operation takes, or the arguments of a call or a new as an array.
    const value =
      operation.arguments === undefined
        ? (argumentValues[0] ?? getUndefined(context))
        : tuple(argumentValues);
    const newTarget =
      operation.newTarget === undefined
        ? proxy
        : translateExpression(operation.newTarget, path.scope, context);
    const throwWith = (after: Path) => throwTypeError(after, node, context, frame);
    // The proxy's internal methods that a function of Object runs on each of its keys, each as
    // the handler's trap or, where it has none, as the target's.
    const getOwnKeys = (
      current: Path,
      inner: Frame,
      then: (path: Path, keys: Expression) => Formula,
    ) =>
      runTrap(
        node,
        proxy,
        "ownKeys",
        [],
        current,
        context,
        inner,
        (after, target) => {
          const heap = getHeap(after.scope, node, context);
          return then(
            after,
            javaScript("PropertyKeysOf", [
              heap,
              javaScript("ForwardTarget", [heap, target, set([string("ownKeys")])]),
            ]),
          );
        },
        (after, target, result) => {
          const heap = getHeap(after.scope, node, context);
          return ifThenElse(
            javaScript("IsObjectIn", [heap, result]),
            bind(after, "keys", javaScript("ProxyKeys", [heap, result]), context, (listed, keys) =>
              ifThenElse(
                javaScript("ProxyKeysAgree", [heap, target, keys]),
                then(listed, keys),
                throwTypeError(listed, node, context, inner),
              ),
            ),
            throwTypeError(after, node, context, inner),
          );
        },
      );
    // Gives the completed descriptor of a key, or undefined.
    const describeKey = (
      current: Path,
      key: Expression,
      inner: Frame,
      then: (path: Path, descriptor: Expression) => Formula,
    ) =>
      runTrap(
        node,
        proxy,
        "getOwnPropertyDescriptor",
        [key],
        current,
        context,
        inner,
        (after, target) => {
          const heap = getHeap(after.scope, node, context);
          return then(
            after,
            javaScript("OwnDescriptor", [
              heap,
              javaScript("ForwardTarget", [
                heap,
                target,
                set([string("getOwnPropertyDescriptor")]),
              ]),
              key,
            ]),
          );
        },
        (after, target, result) => {
          const heap = getHeap(after.scope, node, context);
          return ifThenElse(
            javaScript("ProxyDescriptorAgrees", [heap, target, key, result]),
            then(after, javaScript("TrappedDescriptor", [heap, result])),
            throwTypeError(after, node, context, inner),
          );
        },
      );
    const readKey = (
      current: Path,
      key: Expression,
      inner: Frame,
      then: (path: Path, value: Expression) => Formula,
    ) =>
      runTrap(
        node,
        proxy,
        "get",
        [key, proxy],
        current,
        context,
        inner,
        (after, target) => {
          const heap = getHeap(after.scope, node, context);
          return then(
            after,
            javaScript("Get", [
              heap,
              javaScript("ForwardTarget", [heap, target, set([string("get")])]),
              key,
            ]),
          );
        },
        (after, target, result) =>
          ifThenElse(
            javaScript("ProxyAgrees", [
              getHeap(after.scope, node, context),
              target,
              key,
              result,
              string("get"),
            ]),
            then(after, result),
            throwTypeError(after, node, context, inner),
          ),
      );
    // DefinePropertyOrThrow of a descriptor, which the trap gets as an object.
    const defineKey = (
      current: Path,
      key: Expression,
      descriptor: Expression,
      inner: Frame,
      then: (path: Path) => Formula,
    ) =>
      bind(
        current,
        "heap",
        javaScript("Allocate", [
          getHeap(current.scope, node, context),
          javaScript("DescriptorObject", [descriptor]),
        ]),
        context,
        (bound, allocated) =>
          runTrap(
            node,
            proxy,
            "defineProperty",
            [key, javaScript("Allocated", [allocated])],
            withHeap(bound, allocated, context),
            context,
            inner,
            (after, target) => {
              const heap = getHeap(after.scope, node, context);
              return bind(
                after,
                "change",
                javaScript("DefineConverted", [
                  heap,
                  javaScript("ForwardTarget", [heap, target, set([string("defineProperty")])]),
                  key,
                  descriptor,
                ]),
                context,
                (changed, change) =>
                  ifThenElse(
                    field(change, "isDone"),
                    then(withHeap(changed, field(change, "heap"), context)),
                    throwTypeError(changed, node, context, inner),
                  ),
              );
            },
            (after, target, result) =>
              ifThenElse(
                junction("And", [
                  javaScript("ToBoolean", [result]),
                  javaScript("ProxyDefinitionAgrees", [
                    getHeap(after.scope, node, context),
                    target,
                    key,
                    descriptor,
                  ]),
                ]),
                then(after),
                throwTypeError(after, node, context, inner),
              ),
          ),
      );
    const isPresent = (descriptor: Expression) => apply("#", [descriptor, getUndefined(context)]);
    const isEnumerable = (descriptor: Expression) =>
      apply("/\\", [isPresent(descriptor), field(descriptor, "enumerable")]);
    // Object.seal and Object.freeze restrict each key of a proxy that stops growing, and
    // Object.isSealed and Object.isFrozen test each where it can't grow.
    const isFrozen = operation.method === "freeze" || operation.method === "isFrozen";
    const next = (after: Path, result?: Expression): Formula => {
      if (operation.method === "seal" || operation.method === "freeze") {
        return getOwnKeys(after, frame, (listed, keys) =>
          loopKeys(
            node,
            keys,
            getUndefined(context),
            listed,
            context,
            frame,
            (current, key, gathered, inner, again) => {
              const restrict = (described: Path, isData: Expression) =>
                defineKey(
                  described,
                  key,
                  javaScript("IntegrityDescriptor", [
                    getHeap(described.scope, node, context),
                    isData,
                  ]),
                  inner,
                  (defined) => again(defined, gathered),
                );
              return isFrozen
                ? describeKey(current, key, inner, (described, descriptor) =>
                    ifThenElse(
                      isPresent(descriptor),
                      restrict(described, not(field(descriptor, "isAccessor"))),
                      again(described, gathered),
                    ),
                  )
                : restrict(current, boolean(false));
            },
            (looped) => given(looped, result),
          ),
        );
      }
      return operation.method === "isSealed" || operation.method === "isFrozen"
        ? ifThenElse(
            result ?? boolean(true),
            given(after, boolean(false)),
            getOwnKeys(after, frame, (listed, keys) =>
              loopKeys(
                node,
                keys,
                boolean(true),
                listed,
                context,
                frame,
                (current, key, gathered, inner, again, stop) =>
                  describeKey(current, key, inner, (described, descriptor) =>
                    ifThenElse(
                      junction("And", [
                        isPresent(descriptor),
                        junction("Or", [
                          field(descriptor, "configurable"),
                          junction("And", [
                            boolean(isFrozen),
                            field(descriptor, "isData"),
                            field(descriptor, "writable"),
                          ]),
                        ]),
                      ]),
                      stop(described, boolean(false)),
                      again(described, gathered),
                    ),
                  ),
                given,
              ),
            ),
          )
        : given(after, result);
    };
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
    // Object.keys, values, entries, and getOwnPropertyDescriptors ask the proxy for each key's
    // descriptor, and all but the first and the last read each enumerable key's value, which
    // Object.assign writes to the object it takes, a spread or a rest element to a new one, and
    // Object.defineProperties reads as a descriptor to define on its object once it read them all.
    // Each key runs in turn where a handler may trap those, and keys and values leave symbols out.
    const giveKeys = (after: Path, keys: Expression) => {
      const heap = getHeap(after.scope, node, context);
      const listing = operation.method ?? "";
      if (
        ![
          "keys",
          "values",
          "entries",
          "assign",
          "copy",
          "getOwnPropertyDescriptors",
          "defineProperties",
        ].includes(listing)
      ) {
        return next(after, javaScript("ProxyKeysOf", [heap, proxy, keys, method]));
      }
      const traps = ["getOwnPropertyDescriptor", ...(listing === "keys" ? [] : ["get"])];
      if (
        ["keys", "values", "entries"].includes(listing) &&
        traps.every((trap) => getMethods(node, trap, context).length === 0)
      ) {
        return next(
          after,
          javaScript("ProxyKeysOf", [
            heap,
            javaScript("ForwardTarget", [heap, proxy, set(traps.map((name) => string(name)))]),
            keys,
            method,
          ]),
        );
      }
      const isSymbolKept = !["keys", "values", "entries"].includes(listing);
      // What the loop gathers of a key's value, which Object.assign writes instead.
      const gatherValue = (
        valued: Path,
        key: Expression,
        property: Expression,
        gathered: Expression,
        inner: Frame,
        again: (current: Path, gathered: Expression) => Formula,
      ) => {
        const changed = getHeap(valued.scope, node, context);
        if (listing === "defineProperties" && ts.isCallExpression(node)) {
          return readFields(node, property, valued, context, inner, (read, descriptor) =>
            again(
              read,
              tuple([
                apply("Append", [index(gathered, [number(1)]), key]),
                apply("Append", [index(gathered, [number(2)]), descriptor]),
              ]),
            ),
          );
        }
        return listing !== "assign"
          ? again(
              valued,
              apply("Append", [gathered, listing === "values" ? property : tuple([key, property])]),
            )
          : ifThenElse(
              javaScript("CanPut", [changed, value, key]),
              bind(
                valued,
                "heap",
                javaScript("SetProperty", [changed, value, key, property]),
                context,
                (bound, written) => again(withHeap(bound, written, context), gathered),
              ),
              throwTypeError(valued, node, context, inner),
            );
      };
      // Object.defineProperties gathers the keys and the descriptors apart, as it defines them.
      return loopKeys(
        node,
        keys,
        listing === "defineProperties" ? tuple([tuple([]), tuple([])]) : tuple([]),
        after,
        context,
        frame,
        (current, key, gathered, inner, again) => {
          const gather = (described: Path, descriptor: Expression) =>
            listing === "getOwnPropertyDescriptors"
              ? ifThenElse(
                  isPresent(descriptor),
                  again(described, apply("Append", [gathered, tuple([key, descriptor])])),
                  again(described, gathered),
                )
              : ifThenElse(
                  isEnumerable(descriptor),
                  listing === "keys"
                    ? again(described, apply("Append", [gathered, key]))
                    : readKey(described, key, inner, (valued, property) =>
                        gatherValue(valued, key, property, gathered, inner, again),
                      ),
                  again(described, gathered),
                );
          return isSymbolKept
            ? describeKey(current, key, inner, gather)
            : ifThenElse(
                javaScript("IsSymbol", [key]),
                again(current, gathered),
                describeKey(current, key, inner, gather),
              );
        },
        (looped, result) => {
          if (listing === "assign") return next(looped, value);
          if (listing === "defineProperties" && ts.isCallExpression(node)) {
            return defineAll(
              node,
              value,
              index(result, [number(1)]),
              index(result, [number(2)]),
              looped,
              context,
              frame,
              (defined) => next(defined, value),
            );
          }
          if (listing !== "copy" && listing !== "getOwnPropertyDescriptors") {
            return next(looped, result);
          }
          const changed = getHeap(looped.scope, node, context);
          // The properties beside a spread, those before it read before the proxy's traps run.
          const spread = ts.isObjectLiteralExpression(node) ? getSpread(node) : undefined;
          const getPairs = (isBefore: boolean, scope: Scope) =>
            !ts.isObjectLiteralExpression(node) || spread === undefined
              ? []
              : node.properties
                  .filter((property) => property.pos < spread.pos === isBefore)
                  .flatMap((property) =>
                    ts.isShorthandPropertyAssignment(property)
                      ? [
                          tuple([
                            string(property.name.text),
                            translateExpression(property.name, scope, context),
                          ]),
                        ]
                      : ts.isPropertyAssignment(property)
                        ? [
                            tuple([
                              ts.isComputedPropertyName(property.name)
                                ? translatePropertyKey(property.name.expression, scope, context)
                                : ts.isStringLiteral(property.name) ||
                                    ts.isNumericLiteral(property.name)
                                  ? translatePropertyKey(property.name, scope, context)
                                  : string(property.name.getText()),
                              translateExpression(property.initializer, scope, context),
                            ]),
                          ]
                        : [],
                  );
          const pairs = apply("\\o", [
            apply("\\o", [tuple(getPairs(true, path.scope)), result]),
            tuple(getPairs(false, looped.scope)),
          ]);
          return bind(
            looped,
            "heap",
            listing === "copy"
              ? javaScript("Allocate", [changed, javaScript("PairsObject", [pairs])])
              : javaScript("ProxyDescriptors", [changed, result]),
            context,
            (bound, allocated) =>
              next(withHeap(bound, allocated, context), javaScript("Allocated", [allocated])),
          );
        },
      );
    };
    // Runs the internal method of a proxy on the way, as its handler's trap or, where it has none,
    // as its target's, where nested counts the proxies that the script makes it hold as targets.
    const runWith = (
      path: Path,
      current: Expression,
      values: Expression[],
      descriptor: Expression,
      nested: number,
    ): Formula => {
      const heap = getHeap(path.scope, node, context);
      const check = (after: Path, target: Expression, result: Expression) => {
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
                  giveKeys(listed, keys),
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
      const forwardTo = (after: Path, target: Expression) => {
        // What reads the target goes on through proxy targets that have no trap for it.
        const forwarded = (name: string) =>
          javaScript("ForwardTarget", [heap, target, set([string(name)])]);
        const isCalled = trap === "apply" && callee !== undefined;
        if (trap === "apply" || trap === "construct") {
          const stop = leaf(
            apply("Assert", [boolean(false), string("tla-ts can't call the target of a proxy")]),
          );
          return !isCalled
            ? stop
            : callValue(
                node,
                [callee],
                target,
                values[0],
                argumentValues,
                after,
                context,
                frame,
                () => stop,
                next,
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
            javaScript(trap === "getPrototypeOf" ? "TargetPrototype" : "IsExtensible", [
              heap,
              forwarded(trap),
            ]),
          );
        }
        if (trap === "ownKeys") {
          return giveKeys(after, javaScript("PropertyKeysOf", [heap, forwarded(trap)]));
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
        return change(
          "CanPut",
          javaScript("SetProperty", [
            heap,
            javaScript("ForwardTarget", [
              heap,
              proxy,
              set([string("getOwnPropertyDescriptor"), string("defineProperty")]),
            ]),
            key,
            value,
          ]),
        );
      };
      const forward = (after: Path, target: Expression) =>
        nested === 0
          ? forwardTo(after, target)
          : ifThenElse(
              javaScript("IsProxy", [heap, target]),
              runWith(after, target, values, descriptor, nested - 1),
              forwardTo(after, target),
            );
      return runTrap(node, current, trap, values, path, context, frame, forward, check);
    };
    const heap = getHeap(path.scope, node, context);
    if (trap === "isArray") {
      return ifThenElse(
        javaScript("IsRevokedProxy", [heap, proxy]),
        throwWith(path),
        next(path, translateExpression(node, path.scope, context)),
      );
    }
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
                        proxy,
                        [key, javaScript("Allocated", [allocated])],
                        descriptor,
                        depth,
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
                : apply("/\\", [
                    javaScript("IsConstructor", [heap, proxy]),
                    operation.newTarget === undefined
                      ? boolean(true)
                      : getIsConstructor(operation.newTarget, newTarget, heap, context),
                  ]),
              runWith(
                path,
                proxy,
                trap === "apply"
                  ? [
                      operation.receiver === undefined
                        ? getUndefined(context)
                        : translateExpression(operation.receiver, path.scope, context),
                      value,
                    ]
                  : [value, newTarget],
                getUndefined(context),
                depth,
              ),
              throwWith(path),
            )
          : trap === "setPrototypeOf"
            ? ifThenElse(
                apply("\\/", [
                  apply("=", [value, identifier("Null")]),
                  javaScript("IsObjectIn", [heap, value]),
                ]),
                runWith(path, proxy, [value], getUndefined(context), depth),
                throwWith(path),
              )
            : runWith(
                path,
                proxy,
                trap === "get"
                  ? [key, proxy]
                  : trap === "set"
                    ? [key, value, proxy]
                    : KEYED_TRAPS.has(trap)
                      ? [key]
                      : [],
                getUndefined(context),
                depth,
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
                // Object.defineProperties checks its object before it reads the descriptors.
                operation.method === "defineProperties"
                  ? ifThenElse(
                      isObjectArgument(values[0], context),
                      run(valued, proxy, values, next),
                      throwTypeError(valued, node, context, frame),
                    )
                  : run(valued, proxy, values, next),
            ),
        ),
    ),
  );
};
