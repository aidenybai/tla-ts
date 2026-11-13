import ts from "@typescript/typescript6";
import type { Expression } from "../ast";
import { allocate, type Frame, type Path, throwTypeError, translateJoined } from "./actions";
import {
  type Context,
  findNodes,
  getAccessorFunctions,
  getParameters,
  getSymbol,
  getUndefined,
  isMethodCall,
  skipCasts,
} from "./context";
import { getPrimitiveArgument, STRING_METHODS, translatePrimitiveMethod } from "./collections";
import { BITWISE_OPERATORS, concatenate, translateExpression } from "./expressions";
import { type Formula, ifThenElse, leaf } from "./formula";
import { getHeap } from "./heap";
import { getBuiltIn } from "./intrinsics";
import { useJavaScript } from "./javascript";
import { bind, callValue, getMethods, getWrittenFunctions, isNullish, read } from "./protocols";
import { apply, boolean, not, string, tuple } from "./tla";
import { getKind, isEvery } from "./types";

// The hint that ToPrimitive takes, which decides whether it calls valueOf or toString first.
type Hint = "default" | "number" | "string";

// An operation that converts the objects among its operands to primitives, which runs their
// valueOf and toString methods, and then computes its value from the primitives.
interface Conversion {
  operands: readonly ts.Expression[];
  // The hint that each operand converts with.
  hints: readonly Hint[];
  // The positions of the operands in the order that they convert, where it isn't the order that
  // they evaluate in.
  order?: readonly number[];
  // The methods that the operation reads from objects among its operands before it converts them.
  lookups?: readonly Lookup[];
  combine: (primitives: readonly Expression[]) => Expression;
}

// A read of an object operand's method under a well-known symbol: a string's split, replace, and
// replaceAll read the method that they'd call in their place, and includes, startsWith, endsWith,
// and replaceAll read Symbol.match to tell a regexp.
interface Lookup {
  position: number;
  key: "@@match" | "@@replace" | "@@split";
}

// The methods of a string that read a method of an object that they take for their first argument.
const STRING_LOOKUPS = new Map<string, Lookup["key"][]>([
  ["split", ["@@split"]],
  ["replace", ["@@replace"]],
  ["replaceAll", ["@@match", "@@replace"]],
  ["includes", ["@@match"]],
  ["startsWith", ["@@match"]],
  ["endsWith", ["@@match"]],
]);

const CONVERSION_KEYS = ["@@toPrimitive", "valueOf", "toString"];

const NUMBER_OPERATIONS = new Map([
  [ts.SyntaxKind.MinusToken, "Subtract"],
  [ts.SyntaxKind.AsteriskToken, "Multiply"],
  [ts.SyntaxKind.SlashToken, "Divide"],
  [ts.SyntaxKind.PercentToken, "Remainder"],
  [ts.SyntaxKind.AsteriskAsteriskToken, "Power"],
]);

const WRAPPERS = new Set(["Boolean", "Number", "String"]);

// The operator that each compound assignment applies.
const COMPOUND_OPERATORS = new Map([
  [ts.SyntaxKind.PlusEqualsToken, ts.SyntaxKind.PlusToken],
  [ts.SyntaxKind.MinusEqualsToken, ts.SyntaxKind.MinusToken],
  [ts.SyntaxKind.AsteriskEqualsToken, ts.SyntaxKind.AsteriskToken],
  [ts.SyntaxKind.SlashEqualsToken, ts.SyntaxKind.SlashToken],
  [ts.SyntaxKind.PercentEqualsToken, ts.SyntaxKind.PercentToken],
  [ts.SyntaxKind.AsteriskAsteriskEqualsToken, ts.SyntaxKind.AsteriskAsteriskToken],
  [ts.SyntaxKind.AmpersandEqualsToken, ts.SyntaxKind.AmpersandToken],
  [ts.SyntaxKind.BarEqualsToken, ts.SyntaxKind.BarToken],
  [ts.SyntaxKind.CaretEqualsToken, ts.SyntaxKind.CaretToken],
  [ts.SyntaxKind.LessThanLessThanEqualsToken, ts.SyntaxKind.LessThanLessThanToken],
  [ts.SyntaxKind.GreaterThanGreaterThanEqualsToken, ts.SyntaxKind.GreaterThanGreaterThanToken],
  [
    ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken,
    ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken,
  ],
]);

// A compound assignment to a variable, which converts its operands as its operator does and then
// assigns the result.
export const isCompoundAssignment = (
  node: ts.Node,
): node is ts.BinaryExpression & { left: ts.Identifier } =>
  ts.isBinaryExpression(node) &&
  COMPOUND_OPERATORS.has(node.operatorToken.kind) &&
  ts.isIdentifier(node.left);

// An object that a script declares, or a Boolean, Number, or String, which ToPrimitive converts
// through its methods. ToPrimitive gives back a primitive that a wrapper's type also takes.
const isObjectOperand = (node: ts.Expression, context: Context) => {
  const type = context.checker.getTypeAtLocation(skipCasts(node));
  const symbol = type.getSymbol();
  const isWrapper =
    symbol !== undefined &&
    WRAPPERS.has(symbol.getName()) &&
    (symbol.declarations ?? []).every(
      (declaration) => declaration.getSourceFile().isDeclarationFile,
    );
  return (
    (isWrapper || getKind(skipCasts(node), context) === "object") &&
    type.getCallSignatures().length === 0
  );
};

const hasFlags = (node: ts.Expression, flags: ts.TypeFlags, context: Context) =>
  (context.checker.getTypeAtLocation(skipCasts(node)).flags & flags) !== 0;

// A primitive operand, which ToPrimitive gives back.
// A value of type any, which the conversion tells apart as it runs: ToPrimitive converts an object
// that the heap holds, and gives back a primitive. Any other value stops the check.
const isAnyOperand = (node: ts.Expression, context: Context) =>
  hasFlags(node, ts.TypeFlags.Any, context);

const isPrimitiveOperand = (node: ts.Expression, context: Context) =>
  hasFlags(
    node,
    ts.TypeFlags.NumberLike |
      ts.TypeFlags.StringLike |
      ts.TypeFlags.BooleanLike |
      ts.TypeFlags.Undefined |
      ts.TypeFlags.Null,
    context,
  );

// A primitive that an operator on numbers converts, which tla-ts otherwise rejects.
const isConvertedPrimitive = (node: ts.Expression, context: Context) =>
  hasFlags(
    node,
    ts.TypeFlags.StringLike | ts.TypeFlags.BooleanLike | ts.TypeFlags.Undefined | ts.TypeFlags.Null,
    context,
  ) && !hasFlags(node, ts.TypeFlags.NumberLike, context);

// The conversion that a node makes, where one of its operands is an object.
export const getConversion = (node: ts.Node, context: Context): Conversion | undefined => {
  if (context.heap === undefined) return undefined;
  const plain = (value: Expression) =>
    context.hasSpecialNumbers ? value : useJavaScript("PlainNumber", [value], context);
  const toNumber = (value: Expression) => plain(useJavaScript("ToNumber", [value], context));
  // An operation converts objects, and an operator on numbers converts the primitives that tla-ts
  // otherwise rejects, too.
  const make = (
    operands: readonly ts.Expression[],
    hint: Hint,
    combine: Conversion["combine"],
    isOnNumbers = false,
    isAnyConverted = isOnNumbers,
  ): Conversion | undefined =>
    operands.some(
      (operand) =>
        isObjectOperand(operand, context) ||
        (isOnNumbers && isConvertedPrimitive(operand, context)) ||
        (isAnyConverted && isAnyOperand(operand, context)),
    ) &&
    operands.every(
      (operand) =>
        isObjectOperand(operand, context) ||
        isPrimitiveOperand(operand, context) ||
        (isAnyConverted && isAnyOperand(operand, context)),
    )
      ? { operands, hints: operands.map(() => hint), combine }
      : undefined;
  // A string's method converts an object that it takes with the hint of the parameter, and then
  // with ToString or ToNumber. split converts its limit before its separator, and padStart and
  // padEnd convert their filler only where they pad.
  if (
    isMethodCall(node) &&
    isEvery(context.checker.getTypeAtLocation(node.expression.expression), ts.TypeFlags.StringLike)
  ) {
    const name = node.expression.name.text;
    const method = STRING_METHODS.get(name);
    const values = node.arguments;
    const kinds = values.map((value, position) =>
      isObjectOperand(value, context)
        ? "object"
        : method && getPrimitiveArgument(name, method, position, value, context),
    );
    if (
      method === undefined ||
      values.length > method.parameters.length ||
      values.some(ts.isSpreadElement) ||
      !kinds.includes("object") ||
      kinds.includes(undefined) ||
      (name.startsWith("pad") && kinds[1] === "object")
    ) {
      return undefined;
    }
    return {
      operands: [node.expression.expression, ...values],
      hints: ["string", ...method.parameters.slice(0, values.length)],
      order: name === "split" && values.length === 2 ? [0, 2, 1] : undefined,
      lookups:
        kinds[0] === "object"
          ? (STRING_LOOKUPS.get(name) ?? []).map((key) => ({ position: 1, key }))
          : undefined,
      combine: ([text, ...primitives]) =>
        translatePrimitiveMethod(
          method,
          text,
          primitives.map((primitive, position) =>
            kinds[position] === "kept"
              ? primitive
              : method.parameters[position] === "number"
                ? toNumber(primitive)
                : useJavaScript("StringOf", [primitive], context),
          ),
          context,
        ),
    };
  }
  if (
    ts.isCallExpression(node) &&
    ts.isPropertyAccessExpression(node.expression) &&
    getBuiltIn(node.expression.expression, context) === "Math"
  ) {
    const method = node.expression.name.text;
    const operands = node.arguments;
    // A value of type any that Math reads converts as ToNumber does, without the heap.
    if (operands.some((operand) => isAnyOperand(operand, context))) return undefined;
    const toNumbers = (primitives: readonly Expression[]) =>
      primitives.map((primitive) => useJavaScript("ToNumber", [primitive], context));
    if (operands.some(ts.isSpreadElement)) return undefined;
    if ((method === "max" || method === "min") && operands.length > 0) {
      return make(
        operands,
        "number",
        (primitives) =>
          plain(
            toNumbers(primitives).reduce((result, value) =>
              useJavaScript(method === "max" ? "Maximum" : "Minimum", [result, value], context),
            ),
          ),
        true,
      );
    }
    if (method === "abs" && operands.length === 1) {
      return make(
        operands,
        "number",
        (primitives) => plain(useJavaScript("AbsoluteValue", toNumbers(primitives), context)),
        true,
      );
    }
    if (method === "pow" && operands.length === 2) {
      return make(
        operands,
        "number",
        (primitives) => plain(useJavaScript("Power", toNumbers(primitives), context)),
        true,
      );
    }
    return undefined;
  }
  if (ts.isCallExpression(node) && ts.isIdentifier(node.expression)) {
    const declarations = getSymbol(node.expression, context.checker)?.declarations ?? [];
    const argument = node.arguments.at(0);
    const isGlobal =
      declarations.length > 0 &&
      declarations.every((declaration) => declaration.getSourceFile().isDeclarationFile);
    if (!isGlobal || argument === undefined || ts.isSpreadElement(argument)) return undefined;
    if (node.expression.text === "Number") {
      return make([argument], "number", (primitives) => toNumber(primitives[0]));
    }
    if (node.expression.text === "String") {
      return make([argument], "string", (primitives) =>
        useJavaScript("StringOf", [primitives[0]], context),
      );
    }
    return undefined;
  }
  if (ts.isPrefixUnaryExpression(node)) {
    if (node.operator === ts.SyntaxKind.PlusToken) {
      return make([node.operand], "number", (primitives) => toNumber(primitives[0]));
    }
    if (node.operator === ts.SyntaxKind.MinusToken) {
      return make([node.operand], "number", (primitives) =>
        plain(
          useJavaScript("Negate", [useJavaScript("ToNumber", [primitives[0]], context)], context),
        ),
      );
    }
    if (node.operator === ts.SyntaxKind.TildeToken) {
      return make([node.operand], "number", (primitives) =>
        useJavaScript("BitwiseNot", [useJavaScript("ToNumber", [primitives[0]], context)], context),
      );
    }
    return undefined;
  }
  if (ts.isTemplateExpression(node)) {
    return make(
      node.templateSpans.map((span) => span.expression),
      "string",
      (primitives) =>
        concatenate([
          ...(node.head.text === "" ? [] : [string(node.head.text)]),
          ...node.templateSpans.flatMap((span, position) => {
            const value = useJavaScript("StringOf", [primitives[position]], context);
            return span.literal.text === "" ? [value] : [value, string(span.literal.text)];
          }),
        ]),
    );
  }
  if (!ts.isBinaryExpression(node)) return undefined;
  if (COMPOUND_OPERATORS.has(node.operatorToken.kind) && !isCompoundAssignment(node)) {
    return undefined;
  }
  const kind = COMPOUND_OPERATORS.get(node.operatorToken.kind) ?? node.operatorToken.kind;
  const operands = [node.left, node.right];
  // + joins strings, which tla-ts does without converting.
  if (kind === ts.SyntaxKind.PlusToken) {
    const isOnNumbers = !operands.some((operand) =>
      hasFlags(operand, ts.TypeFlags.StringLike, context),
    );
    // + joins a string with a value of type any as it is, but += must convert the value it reads.
    return make(
      operands,
      "default",
      (primitives) => plain(useJavaScript("AddPrimitives", [...primitives], context)),
      isOnNumbers,
      isOnNumbers || isCompoundAssignment(node),
    );
  }
  const operation = NUMBER_OPERATIONS.get(kind) ?? BITWISE_OPERATORS.get(kind);
  if (operation !== undefined) {
    return make(
      operands,
      "number",
      (primitives) =>
        plain(
          useJavaScript(
            operation,
            primitives.map((primitive) => useJavaScript("ToNumber", [primitive], context)),
            context,
          ),
        ),
      true,
    );
  }
  // == converts an object that it compares with a primitive other than null and undefined.
  if (kind === ts.SyntaxKind.EqualsEqualsToken || kind === ts.SyntaxKind.ExclamationEqualsToken) {
    const isNullish = (operand: ts.Expression) =>
      (context.checker.getTypeAtLocation(skipCasts(operand)).flags &
        (ts.TypeFlags.Undefined | ts.TypeFlags.Null | ts.TypeFlags.Void)) !==
      0;
    if (operands.filter((operand) => isObjectOperand(operand, context)).length !== 1) {
      return undefined;
    }
    if (operands.some(isNullish)) return undefined;
    return make(operands, "default", (primitives) => {
      const isEqual = useJavaScript("LooseEquals", [tuple([]), ...primitives], context);
      return kind === ts.SyntaxKind.EqualsEqualsToken ? isEqual : not(isEqual);
    });
  }
  // a > b and a <= b compare b with a, though they convert a first. Two strings don't convert, and
  // a value of type any compares as it is.
  const isOrdered =
    !operands.every((operand) => hasFlags(operand, ts.TypeFlags.StringLike, context)) &&
    !operands.some((operand) => isAnyOperand(operand, context));
  const compare = (name: string, left: Expression, right: Expression) =>
    useJavaScript(name, [left, right], context);
  if (kind === ts.SyntaxKind.LessThanToken || kind === ts.SyntaxKind.GreaterThanToken) {
    const isSwapped = kind === ts.SyntaxKind.GreaterThanToken;
    return make(
      operands,
      "number",
      (primitives) =>
        isSwapped
          ? compare("LessThanPrimitives", primitives[1], primitives[0])
          : compare("LessThanPrimitives", primitives[0], primitives[1]),
      isOrdered,
    );
  }
  if (kind === ts.SyntaxKind.LessThanEqualsToken || kind === ts.SyntaxKind.GreaterThanEqualsToken) {
    const isSwapped = kind === ts.SyntaxKind.GreaterThanEqualsToken;
    return make(
      operands,
      "number",
      (primitives) =>
        isSwapped
          ? compare("LessOrEqualPrimitives", primitives[1], primitives[0])
          : compare("LessOrEqualPrimitives", primitives[0], primitives[1]),
      isOrdered,
    );
  }
  return undefined;
};

// The functions that converting an object may run: its valueOf, toString, and Symbol.toPrimitive
// methods, the Symbol.split and Symbol.replace methods that a string's method calls in its place,
// and the getters it reads them through.
export const getConversionFunctions = (node: ts.Node, context: Context) => [
  ...[
    ...CONVERSION_KEYS,
    ...(getConversion(node, context)?.lookups ?? []).map((lookup) => lookup.key),
  ].flatMap((key) => getWrittenFunctions(node, key, context)),
  ...getAccessorFunctions(node, "get", context),
];

// The Symbol.toPrimitive methods that tla-ts calls, which can't see the hint that it doesn't pass.
const getExoticMethods = (node: ts.Node, context: Context) =>
  getMethods(node, "@@toPrimitive", context).filter(
    (method) =>
      getParameters(method).length === 0 &&
      findNodes(method, ts.isIdentifier).every((name) => name.text !== "arguments"),
  );

// ToPrimitive of an object, which calls its Symbol.toPrimitive method where it has one, and
// otherwise its valueOf and toString methods in the order its hint gives. It throws a TypeError
// where Symbol.toPrimitive isn't callable or gives an object, or where neither of the others gives
// a primitive.
const toPrimitive = (
  site: ts.Node,
  value: Expression,
  hint: Hint,
  path: Path,
  context: Context,
  frame: Frame,
  throwWith: (path: Path) => Formula,
  continueWith: (path: Path, primitive: Expression) => Formula,
): Formula => {
  const isObject = (current: Path, inner: Expression) =>
    useJavaScript("IsObjectIn", [getHeap(current.scope, site, context), inner], context);
  const ordinary = (current: Path, names: readonly string[]): Formula => {
    const name = names[0];
    if (name === undefined) return throwWith(current);
    const rest = names.slice(1);
    return read(site, value, name, current, context, frame, (found, method) =>
      ifThenElse(
        apply("=", [
          useJavaScript("TypeOfIn", [getHeap(found.scope, site, context), method], context),
          string("function"),
        ]),
        callValue(
          site,
          getMethods(site, name, context),
          method,
          value,
          [],
          found,
          context,
          frame,
          (next) =>
            next(
              found,
              useJavaScript(
                "ConvertWith",
                [getHeap(found.scope, site, context), value, method],
                context,
              ),
            ),
          (after, result) =>
            bind(after, "converted", result, context, (bound, held) =>
              ifThenElse(isObject(bound, held), ordinary(bound, rest), continueWith(bound, held)),
            ),
        ),
        ordinary(found, rest),
      ),
    );
  };
  return ifThenElse(
    isObject(path, value),
    read(site, value, "@@toPrimitive", path, context, frame, (found, exotic) =>
      ifThenElse(
        isNullish(exotic, context),
        ordinary(found, hint === "string" ? ["toString", "valueOf"] : ["valueOf", "toString"]),
        ifThenElse(
          apply("=", [
            useJavaScript("TypeOfIn", [getHeap(found.scope, site, context), exotic], context),
            string("function"),
          ]),
          callValue(
            site,
            getExoticMethods(site, context),
            exotic,
            value,
            [],
            found,
            context,
            frame,
            () =>
              leaf(
                apply("Assert", [
                  boolean(false),
                  string("tla-ts can't call this Symbol.toPrimitive method"),
                ]),
              ),
            (after, result) =>
              bind(after, "converted", result, context, (bound, held) =>
                ifThenElse(isObject(bound, held), throwWith(bound), continueWith(bound, held)),
              ),
          ),
          throwWith(found),
        ),
      ),
    ),
    continueWith(path, value),
  );
};

// ToPrimitive of a value as a statement, which throws the TypeError where the object's methods give
// no primitive.
export const runToPrimitive = (
  site: ts.Node,
  value: Expression,
  hint: Hint,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, primitive: Expression) => Formula,
) =>
  translateJoined(
    site,
    path,
    context,
    (after, primitive) => continueWith(after, primitive ?? value),
    (next) =>
      translateJoined(
        site,
        path,
        context,
        (after) => throwTypeError(after, site, context, frame),
        (throwWith) => toPrimitive(site, value, hint, path, context, frame, throwWith, next),
      ),
  );

// Whether an operation's value may be what its Symbol.split or Symbol.replace method returns, which
// its type doesn't describe: each method returns that type, or what takes the value reads it as
// unknown.
const isCalledInPlace = (node: ts.Expression, key: string, context: Context) => {
  const contextual = context.checker.getContextualType(node);
  const type = context.checker.getTypeAtLocation(node);
  return (
    (contextual !== undefined &&
      (contextual.flags & (ts.TypeFlags.Unknown | ts.TypeFlags.Any)) !== 0) ||
    getMethods(node, key, context).every((method) => {
      const signature = context.checker.getSignatureFromDeclaration(method);
      return (
        signature !== undefined &&
        context.checker.isTypeAssignableTo(signature.getReturnType(), type)
      );
    })
  );
};

// Runs a conversion as a statement: it makes each operand's objects and evaluates it, converts each
// in turn, and gives the value that the operation computes from the primitives.
export const runConversion = (
  node: ts.Expression,
  conversion: Conversion,
  path: Path,
  context: Context,
  frame: Frame,
  continueWith: (path: Path, value: Expression) => Formula,
): Formula => {
  const evaluate = (
    current: Path,
    remaining: readonly ts.Expression[],
    values: readonly Expression[],
  ): Formula => {
    const operand = remaining[0];
    if (operand === undefined) return look(current, values, conversion.lookups ?? []);
    return allocate(operand, current, context, (allocated) =>
      bind(
        allocated,
        "operand",
        translateExpression(operand, allocated.scope, context),
        context,
        (bound, held) => evaluate(bound, remaining.slice(1), [...values, held]),
      ),
    );
  };
  // Reads an object's method under a well-known symbol: Symbol.match marks a regexp, which includes,
  // startsWith, and endsWith reject with a TypeError, and the operation calls a Symbol.split or
  // Symbol.replace method with the string and its other argument in its place, where a method that
  // isn't a function is a TypeError.
  const look = (
    current: Path,
    values: readonly Expression[],
    lookups: readonly Lookup[],
  ): Formula => {
    const lookup = lookups[0];
    if (lookup === undefined) return convert(current, values, []);
    const value = values[lookup.position];
    const stop = (message: string) => leaf(apply("Assert", [boolean(false), string(message)]));
    return translateJoined(
      node,
      current,
      context,
      (after) => look(after, values, lookups.slice(1)),
      (next) =>
        ifThenElse(
          useJavaScript("IsObjectIn", [getHeap(current.scope, node, context), value], context),
          read(node, value, lookup.key, current, context, frame, (found, method) =>
            lookup.key === "@@match"
              ? ifThenElse(
                  apply("/\\", [
                    not(apply("=", [method, getUndefined(context)])),
                    useJavaScript("ToBoolean", [method], context),
                  ]),
                  lookups.some((other) => other.key === "@@replace")
                    ? stop("tla-ts can't replace all of the matches of a regexp in a string")
                    : throwTypeError(found, node, context, frame),
                  next(found),
                )
              : ifThenElse(
                  isNullish(method, context),
                  next(found),
                  ifThenElse(
                    apply("=", [
                      useJavaScript(
                        "TypeOfIn",
                        [getHeap(found.scope, node, context), method],
                        context,
                      ),
                      string("function"),
                    ]),
                    isCalledInPlace(node, lookup.key, context)
                      ? callValue(
                          node,
                          getMethods(node, lookup.key, context),
                          method,
                          value,
                          [values[0], values[2] ?? getUndefined(context)],
                          found,
                          context,
                          frame,
                          () => stop(`tla-ts can't call this Symbol.${lookup.key.slice(2)} method`),
                          continueWith,
                        )
                      : stop(`tla-ts can't call this Symbol.${lookup.key.slice(2)} method`),
                    throwTypeError(found, node, context, frame),
                  ),
                ),
          ),
          next(current),
        ),
    );
  };
  const order = conversion.order ?? conversion.operands.map((_, position) => position);
  const convert = (
    current: Path,
    values: readonly Expression[],
    converted: readonly Expression[],
  ): Formula => {
    const position = order[converted.length];
    if (position === undefined) {
      const primitives = values.map((_, inner) => converted[order.indexOf(inner)]);
      return bind(current, "converted", conversion.combine(primitives), context, continueWith);
    }
    return runToPrimitive(
      node,
      values[position],
      conversion.hints[position],
      current,
      context,
      frame,
      (after, primitive) => convert(after, values, [...converted, primitive]),
    );
  };
  return evaluate(path, conversion.operands, []);
};
