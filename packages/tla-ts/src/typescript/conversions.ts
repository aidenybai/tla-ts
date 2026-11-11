import ts from "@typescript/typescript6";
import type { Expression } from "../ast";
import { allocate, type Frame, type Path, throwTypeError, translateJoined } from "./actions";
import {
  type Context,
  findNodes,
  getAccessorFunctions,
  getParameters,
  getSymbol,
  skipCasts,
} from "./context";
import { concatenate, translateExpression } from "./expressions";
import { type Formula, ifThenElse, leaf } from "./formula";
import { getHeap } from "./heap";
import { useJavaScript } from "./javascript";
import { bind, callValue, getMethods, getWrittenFunctions, isNullish, read } from "./protocols";
import { apply, boolean, not, string, tuple } from "./tla";
import { getKind } from "./types";

// The hint that ToPrimitive takes, which decides whether it calls valueOf or toString first.
type Hint = "default" | "number" | "string";

// An operation that converts the objects among its operands to primitives, which runs their
// valueOf and toString methods, and then computes its value from the primitives.
interface Conversion {
  operands: readonly ts.Expression[];
  hint: Hint;
  combine: (primitives: readonly Expression[]) => Expression;
}

const CONVERSION_KEYS = ["@@toPrimitive", "valueOf", "toString"];

const NUMBER_OPERATIONS = new Map([
  [ts.SyntaxKind.MinusToken, "Subtract"],
  [ts.SyntaxKind.AsteriskToken, "Multiply"],
  [ts.SyntaxKind.SlashToken, "Divide"],
  [ts.SyntaxKind.PercentToken, "Remainder"],
  [ts.SyntaxKind.AsteriskAsteriskToken, "Power"],
]);

const WRAPPERS = new Set(["Boolean", "Number", "String"]);

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
  ): Conversion | undefined =>
    operands.some(
      (operand) =>
        isObjectOperand(operand, context) ||
        (isOnNumbers && isConvertedPrimitive(operand, context)),
    ) &&
    operands.every(
      (operand) => isObjectOperand(operand, context) || isPrimitiveOperand(operand, context),
    )
      ? { operands, hint, combine }
      : undefined;
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
  const kind = node.operatorToken.kind;
  const operands = [node.left, node.right];
  // + joins strings, which tla-ts does without converting.
  if (kind === ts.SyntaxKind.PlusToken) {
    return make(
      operands,
      "default",
      (primitives) => plain(useJavaScript("AddPrimitives", [...primitives], context)),
      !operands.some((operand) => hasFlags(operand, ts.TypeFlags.StringLike, context)),
    );
  }
  const operation = NUMBER_OPERATIONS.get(kind);
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
  // a > b and a <= b compare b with a, though they convert a first. Two strings don't convert.
  const isOrdered = !operands.every((operand) =>
    hasFlags(operand, ts.TypeFlags.StringLike, context),
  );
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
// methods, and the getters it reads them through.
export const getConversionFunctions = (node: ts.Node, context: Context) => [
  ...CONVERSION_KEYS.flatMap((key) => getWrittenFunctions(node, key, context)),
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
    if (operand === undefined) return convert(current, values, []);
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
  const convert = (
    current: Path,
    values: readonly Expression[],
    primitives: readonly Expression[],
  ): Formula => {
    const value = values[primitives.length];
    if (value === undefined) {
      return bind(current, "converted", conversion.combine(primitives), context, continueWith);
    }
    return translateJoined(
      node,
      current,
      context,
      (after, primitive) => convert(after, values, [...primitives, primitive ?? value]),
      (next) =>
        translateJoined(
          node,
          current,
          context,
          (after) => throwTypeError(after, node, context, frame),
          (throwWith) =>
            toPrimitive(node, value, conversion.hint, current, context, frame, throwWith, next),
        ),
    );
  };
  return evaluate(path, conversion.operands, []);
};
