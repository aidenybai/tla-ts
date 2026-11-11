import ts from "@typescript/typescript6";
import type { Expression } from "../ast";
import {
  bindOnce,
  type Frame,
  inlineBody,
  type Path,
  throwError,
  throwTypeError,
  translateJoined,
} from "./actions";
import {
  type Context,
  findNodes,
  type FunctionNode,
  getAccessorFunctions,
  getCallee,
  getUndefined,
  skipCasts,
} from "./context";
import { type Formula, ifThenElse, leaf } from "./formula";
import { getCandidateValue, getHeap } from "./heap";
import { useJavaScript } from "./javascript";
import { apply, boolean, field, identifier, junction, not, record, string, tuple } from "./tla";

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

// Calls a value with a receiver and no arguments, branching on which of the candidates it is, or
// does what otherwise does with the call's continuation where it's none of them.
export const callValue = (
  site: ts.Node,
  candidates: readonly FunctionNode[],
  value: Expression,
  receiver: Expression,
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
        return ifThenElse(
          apply("=", [
            useJavaScript("CodeOf", [getHeap(path.scope, site, context), value], context),
            candidateValue,
          ]),
          inlineBody(
            site,
            candidate,
            [],
            ts.isArrowFunction(candidate) ? undefined : { value: receiver, method: candidate },
            path,
            context,
            frame,
            next,
          ),
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
const readWith = (
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
  DESCRIPTOR_FIELDS.some((key) => getGetterKeys(node).has(key));

export const getDescriptorGetters = (node: ts.Node, context: Context) =>
  isDescriptorRead(node, context)
    ? [...new Set(DESCRIPTOR_FIELDS.flatMap((key) => getKeyGetters(node, key, context)))]
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
