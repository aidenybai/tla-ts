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
  getValueDeclaration,
} from "./context";
import { TlaTypeScriptError } from "../errors";
import { getNumberValue, translateExpression } from "./expressions";
import {
  allocateAll,
  type Frame,
  getCallback,
  getChanged,
  inlineValues,
  type Path,
  throwError,
  throwTypeError,
  translateJoined,
} from "./actions";
import { type Formula, ifThenElse, leaf } from "./formula";
import { getAllocated, getHeap, translateObjectValue } from "./heap";
import {
  bind,
  callValue,
  getFunctionCandidates,
  getOwnValueGetters,
  isRunnableGetter,
  loopStates,
  readWith,
  withHeap,
} from "./protocols";
import { getBuiltIn, isBuiltInObject, translateBuiltInValue } from "./intrinsics";
import { getTypeNames, useJavaScript } from "./javascript";
import type { Scope } from "./scope";
import {
  apply,
  boolean,
  field,
  identifier,
  ifExpression,
  index,
  number,
  string,
  tuple,
} from "./tla";
import { getKind } from "./types";

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
  const declaration = getValueDeclaration(symbol, context);
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

// The string that JSON.parse reads where a script builds it rather than writes a literal, whose
// grammar tla-ts checks as the script runs.
export const getBuiltJsonText = (node: ts.Node, context: Context) =>
  isJsonParse(node, context) &&
  (node.arguments.length === 1 || node.arguments.length === 2) &&
  getLiteralText(node.arguments[0], context) === undefined &&
  getTypeNames(context.checker.getTypeAtLocation(node.arguments[0]), context.checker)?.join() ===
    "string"
    ? node.arguments[0]
    : undefined;

// A reviver reads only the key and the value that JSON.parse passes it.
const throwOnRevivedContext = (reviver: FunctionNode) => {
  if (
    getParameters(reviver).length > 2 ||
    findNodes(reviver, ts.isIdentifier).some((name) => name.text === "arguments")
  ) {
    throw new TlaTypeScriptError(
      "tla-ts can't pass a reviver the context of what it parses",
      reviver,
    );
  }
};

const isChangedRevival = leaf(
  apply("Assert", [
    boolean(false),
    string("tla-ts can't revive an object that the reviver changed"),
  ]),
);

// Revives what JSON.parse made of its text, as InternalizeJSONProperty runs the reviver, in a loop
// over the steps that the objects give, which stops where the reviver changes an object before the
// loop reaches it. revive calls the reviver with the key and the value that it read, and the holder
// as this.
const reviveMade = (
  node: ts.CallExpression,
  value: Expression,
  revivers: readonly FunctionNode[],
  getters: readonly FunctionNode[],
  made: Path,
  context: Context,
  frame: Frame,
  revive: (
    path: Path,
    holder: Expression,
    passed: Expression[],
    inner: Frame,
    next: (path: Path, result?: Expression) => Formula,
  ) => Formula,
  continueWith: (path: Path, value?: Expression) => Formula,
) =>
  bind(
    made,
    "heap",
    useJavaScript(
      "Allocate",
      [
        getHeap(made.scope, node, context),
        useJavaScript("PairsObject", [tuple([tuple([string(""), value])])], context),
      ],
      context,
    ),
    context,
    (wrapped, wrapperHeap) =>
      bind(
        wrapped,
        "steps",
        useJavaScript(
          "JSONReviveSteps",
          [wrapperHeap, useJavaScript("Allocated", [wrapperHeap], context), string(""), value],
          context,
        ),
        context,
        (stepped, steps) => {
          // The loop writes what the reviver gives, which the heap holds.
          const changed = [
            ...new Set([
              ...getChanged(node, stepped, context),
              ...revivers.flatMap((reviver) => getChanged(reviver, stepped, context)),
              ...(context.heap === undefined ? [] : [context.heap]),
            ]),
          ];
          return loopStates(
            node,
            number(1),
            changed,
            withHeap(stepped, wrapperHeap, context),
            context,
            frame,
            (current, position, inner, again, stop) => {
              const getStep = (name: string) => field(index(steps, [position]), name);
              const holder = getStep("holder");
              const key = getStep("key");
              const next = apply("+", [position, getStep("skip")]);
              return translateJoined(
                node,
                current,
                context,
                (called, revived) =>
                  revive(
                    called,
                    holder,
                    [key, revived ?? getUndefined(context)],
                    inner,
                    (returned, result) =>
                      ifThenElse(
                        apply(">", [next, apply("Len", [steps])]),
                        stop(returned, result ?? getUndefined(context)),
                        bind(
                          returned,
                          "heap",
                          useJavaScript(
                            "Revived",
                            [
                              getHeap(returned.scope, node, context),
                              holder,
                              key,
                              result ?? getUndefined(context),
                            ],
                            context,
                          ),
                          context,
                          (stored, storedHeap) =>
                            again(withHeap(stored, storedHeap, context), next),
                        ),
                      ),
                  ),
                (joined) =>
                  ifThenElse(
                    apply("=", [getStep("kind"), string("exit")]),
                    joined(current, getStep("ref")),
                    readWith(node, holder, key, getters, current, context, inner, (found, read) => {
                      const foundHeap = getHeap(found.scope, node, context);
                      return ifThenElse(
                        apply("/\\", [
                          apply("=", [getStep("kind"), string("enter")]),
                          useJavaScript("SameValue", [read, getStep("ref")], context),
                          apply("=", [
                            useJavaScript("RevivedKeys", [foundHeap, read], context),
                            getStep("keys"),
                          ]),
                        ]),
                        again(found, apply("+", [position, number(1)])),
                        ifThenElse(
                          useJavaScript("IsObjectIn", [foundHeap, read], context),
                          isChangedRevival,
                          joined(found, read),
                        ),
                      );
                    }),
                  ),
                changed,
              );
            },
            continueWith,
          );
        },
      ),
  );

// JSON.parse of a text that a script builds, which throws a SyntaxError where the text isn't JSON,
// and otherwise makes its objects. A type that a script gives what it makes, or what its reviver
// takes, keeps its arrays outside the heap, which a text that the script builds can't tell.
// A reviver runs as InternalizeJSONProperty calls it, in a loop over the steps that the objects
// give, which stops where the reviver changes an object before the loop reaches it.
export const translateBuiltJsonParse = (
  node: ts.CallExpression,
  text: ts.Expression,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value?: Expression) => Formula,
): Formula => {
  const reviverNode = node.arguments.at(1);
  const reviver = reviverNode === undefined ? undefined : getCallback(reviverNode, path, context);
  if (
    reviverNode !== undefined &&
    (reviver === undefined ||
      !(
        ts.isArrowFunction(reviver) ||
        ts.isFunctionExpression(reviver) ||
        ts.isFunctionDeclaration(reviver)
      ))
  ) {
    throw new TlaTypeScriptError("tla-ts can't tell which function revives this", reviverNode);
  }
  if (reviver !== undefined) throwOnRevivedContext(reviver);
  const revivedParameter = reviver === undefined ? undefined : getParameters(reviver).at(1);
  const isKept =
    isOpenType(getContextualType(node, context)) &&
    (revivedParameter === undefined ||
      isOpenType(context.checker.getTypeAtLocation(revivedParameter)));
  const getters = getAccessorFunctions(node, "get", context).filter((getter) =>
    isRunnableGetter(getter, context),
  );
  const revive = (made: Path, value: Expression) =>
    reviver === undefined
      ? continueWith(made, value)
      : reviveMade(
          node,
          value,
          [reviver],
          getters,
          made,
          context,
          frame,
          (called, holder, passed, inner, next) =>
            inlineValues(
              reviver,
              passed,
              ts.isArrowFunction(reviver) ? undefined : { value: holder, method: reviver },
              called,
              context,
              inner,
              next,
            ),
          continueWith,
        );
  const heap = getHeap(path.scope, node, context);
  const parse = useJavaScript(
    "JSONParse",
    [
      heap,
      translateBuiltInValue("Array.prototype", node, context),
      translateExpression(text, path.scope, context),
    ],
    context,
  );
  return ifThenElse(
    translateHoldsJson(node, "parse", path.scope, context),
    bind(path, "parsed", parse, context, (after, parsed) => {
      const made = revive(
        withHeap(
          after,
          useJavaScript("AllocateEach", [heap, field(parsed, "objects")], context),
          context,
        ),
        field(parsed, "value"),
      );
      return ifThenElse(
        apply("=", [field(parsed, "end"), number(0)]),
        throwError("SyntaxError", after, node, context, frame),
        isKept
          ? made
          : ifThenElse(
              useJavaScript("HasJSONArray", [parsed], context),
              leaf(
                apply("Assert", [
                  boolean(false),
                  string(
                    "tla-ts can't keep the arrays of a JSON text that a script builds outside the heap",
                  ),
                ]),
              ),
              made,
            ),
      );
    }),
    leaf(
      apply("Assert", [
        boolean(false),
        string("tla-ts can't call JSON.parse where a script replaced it"),
      ]),
    ),
  );
};

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

// The objects that JSON.parse makes of a value, innermost first, each of which takes the ref that
// its position from one gives, and the value, which is the last's ref where it's an object.
export const getJsonHeapObjects = (
  node: ts.Node,
  value: unknown,
  getRef: (position: number) => Expression,
  context: Context,
) => {
  const objects = getJsonObjects(value);
  const translateValue = (inner: unknown) =>
    isJsonObject(inner)
      ? getRef(objects.indexOf(inner) + 1)
      : translateJsonPrimitive(node, inner, context);
  return {
    value: translateValue(value),
    objects: objects.map((object) =>
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
  };
};

// The heap once it holds the objects that JSON.parse makes of a value, the last of which is the
// value's own.
const translateJsonObjects = (node: ts.Node, value: unknown, heap: Expression, context: Context) =>
  useJavaScript(
    "AllocateEach",
    [
      heap,
      tuple(
        getJsonHeapObjects(
          node,
          value,
          (position) => useJavaScript("NextRef", [heap, number(position)], context),
          context,
        ).objects,
      ),
    ],
    context,
  );

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
// The value, the replacer, and the space that JSON.stringify takes.
const translateStringifyArguments = (node: ts.CallExpression, scope: Scope, context: Context) => {
  if (node.arguments.length > 3 || node.arguments.some(ts.isSpreadElement)) {
    throw new TlaTypeScriptError(`Unsupported call: ${node.getText()}`, node);
  }
  context.builtIns.add("BigInt.prototype");
  return [0, 1, 2].map((position) => {
    const argument = node.arguments.at(position);
    if (argument === undefined) return getUndefined(context);
    return getKind(argument, context) === "object" || isBuiltInObject(argument, context)
      ? translateObjectValue(argument, scope, context)
      : translateExpression(argument, scope, context);
  });
};

// What JSONStringify takes after the heap and its value, replacer, and space.
const getStringifyPrototypes = (node: ts.CallExpression, context: Context) => [
  translateBuiltInValue("Array.prototype", node, context),
  translateBuiltInValue("Function.prototype", node, context),
  boolean(!usesCollections(node.getSourceFile())),
];

export const translateStringify = (node: ts.CallExpression, scope: Scope, context: Context) => {
  const values = translateStringifyArguments(node, scope, context);
  return ifExpression(
    translateHoldsJson(node, "stringify", scope, context),
    useJavaScript(
      "JSONStringify",
      [getHeap(scope, node, context), ...values, ...getStringifyPrototypes(node, context)],
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

// JSON.stringify with a function that replaces each value it writes, which only a statement runs,
// as it calls the function: the functions that it may call.
export const getReplacers = (node: ts.Node, context: Context) => {
  const replacer =
    ts.isCallExpression(node) && isStringify(node, context) ? node.arguments.at(1) : undefined;
  const candidates =
    replacer === undefined || ts.isSpreadElement(replacer)
      ? []
      : getFunctionCandidates(replacer, context);
  return candidates.length > 0 ? candidates : undefined;
};

// JSON.stringify of an object where the script defines getters that tla-ts can run, which only a
// statement runs, as it reads each key in turn and runs the getter that it holds: the getters that
// it may run.
export const getStringifyGetters = (node: ts.Node, context: Context) => {
  const value =
    ts.isCallExpression(node) && isStringify(node, context) ? node.arguments.at(0) : undefined;
  const getters =
    value === undefined || ts.isSpreadElement(value) || getKind(value, context) !== "object"
      ? []
      : getOwnValueGetters(node, context);
  return getters.every((getter) => isRunnableGetter(getter, context)) ? getters : [];
};

// JSON.stringify with a replacer function or of an object whose getters may run, as
// SerializeJSONProperty runs it: it wraps the value in an object under "", and then reads each key
// in turn, running its getter, calls toJSON, which tla-ts stops at, and the replacer with the
// holder as this, and walks the keys of an object that the replacer gives before the next key, or
// those that a replacer array lists. The values that the replacer gave make new objects, which
// JSONStringify writes once the walk ends.
export const replaceJson = (
  node: ts.CallExpression,
  candidates: readonly FunctionNode[],
  getters: readonly FunctionNode[],
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value?: Expression) => Formula,
): Formula => {
  // The replacer takes a string key, and a holder and a value of any type, which the types of its
  // parameters must hold.
  candidates.forEach((candidate) => {
    const holder = candidate.parameters.find(
      (parameter) => ts.isIdentifier(parameter.name) && parameter.name.text === "this",
    );
    const key = getParameters(candidate).at(0);
    const value = getParameters(candidate).at(1);
    const isOpen = (parameter: ts.ParameterDeclaration) =>
      (context.checker.getTypeAtLocation(parameter).flags &
        (ts.TypeFlags.Any | ts.TypeFlags.Unknown)) !==
      0;
    const wrong = [
      ...(holder === undefined || isOpen(holder) ? [] : [holder]),
      ...(key === undefined ||
      context.checker.isTypeAssignableTo(
        context.checker.getStringType(),
        context.checker.getTypeAtLocation(key),
      )
        ? []
        : [key]),
      ...(value === undefined || isOpen(value) ? [] : [value]),
    ].at(0);
    if (wrong !== undefined) {
      throw new TlaTypeScriptError(
        "tla-ts can't pass a replacer values that its parameter's type doesn't hold",
        wrong,
      );
    }
  });
  // The walk keeps the objects outside the heap that it writes, so the replacer may change only
  // the heap and primitives.
  const primitive =
    ts.TypeFlags.StringLike |
    ts.TypeFlags.NumberLike |
    ts.TypeFlags.BooleanLike |
    ts.TypeFlags.BigIntLike |
    ts.TypeFlags.ESSymbolLike |
    ts.TypeFlags.Undefined |
    ts.TypeFlags.Null;
  const isPrimitive = (type: ts.Type): boolean =>
    type.isUnion() ? type.types.every(isPrimitive) : (type.flags & primitive) !== 0;
  const object = getChanged(node, path, context).find(
    (symbol) =>
      symbol !== context.heap &&
      !isPrimitive(context.checker.getTypeOfSymbolAtLocation(symbol, node)),
  );
  if (object !== undefined) {
    throw new TlaTypeScriptError(
      `tla-ts can't call a ${candidates.length > 0 ? "replacer" : "getter"} that changes ${object.name}, which the heap doesn't hold`,
      node,
    );
  }
  return allocateAll(
    getAllocated(node, context).filter((inner) => !path.scope.allocated.has(inner)),
    path,
    context,
    (allocated) => {
      const values = translateStringifyArguments(node, allocated.scope, context);
      const prototypes = getStringifyPrototypes(node, context);
      const heap = getHeap(allocated.scope, node, context);
      // JSON.stringify lists a replacer array's keys, and then converts its space, before it calls
      // the replacer.
      const walk = bind(allocated, "replacer", values[1], context, (bound, replacer) =>
        bind(
          bound,
          "list",
          candidates.length > 0
            ? getUndefined(context)
            : useJavaScript("JSONList", [heap, replacer, prototypes[2]], context),
          context,
          (listed, list) =>
            bind(
              listed,
              "space",
              useJavaScript("JSONSpace", [heap, values[2]], context),
              context,
              (spaced, space) =>
                bind(
                  spaced,
                  "heap",
                  useJavaScript(
                    "Allocate",
                    [
                      heap,
                      useJavaScript(
                        "PairsObject",
                        [tuple([tuple([string(""), values[0]])])],
                        context,
                      ),
                    ],
                    context,
                  ),
                  context,
                  (wrapped, wrappedHeap) =>
                    loopStates(
                      node,
                      useJavaScript(
                        "JSONReplacing",
                        [useJavaScript("Allocated", [wrappedHeap], context)],
                        context,
                      ),
                      // The walk makes objects of what the replacer gives, which the heap holds.
                      [
                        ...new Set([
                          ...getChanged(node, wrapped, context),
                          ...(context.heap === undefined ? [] : [context.heap]),
                        ]),
                      ],
                      withHeap(wrapped, wrappedHeap, context),
                      context,
                      frame,
                      (current, frames, inner, again, stop) => {
                        const currentHeap = getHeap(current.scope, node, context);
                        const close = ifThenElse(
                          apply("=", [apply("Len", [frames]), number(1)]),
                          stop(current, useJavaScript("JSONReplaced", [frames], context)),
                          bind(
                            current,
                            "closed",
                            useJavaScript("JSONClose", [currentHeap, frames], context),
                            context,
                            (closed, record) =>
                              again(
                                withHeap(closed, field(record, "heap"), context),
                                field(record, "frames"),
                              ),
                          ),
                        );
                        const got = useJavaScript("JSONRead", [currentHeap, frames], context);
                        const readNext = (next: (path: Path, value: Expression) => Formula) =>
                          getters.length === 0
                            ? bind(current, "value", got, context, next)
                            : bind(
                                current,
                                "getter",
                                useJavaScript("JSONGetter", [currentHeap, frames], context),
                                context,
                                (bound, getter) =>
                                  callValue(
                                    node,
                                    getters,
                                    getter,
                                    useJavaScript("JSONHolder", [frames], context),
                                    [],
                                    bound,
                                    context,
                                    inner,
                                    (otherwise) => otherwise(bound, got),
                                    // An array outside the heap that a getter gives may not be
                                    // the one that a later read checks the walk still holds.
                                    (after, value) =>
                                      ifThenElse(
                                        apply("/\\", [
                                          apply("#", [getter, getUndefined(context)]),
                                          useJavaScript("IsSequenceValue", [value], context),
                                        ]),
                                        leaf(
                                          apply("Assert", [
                                            boolean(false),
                                            string(
                                              "tla-ts can't walk an array outside the heap that a getter gives",
                                            ),
                                          ]),
                                        ),
                                        bind(after, "value", value, context, next),
                                      ),
                                  ),
                              );
                        const replaceWith = (
                          called: Path,
                          value: Expression,
                          result: Expression,
                        ) => {
                          const calledHeap = getHeap(called.scope, node, context);
                          return ifThenElse(
                            useJavaScript("JSONIsBigInt", [calledHeap, result], context),
                            throwTypeError(called, node, context, inner),
                            again(
                              called,
                              useJavaScript(
                                "JSONReplace",
                                [calledHeap, frames, value, result, prototypes[2], list],
                                context,
                              ),
                            ),
                          );
                        };
                        const stopToJSON = leaf(
                          apply("Assert", [boolean(false), string("tla-ts can't call toJSON")]),
                        );
                        const replace = readNext((read, value) => {
                          const proceed = (after: Path) =>
                            candidates.length === 0
                              ? replaceWith(after, value, value)
                              : callValue(
                                  node,
                                  candidates,
                                  replacer,
                                  useJavaScript("JSONHolder", [frames], context),
                                  [useJavaScript("JSONKey", [frames], context), value],
                                  after,
                                  context,
                                  inner,
                                  () =>
                                    leaf(
                                      apply("Assert", [
                                        boolean(false),
                                        string("tla-ts can't tell which function replaces this"),
                                      ]),
                                    ),
                                  (called, result) => replaceWith(called, value, result),
                                );
                          const readHeap = getHeap(read.scope, node, context);
                          const checked = ifThenElse(
                            useJavaScript(
                              "JSONHasToJSON",
                              [readHeap, value, ...prototypes],
                              context,
                            ),
                            stopToJSON,
                            proceed(read),
                          );
                          // SerializeJSONProperty reads an object's toJSON, which a getter may
                          // answer.
                          return getters.length === 0
                            ? checked
                            : ifThenElse(
                                apply("/\\", [
                                  useJavaScript("IsRef", [value], context),
                                  apply("#", [
                                    useJavaScript(
                                      "GetterOf",
                                      [readHeap, value, string("toJSON")],
                                      context,
                                    ),
                                    getUndefined(context),
                                  ]),
                                ]),
                                readWith(
                                  node,
                                  value,
                                  string("toJSON"),
                                  getters,
                                  read,
                                  context,
                                  inner,
                                  (after, toJSON) =>
                                    ifThenElse(
                                      apply("=", [
                                        useJavaScript(
                                          "TypeOfIn",
                                          [getHeap(after.scope, node, context), toJSON],
                                          context,
                                        ),
                                        string("function"),
                                      ]),
                                      stopToJSON,
                                      proceed(after),
                                    ),
                                ),
                                checked,
                              );
                        });
                        return ifThenElse(
                          useJavaScript("JSONIsClosing", [frames], context),
                          close,
                          replace,
                        );
                      },
                      (after, replaced) =>
                        bind(
                          after,
                          "stringified",
                          useJavaScript(
                            "JSONStringifyKeys",
                            [
                              getHeap(after.scope, node, context),
                              replaced,
                              list,
                              space,
                              ...prototypes,
                            ],
                            context,
                          ),
                          context,
                          (done, text) =>
                            ifThenElse(
                              useJavaScript("IsError", [text], context),
                              throwTypeError(done, node, context, frame),
                              continueWith(done, text),
                            ),
                        ),
                    ),
                ),
            ),
        ),
      );
      return ifThenElse(
        translateHoldsJson(node, "stringify", allocated.scope, context),
        walk,
        leaf(
          apply("Assert", [
            boolean(false),
            string("tla-ts can't call JSON.stringify where a script replaced it"),
          ]),
        ),
      );
    },
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
  revival.candidates.forEach(throwOnRevivedContext);
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
      return ifThenElse(
        translateHoldsJson(node, "parse", allocated.scope, context),
        bind(
          allocated,
          "heap",
          translateJsonObjects(node, value, heap, context),
          context,
          (made, madeHeap) =>
            reviveMade(
              node,
              isJsonObject(value) ? getRef(value) : translateJsonPrimitive(node, value, context),
              revival.candidates,
              getters,
              withHeap(made, madeHeap, context),
              context,
              frame,
              // A function that the call itself writes is the one it calls.
              (at, holder, passed, inner, next) =>
                literal === undefined
                  ? callValue(
                      node,
                      revival.candidates,
                      translateExpression(revival.reviver, allocated.scope, context),
                      holder,
                      passed,
                      at,
                      context,
                      inner,
                      () =>
                        leaf(
                          apply("Assert", [
                            boolean(false),
                            string("tla-ts can't tell which function revives this"),
                          ]),
                        ),
                      next,
                    )
                  : inlineValues(
                      literal,
                      passed,
                      ts.isArrowFunction(literal) ? undefined : { value: holder, method: literal },
                      at,
                      context,
                      inner,
                      next,
                    ),
              continueWith,
            ),
        ),
        replaced,
      );
    },
  );
};
