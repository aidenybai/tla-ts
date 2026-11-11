import ts from "@typescript/typescript6";
import type { Expression } from "../ast";
import { bindOnce, type Frame, inlineBody, type Path, translateJoined } from "./actions";
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
import { apply, boolean, identifier, string } from "./tla";

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

const getGetters = (node: ts.Node, key: string, context: Context) => [
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

// Reads a property, running its getter where it's one that the script writes.
export const read = (
  site: ts.Node,
  object: Expression,
  key: string,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value: Expression) => Formula,
): Formula => {
  const heap = getHeap(path.scope, site, context);
  const property = key.startsWith("@@")
    ? useJavaScript("WellKnownSymbol", [string(key.slice(2))], context)
    : string(key);
  const got = useJavaScript("Get", [heap, object, property], context);
  const getters = getGetters(site, key, context);
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
