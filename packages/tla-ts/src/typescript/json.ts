import ts from "@typescript/typescript6";
import type { Expression } from "../ast";
import {
  type Context,
  findNodes,
  type FunctionNode,
  getAccessorFunctions,
  getParameters,
  getSymbol,
  getUndefined,
  isAssigned,
  share,
  skipCasts,
  translateString,
} from "./context";
import { TlaTypeScriptError } from "../errors";
import { getNumberValue, translateExpression } from "./expressions";
import {
  allocateAll,
  type Frame,
  getChanged,
  inlineValues,
  type Path,
  throwError,
  translateJoined,
} from "./actions";
import { type Formula, ifThenElse, leaf } from "./formula";
import { getAllocated, getHeap, translateObjectValue } from "./heap";
import {
  bind,
  callValue,
  getFunctionCandidates,
  isRunnableGetter,
  readWith,
  withHeap,
} from "./protocols";
import { getBuiltIn, isBuiltInObject, translateBuiltInValue } from "./intrinsics";
import { useJavaScript } from "./javascript";
import type { Scope } from "./scope";
import { apply, boolean, identifier, ifExpression, number, string, tuple } from "./tla";
import { getKind } from "./types";

const toEscape = (code: number) => `\\u${code.toString(16).padStart(4, "0")}`;

// The code units that QuoteJSONString escapes, which are the controls, the surrogates, the quote, and
// the backslash.
const JSON_ESCAPES = new Map<string, string>([
  ...Array.from({ length: 0x20 }, (_, code): [string, string] => [
    String.fromCharCode(code),
    toEscape(code),
  ]),
  ...Array.from({ length: 0x800 }, (_, offset): [string, string] => [
    String.fromCharCode(0xd800 + offset),
    toEscape(0xd800 + offset),
  ]),
  ["\b", "\\b"],
  ["\t", "\\t"],
  ["\n", "\\n"],
  ["\f", "\\f"],
  ["\r", "\\r"],
  ['"', '\\"'],
  ["\\", "\\\\"],
]);

// Merges functions in halves, so that the expression nests only as deep as the log of their count.
const mergeFunctions = (functions: Expression[]): Expression =>
  functions.length === 1
    ? functions[0]
    : apply("@@", [
        mergeFunctions(functions.slice(0, functions.length / 2)),
        mergeFunctions(functions.slice(functions.length / 2)),
      ]);

const COLLECTIONS = new Set(["Map", "Set", "WeakMap", "WeakSet"]);

// Whether a script may name a collection, which tla-ts can't tell from an array where it isn't on the
// heap.
const usesCollections = (node: ts.Node): boolean =>
  (ts.isIdentifier(node) && COLLECTIONS.has(node.text)) ||
  (ts.forEachChild(node, usesCollections) ?? false);

// The text of a literal, or of a variable that only a literal sets, before the read in the same
// function, which tla-ts parses as it compiles.
const getLiteralText = (node: ts.Expression, context: Context): string | undefined => {
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return String(Number(node.text));
  if (
    ts.isPrefixUnaryExpression(node) &&
    node.operator === ts.SyntaxKind.MinusToken &&
    ts.isNumericLiteral(node.operand)
  ) {
    return String(-Number(node.operand.text));
  }
  const symbol = ts.isIdentifier(node) ? getSymbol(node, context.checker) : undefined;
  const declaration = symbol?.valueDeclaration;
  return symbol !== undefined &&
    declaration !== undefined &&
    ts.isVariableDeclaration(declaration) &&
    declaration.initializer !== undefined &&
    (ts.isStringLiteral(declaration.initializer) ||
      ts.isNoSubstitutionTemplateLiteral(declaration.initializer)) &&
    declaration.getEnd() <= node.getStart() &&
    ts.findAncestor(declaration, ts.isFunctionLike) === ts.findAncestor(node, ts.isFunctionLike) &&
    !isAssigned(symbol, node.getSourceFile(), context)
    ? declaration.initializer.text
    : undefined;
};

const isJsonParse = (node: ts.Node, context: Context): node is ts.CallExpression =>
  ts.isCallExpression(node) &&
  ts.isPropertyAccessExpression(node.expression) &&
  node.expression.name.text === "parse" &&
  getBuiltIn(node.expression.expression, context) === "JSON" &&
  context.heap !== undefined;

// The text that JSON.parse reads where its argument is a literal, which tla-ts parses as it compiles.
// A reviver needs calls, which only a statement runs, so a call that passes one has no text.
export const getJsonText = (node: ts.Node, context: Context) =>
  isJsonParse(node, context) && node.arguments.length === 1
    ? getLiteralText(node.arguments[0], context)
    : undefined;

// Whether JSON.parse of a literal makes objects, which the heap holds. A type that a script gives
// what it makes keeps its arrays outside the heap, so it holds arrays only where nothing types them.
export const isParsedObject = (node: ts.Node, context: Context) => {
  const text = getJsonText(node, context);
  const parsed = text === undefined ? undefined : parseJson(text);
  return (
    parsed !== undefined &&
    "value" in parsed &&
    isJsonObject(parsed.value) &&
    (isOpenType(getContextualType(node, context)) || !hasJsonArray(parsed.value))
  );
};

const getContextualType = (node: ts.Node, context: Context) =>
  ts.isExpression(node) ? context.checker.getContextualType(node) : undefined;

const isOpenType = (type: ts.Type | undefined) =>
  type === undefined || (type.flags & (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) !== 0;

const hasJsonArray = (value: unknown) => getJsonObjects(value).some(Array.isArray);

const isJsonObject = (value: unknown): value is object =>
  typeof value === "object" && value !== null;

// The objects that JSON.parse makes of a value, innermost first.
const getJsonObjects = (value: unknown): object[] =>
  isJsonObject(value) ? [...Object.values(value).flatMap(getJsonObjects), value] : [];

// What JSON.parse gives for a text, or a SyntaxError where the text isn't JSON.
export const parseJson = (text: string): { value: unknown } | { error: SyntaxError } => {
  try {
    return { value: JSON.parse(text) };
  } catch (error) {
    if (error instanceof SyntaxError) return { error };
    throw error;
  }
};

// Whether the heap still holds JSON's built-in method.
export const translateHoldsJson = (
  node: ts.Node,
  method: "parse" | "stringify",
  scope: Scope,
  context: Context,
) =>
  useJavaScript(
    "HoldsBuiltIn",
    [
      getHeap(scope, node, context),
      translateBuiltInValue("JSON", node, context),
      string(method),
      string(`JSON.${method}`),
    ],
    context,
  );

// The primitive that JSON.parse gives for a literal's text.
const translateParsed = (node: ts.CallExpression, text: string, scope: Scope, context: Context) => {
  const parsed = parseJson(text);
  if ("error" in parsed) {
    return apply("Assert", [
      boolean(false),
      string("tla-ts can't throw the SyntaxError of JSON.parse here"),
    ]);
  }
  if (isJsonObject(parsed.value)) {
    const made = scope.allocated.get(node);
    if (made === undefined) {
      throw new TlaTypeScriptError(
        isParsedObject(node, context)
          ? "Make objects only where a statement always runs"
          : `Unsupported call: ${node.getText()}`,
        node,
      );
    }
    return made;
  }
  return translateJsonPrimitive(node, parsed.value, context);
};

const translateJsonPrimitive = (node: ts.Node, value: unknown, context: Context) => {
  if (typeof value === "string") return translateString(value, context);
  if (typeof value === "boolean") return boolean(value);
  if (value === null) {
    context.prelude.add("Null");
    return identifier("Null");
  }
  const converted = typeof value === "number" ? getNumberValue(value, context) : undefined;
  if (converted !== undefined) return converted;
  throw new TlaTypeScriptError(`Unsupported call: ${node.getText()}`, node);
};

// The heap once it holds the objects that JSON.parse makes of a value, the last of which is the
// value's own.
const translateJsonObjects = (
  node: ts.Node,
  value: unknown,
  heap: Expression,
  context: Context,
) => {
  const objects = getJsonObjects(value);
  const translateValue = (inner: unknown) =>
    isJsonObject(inner)
      ? useJavaScript("NextRef", [heap, number(objects.indexOf(inner) + 1)], context)
      : translateJsonPrimitive(node, inner, context);
  return useJavaScript(
    "AllocateEach",
    [
      heap,
      tuple(
        objects.map((object) =>
          Array.isArray(object)
            ? useJavaScript(
                "ArrayObject",
                [
                  translateBuiltInValue("Array.prototype", node, context),
                  tuple(object.map(translateValue)),
                ],
                context,
              )
            : useJavaScript(
                "PairsObject",
                [
                  tuple(
                    Object.entries(object).map((entry) =>
                      tuple([translateString(entry[0], context), translateValue(entry[1])]),
                    ),
                  ),
                ],
                context,
              ),
        ),
      ),
    ],
    context,
  );
};

// The heap once it holds the objects that JSON.parse makes of a literal's text.
export const translateParsedObjects = (
  node: ts.CallExpression,
  heap: Expression,
  context: Context,
) => {
  const text = getJsonText(node, context);
  const parsed = text === undefined ? undefined : parseJson(text);
  if (parsed === undefined || !("value" in parsed)) {
    throw new TlaTypeScriptError(`Unsupported call: ${node.getText()}`, node);
  }
  return translateJsonObjects(node, parsed.value, heap, context);
};

// JSON.stringify of a value, a replacer, and a space, where the heap still holds the built-in.
const isStringify = (node: ts.CallExpression, context: Context) =>
  ts.isPropertyAccessExpression(node.expression) &&
  node.expression.name.text === "stringify" &&
  getBuiltIn(node.expression.expression, context) === "JSON" &&
  context.heap !== undefined;

// Whether a type may hold a BigInt, or an object or array that holds one, which JSON.stringify
// throws a TypeError for.
const mayHoldBigInt = (type: ts.Type, checker: ts.TypeChecker, seen: Set<ts.Type>): boolean => {
  if (seen.has(type)) return false;
  seen.add(type);
  if (
    (type.flags &
      (ts.TypeFlags.BigIntLike |
        ts.TypeFlags.Any |
        ts.TypeFlags.Unknown |
        ts.TypeFlags.NonPrimitive |
        ts.TypeFlags.Instantiable)) !==
    0
  ) {
    return true;
  }
  if (type.isUnionOrIntersection()) {
    return type.types.some((inner) => mayHoldBigInt(inner, checker, seen));
  }
  // JSON.stringify leaves out a function.
  if ((type.flags & ts.TypeFlags.Object) === 0 || type.getCallSignatures().length > 0) return false;
  return (
    type.getSymbol()?.name === "BigInt" ||
    type
      .getProperties()
      .some((property) => mayHoldBigInt(checker.getTypeOfSymbol(property), checker, seen)) ||
    checker.getIndexInfosOfType(type).some((info) => mayHoldBigInt(info.type, checker, seen))
  );
};

// JSON.stringify of a value that may hold a BigInt, which only statements can run, as it may throw.
export const isBigIntStringify = (node: ts.CallExpression, context: Context) => {
  const value = node.arguments.at(0);
  return (
    isStringify(node, context) &&
    value !== undefined &&
    mayHoldBigInt(context.checker.getTypeAtLocation(value), context.checker, new Set())
  );
};

// JSON.stringify of a value, a replacer, and a space, which gives JSONTypeError where it throws a
// TypeError.
export const translateStringify = (node: ts.CallExpression, scope: Scope, context: Context) => {
  if (node.arguments.length > 3 || node.arguments.some(ts.isSpreadElement)) {
    throw new TlaTypeScriptError(`Unsupported call: ${node.getText()}`, node);
  }
  context.builtIns.add("BigInt.prototype");
  const values = [0, 1, 2].map((position) => {
    const argument = node.arguments.at(position);
    if (argument === undefined) return getUndefined(context);
    return getKind(argument, context) === "object" || isBuiltInObject(argument, context)
      ? translateObjectValue(argument, scope, context)
      : translateExpression(argument, scope, context);
  });
  const escapes = mergeFunctions(
    [...JSON_ESCAPES].map((entry) => apply(":>", [string(entry[0]), string(entry[1])])),
  );
  return ifExpression(
    translateHoldsJson(node, "stringify", scope, context),
    useJavaScript(
      "JSONStringify",
      [
        getHeap(scope, node, context),
        ...values,
        escapes,
        translateBuiltInValue("Array.prototype", node, context),
        translateBuiltInValue("Function.prototype", node, context),
        boolean(!usesCollections(node.getSourceFile())),
      ],
      context,
    ),
    apply("Assert", [
      boolean(false),
      string("tla-ts can't call JSON.stringify where a script replaced it"),
    ]),
  );
};

// JSON.stringify, or JSON.parse of a literal, where the heap still holds the built-in.
export const translateJsonCall = (node: ts.CallExpression, scope: Scope, context: Context) => {
  const text = getJsonText(node, context);
  if (text !== undefined) {
    return ifExpression(
      translateHoldsJson(node, "parse", scope, context),
      translateParsed(node, text, scope, context),
      apply("Assert", [
        boolean(false),
        string("tla-ts can't call JSON.parse where a script replaced it"),
      ]),
    );
  }
  if (!isStringify(node, context)) return undefined;
  return share(translateStringify(node, scope, context), "stringified", context, (value) =>
    ifExpression(
      useJavaScript("IsError", [value], context),
      apply("Assert", [
        boolean(false),
        string("tla-ts can't throw the TypeError of JSON.stringify here"),
      ]),
      value,
    ),
  );
};

interface Revival {
  text: string;
  reviver: ts.Expression;
  candidates: FunctionNode[];
}

// JSON.parse of a literal's text with a function that revives what it parses, which only a
// statement runs, as it calls the function.
export const getRevival = (node: ts.Node, context: Context): Revival | undefined => {
  if (!isJsonParse(node, context) || node.arguments.length !== 2) return undefined;
  const text = getLiteralText(node.arguments[0], context);
  const reviver = node.arguments[1];
  const candidates = getFunctionCandidates(reviver, context);
  const parsed = text === undefined ? undefined : parseJson(text);
  // The values that the reviver and the call give keep their arrays outside the heap where a
  // script types them.
  const isTyped =
    parsed !== undefined &&
    "value" in parsed &&
    hasJsonArray(parsed.value) &&
    (!isOpenType(getContextualType(node, context)) ||
      candidates.some((candidate) => {
        const parameter = getParameters(candidate).at(1);
        return parameter !== undefined && !isOpenType(context.checker.getTypeAtLocation(parameter));
      }));
  return text !== undefined && candidates.length > 0 && !isTyped
    ? { text, reviver, candidates }
    : undefined;
};

// The most values of a text that tla-ts revives, as it translates the reviver's call for each.
const REVIVED_LIMIT = 64;

const countJsonValues = (value: unknown): number =>
  isJsonObject(value)
    ? 1 + Object.values(value).reduce((total: number, inner) => total + countJsonValues(inner), 0)
    : 1;

// JSON.parse with a reviver, which makes the objects of its text and then visits each value from
// the innermost, as InternalizeJSONProperty does: it reads the value from its holder, revives its
// keys in turn, deleting each that the reviver gave undefined for, and calls the reviver with the
// holder as this. Where the reviver changes an object before the walk reaches it, which the text
// doesn't tell, the run stops.
export const reviveJson = (
  node: ts.CallExpression,
  revival: Revival,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value?: Expression) => Formula,
): Formula => {
  revival.candidates.forEach((candidate) => {
    if (
      getParameters(candidate).length > 2 ||
      findNodes(candidate, ts.isIdentifier).some((name) => name.text === "arguments")
    ) {
      throw new TlaTypeScriptError(
        "tla-ts can't pass a reviver the context of what it parses",
        candidate,
      );
    }
  });
  const parsed = parseJson(revival.text);
  const replaced = leaf(
    apply("Assert", [
      boolean(false),
      string("tla-ts can't call JSON.parse where a script replaced it"),
    ]),
  );
  if ("error" in parsed) {
    return ifThenElse(
      translateHoldsJson(node, "parse", path.scope, context),
      throwError("SyntaxError", path, node, context, frame),
      replaced,
    );
  }
  const value = parsed.value;
  if (countJsonValues(value) > REVIVED_LIMIT) {
    throw new TlaTypeScriptError("tla-ts can't revive this many values", node);
  }
  const objects = getJsonObjects(value);
  const getters = getAccessorFunctions(node, "get", context).filter((getter) =>
    isRunnableGetter(getter, context),
  );
  return allocateAll(
    getAllocated(node, context).filter((inner) => !path.scope.allocated.has(inner)),
    path,
    context,
    (allocated) => {
      const reviver = skipCasts(revival.reviver);
      const literal =
        ts.isFunctionExpression(reviver) || ts.isArrowFunction(reviver) ? reviver : undefined;
      const heap = getHeap(allocated.scope, node, context);
      const getRef = (object: object) =>
        useJavaScript("NextRef", [heap, number(objects.indexOf(object) + 1)], context);
      const isChanged = leaf(
        apply("Assert", [
          boolean(false),
          string("tla-ts can't revive an object that the reviver changed"),
        ]),
      );
      const changed = [
        ...new Set([
          ...getChanged(node, allocated, context),
          ...(context.heap === undefined ? [] : [context.heap]),
        ]),
      ];
      const walk = (
        current: Path,
        holder: Expression,
        key: string,
        inner: unknown,
        next: (path: Path, result: Expression) => Formula,
      ): Formula =>
        // The walk joins where the reviver revives the value, so the rest of it translates once.
        translateJoined(
          node,
          current,
          context,
          (after, result) => next(after, result ?? getUndefined(context)),
          (joined) =>
            readWith(
              node,
              holder,
              translateString(key, context),
              getters,
              current,
              context,
              frame,
              (found, read) => {
                const passed = [translateString(key, context), read];
                // A function that the call itself writes is the one it calls.
                const revive = (at: Path) =>
                  literal === undefined
                    ? callValue(
                        node,
                        revival.candidates,
                        translateExpression(revival.reviver, allocated.scope, context),
                        holder,
                        passed,
                        at,
                        context,
                        frame,
                        () =>
                          leaf(
                            apply("Assert", [
                              boolean(false),
                              string("tla-ts can't tell which function revives this"),
                            ]),
                          ),
                        joined,
                      )
                    : translateJoined(
                        node,
                        at,
                        context,
                        (after, result) => joined(after, result ?? getUndefined(context)),
                        (inlined) =>
                          inlineValues(
                            literal,
                            passed,
                            ts.isArrowFunction(literal)
                              ? undefined
                              : { value: holder, method: literal },
                            at,
                            context,
                            frame,
                            inlined,
                          ),
                      );
                const isObject = useJavaScript(
                  "IsObjectIn",
                  [getHeap(found.scope, node, context), read],
                  context,
                );
                const otherwise = ifThenElse(isObject, isChanged, revive(found));
                if (!isJsonObject(inner)) return otherwise;
                const ref = getRef(inner);
                const entries = Object.entries(inner);
                const visit = entries.reduceRight<(at: Path) => Formula>(
                  (rest, entry) => (at) =>
                    walk(at, ref, entry[0], entry[1], (after, result) =>
                      bind(
                        after,
                        "heap",
                        useJavaScript(
                          "Revived",
                          [
                            getHeap(after.scope, node, context),
                            ref,
                            translateString(entry[0], context),
                            result,
                          ],
                          context,
                        ),
                        context,
                        (stored, storedHeap) => rest(withHeap(stored, storedHeap, context)),
                      ),
                    ),
                  revive,
                );
                return ifThenElse(
                  apply("/\\", [
                    useJavaScript("SameValue", [read, ref], context),
                    apply("=", [
                      useJavaScript(
                        "RevivedKeys",
                        [getHeap(found.scope, node, context), read],
                        context,
                      ),
                      tuple(entries.map((entry) => translateString(entry[0], context))),
                    ]),
                  ]),
                  visit(found),
                  otherwise,
                );
              },
            ),
          changed,
        );
      return ifThenElse(
        translateHoldsJson(node, "parse", allocated.scope, context),
        bind(
          allocated,
          "heap",
          translateJsonObjects(node, value, heap, context),
          context,
          (made, madeHeap) =>
            bind(
              withHeap(made, madeHeap, context),
              "heap",
              useJavaScript(
                "Allocate",
                [
                  madeHeap,
                  useJavaScript(
                    "PairsObject",
                    [
                      tuple([
                        tuple([
                          string(""),
                          isJsonObject(value)
                            ? getRef(value)
                            : translateJsonPrimitive(node, value, context),
                        ]),
                      ]),
                    ],
                    context,
                  ),
                ],
                context,
              ),
              context,
              (wrapped, wrapperHeap) =>
                walk(
                  withHeap(wrapped, wrapperHeap, context),
                  useJavaScript("Allocated", [wrapperHeap], context),
                  "",
                  value,
                  continueWith,
                ),
            ),
        ),
        replaced,
      );
    },
  );
};
