import ts from "@typescript/typescript6";
import {
  getHeapSetOrMapChange,
  translateArrayConstructor,
  translateArrayLikeCall,
  translateFunctionConstructor,
  translateHeapElements,
  translateArrayIteration,
  translateMethod,
  translateNew,
  translateRegExpCall,
  translateSet,
  translateSetArgument,
  translateSize,
  isArrayIteration,
} from "./collections";
import type { Expression } from "../ast";
import {
  type Context,
  type FunctionNode,
  getBinding,
  getAccessKey,
  getCalledMethod,
  getObjectGetter,
  getCallee,
  getElement,
  getFunction,
  getFunctionCandidates,
  getParameters,
  getFactoryCall,
  getFunctionValue,
  getNewClass,
  isHeldError,
  isHeldErrorName,
  getArgumentsOwner,
  isModuleFile,
  getSymbol,
  isAssigned,
  findNodes,
  skipCasts,
  isScript,
  getTopLevelDeclaration,
  getUndefined,
  isHeapClass,
  isFunctionObject,
  getObjectMethod,
  isPrivateMember,
  getPrivateMember,
  getPrivateKey,
  isHeapFunction,
  isInertValue,
  isMethodCall,
  share,
  translateString,
  isNestedFunction,
  isClosure,
} from "./context";
import { TlaTypeScriptError } from "../errors";
import { translateJsonCall } from "./json";
import {
  getCalledError,
  getConstructor,
  getErrorClass,
  isCaughtRead,
  isNativeErrorValue,
  translateHasInstanceCall,
  translateInstanceOf,
  translateNewError,
} from "./exceptions";
import {
  getDefinition,
  translateFoundGetter,
  translateGetterCall,
  translateHelperCall,
  translateLocalCall,
} from "./functions";
import {
  getCandidateValue,
  getFunctionLength,
  getHeap,
  getSuperLookup,
  isCreation,
  isDescription,
  isDescriptionOfAll,
  isValueOfCall,
  getDescribedValue,
  isFromEntries,
  isFunctionValue,
  isSymbolCall,
  isNewObject,
  isObjectConversion,
  isNewProxy,
  getNewBuffer,
  isRevocable,
  getNewWrapper,
  isNewDate,
  areDateFields,
  translateDateFields,
  getMethodValue,
  translateHasPrivate,
  translateHoldsMethod,
  translateFunctionValue,
  translateObjectValue,
  translateFunctionObject,
  getOwnFunctionKeys,
  translatePropertyKey,
} from "./heap";
import {
  getBuiltIn,
  isBuiltInObject,
  translateBuiltInObject,
  translateIntrinsic,
  translateBuiltInValue,
  getMadeRegExp,
  translateRegExpValue,
  translateSymbolProperty,
} from "./intrinsics";
import {
  getTypeNames,
  getURICall,
  isComparable,
  mayBeNumber,
  translateConversion,
  translateNumberString,
  translateParseInt,
  translateToNumber,
  translateTypeOf,
  useJavaScript,
} from "./javascript";
import { getThisOwner, rejectBeforeDeclaration, type Scope } from "./scope";
import {
  apply,
  boolean,
  bound,
  functionOf,
  choose,
  except,
  getLocation,
  identifier,
  ifExpression,
  index,
  junction,
  locate,
  not,
  field,
  number,
  quantify,
  record,
  set,
  string,
  tuple,
} from "./tla";
import {
  getCollection,
  rejectAnyReceiver,
  getField,
  getKind,
  isSetSource,
  getPathStep,
  getPropertyKey,
  isBooleanLike,
  isFieldName,
  isHeapArray,
  hasHeapType,
  isHeapSetOrMap,
  isHeapType,
  isBigIntLike,
  isNumberLike,
  mayBeGeneratorType,
  isBuiltInIteratorType,
  isGeneratorType,
  getWrappedThis,
  rejectGeneratorUse,
  isNumericKey,
  isObject,
  isEvery,
  isRegExpArray,
  isSequenceType,
  mayBeSequenceType,
  translateUnknown,
  isHoleyNewArray,
  isNewArrayOfElements,
} from "./types";

interface Field {
  key: string;
  value: Expression;
}

const BINARY_OPERATORS = new Map([
  [ts.SyntaxKind.MinusToken, "-"],
  [ts.SyntaxKind.AsteriskToken, "*"],
  [ts.SyntaxKind.EqualsEqualsEqualsToken, "="],
  [ts.SyntaxKind.ExclamationEqualsEqualsToken, "#"],
  [ts.SyntaxKind.EqualsEqualsToken, "="],
  [ts.SyntaxKind.ExclamationEqualsToken, "#"],
  [ts.SyntaxKind.LessThanToken, "<"],
  [ts.SyntaxKind.LessThanEqualsToken, "<="],
  [ts.SyntaxKind.GreaterThanToken, ">"],
  [ts.SyntaxKind.GreaterThanEqualsToken, ">="],
]);

// The JavaScript module's operators on the 32 bits of integers, which convert their operands with
// ToInt32.
export const BITWISE_OPERATORS = new Map([
  [ts.SyntaxKind.AmpersandToken, "BitwiseAnd"],
  [ts.SyntaxKind.BarToken, "BitwiseOr"],
  [ts.SyntaxKind.CaretToken, "BitwiseXor"],
  [ts.SyntaxKind.LessThanLessThanToken, "LeftShift"],
  [ts.SyntaxKind.GreaterThanGreaterThanToken, "SignedRightShift"],
  [ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken, "UnsignedRightShift"],
]);

const ORDERING_OPERATORS = new Set([
  ts.SyntaxKind.LessThanToken,
  ts.SyntaxKind.LessThanEqualsToken,
  ts.SyntaxKind.GreaterThanToken,
  ts.SyntaxKind.GreaterThanEqualsToken,
]);

export const ARITHMETIC_OPERATORS = new Set([
  ts.SyntaxKind.PlusToken,
  ts.SyntaxKind.MinusToken,
  ts.SyntaxKind.AsteriskToken,
  ts.SyntaxKind.AsteriskAsteriskToken,
  ts.SyntaxKind.PercentToken,
  ts.SyntaxKind.SlashToken,
  ...ORDERING_OPERATORS,
]);

// The JavaScript module's operators for numbers in a script that names NaN, Infinity, or -0, with
// whether each takes its operands in reverse.
const NUMBER_OPERATORS = new Map([
  [ts.SyntaxKind.PlusToken, { name: "Add", isSwapped: false }],
  [ts.SyntaxKind.MinusToken, { name: "Subtract", isSwapped: false }],
  [ts.SyntaxKind.AsteriskToken, { name: "Multiply", isSwapped: false }],
  [ts.SyntaxKind.PercentToken, { name: "Remainder", isSwapped: false }],
  [ts.SyntaxKind.SlashToken, { name: "Divide", isSwapped: false }],
  [ts.SyntaxKind.AsteriskAsteriskToken, { name: "Power", isSwapped: false }],
  [ts.SyntaxKind.LessThanToken, { name: "LessThan", isSwapped: false }],
  [ts.SyntaxKind.LessThanEqualsToken, { name: "LessOrEqual", isSwapped: false }],
  [ts.SyntaxKind.GreaterThanToken, { name: "LessThan", isSwapped: true }],
  [ts.SyntaxKind.GreaterThanEqualsToken, { name: "LessOrEqual", isSwapped: true }],
]);

// The JavaScript module's operators on two BigInts.
export const BIGINT_OPERATORS = new Map([
  [ts.SyntaxKind.PlusToken, "BigIntAdd"],
  [ts.SyntaxKind.MinusToken, "BigIntSubtract"],
  [ts.SyntaxKind.AsteriskToken, "BigIntMultiply"],
  [ts.SyntaxKind.SlashToken, "BigIntDivide"],
  [ts.SyntaxKind.PercentToken, "BigIntRemainder"],
  [ts.SyntaxKind.AsteriskAsteriskToken, "BigIntPower"],
]);

const LOGICAL_OPERATORS = new Map([
  [ts.SyntaxKind.AmpersandAmpersandToken, "And" as const],
  [ts.SyntaxKind.BarBarToken, "Or" as const],
]);

const OBJECT_TESTS = new Map([
  ["isExtensible", "IsExtensible"],
  ["isSealed", "IsSealed"],
  ["isFrozen", "IsFrozen"],
]);

const NUMBER_TESTS = new Set(["isNaN", "isFinite", "isInteger", "isSafeInteger"]);

export const concatenate = (parts: Expression[]) =>
  parts.reduce((left, right) => apply("\\o", [left, right]));

// The key of an element access, which counts from 1 in a sequence where JavaScript counts from 0.
// Whether a key may be a symbol, which only an object's properties have.
const isSymbolKey = (node: ts.Expression, context: Context) => {
  const type = context.checker.getTypeAtLocation(node);
  return (type.isUnion() ? type.types : [type]).some(
    (member) => (member.flags & ts.TypeFlags.ESSymbolLike) !== 0,
  );
};

export const translateKey = (node: ts.ElementAccessExpression, scope: Scope, context: Context) => {
  const key = node.argumentExpression;
  const kind = getKind(node.expression, context);
  if (isSymbolKey(key, context)) {
    throw new TlaTypeScriptError("tla-ts can't read what a symbol keys on this value", key);
  }
  if (kind !== "sequence" && kind !== "string") return translateExpression(key, scope, context);
  // A key that may not be a number, such as a for-in's string or a value cast to a number, reads
  // the element that it names as an index.
  if (kind === "sequence" && !isNumberLike(skipCasts(key), context)) {
    return useJavaScript("KeyPosition", [translateExpression(key, scope, context)], context);
  }
  if (!isNumberLike(key, context)) {
    throw new TlaTypeScriptError("Index arrays and strings with numbers", key);
  }
  const position = translateExpression(key, scope, context);
  if (context.hasSpecialNumbers && position.kind !== "Number") {
    return useJavaScript("ElementPosition", [position], context);
  }
  return position.kind === "Number"
    ? number(position.value + 1)
    : apply("+", [position, number(1)]);
};

// An array literal that only an array's iterator reads: one that a for-of iterates, or an element
// of one where the for-of destructures each element with an array pattern.
const isIteratedOnly = (node: ts.ArrayLiteralExpression): boolean => {
  const parent = node.parent;
  if (ts.isForOfStatement(parent)) return parent.expression === node;
  if (!ts.isArrayLiteralExpression(parent) || !ts.isForOfStatement(parent.parent)) return false;
  const initializer = parent.parent.initializer;
  const target = ts.isVariableDeclarationList(initializer)
    ? initializer.declarations.at(0)?.name
    : initializer;
  return (
    isIteratedOnly(parent) &&
    !parent.elements.some(ts.isSpreadElement) &&
    target !== undefined &&
    (ts.isArrayBindingPattern(target) || ts.isArrayLiteralExpression(target))
  );
};

// A literal whose holes give what Array.prototype holds at their indices.
const isPrototypeHoled = (node: ts.ArrayLiteralExpression) =>
  isIteratedOnly(node) && !node.elements.some(ts.isSpreadElement);

// The positions of a for-of's literal whose element reads a hole from Array.prototype, each with
// whether Array.prototype still gives what the literal read when it was made, as the iterator
// reads a hole only once it reaches it: the element itself, or each hole of the element there.
export const getHoleChecks = (
  literal: ts.Expression,
  getHeapValue: () => Expression,
  context: Context,
) => {
  const inner = skipCasts(literal);
  if (context.heap === undefined || !ts.isArrayLiteralExpression(inner)) return [];
  const isKept = (value: Expression, position: number) =>
    useJavaScript(
      "SameValue",
      [
        value,
        useJavaScript(
          "Get",
          [
            getHeapValue(),
            translateBuiltInValue("Array.prototype", literal, context),
            string(String(position)),
          ],
          context,
        ),
      ],
      context,
    );
  return inner.elements.flatMap((element, position) => {
    if (ts.isOmittedExpression(element) && isPrototypeHoled(inner)) {
      return [{ position, holes: [], isKept: (value: Expression) => isKept(value, position) }];
    }
    const holes =
      ts.isArrayLiteralExpression(element) && isPrototypeHoled(element)
        ? element.elements.flatMap((part, hole) => (ts.isOmittedExpression(part) ? [hole] : []))
        : [];
    return holes.length === 0
      ? []
      : [
          {
            position,
            holes,
            isKept: (value: Expression) =>
              junction(
                "And",
                holes.map((hole) => isKept(index(value, [number(hole + 1)]), hole)),
              ),
          },
        ];
  });
};

// The elements that an array literal or a call's arguments list, where runs of plain elements become
// tuples, and each spread array stays a sequence of its own. A hole of a literal that only an
// iterator reads gives what Array.prototype holds at its index.
export const translateElements = (
  elements: readonly ts.Expression[],
  scope: Scope,
  context: Context,
  literal?: ts.ArrayLiteralExpression,
) => {
  const parts = elements.reduce<(Expression | Expression[])[]>((result, element, position) => {
    if (!ts.isSpreadElement(element)) {
      const isHole =
        literal !== undefined && ts.isOmittedExpression(element) && isPrototypeHoled(literal);
      const value = !isHole
        ? translateExpression(element, scope, context)
        : context.heap === undefined
          ? getUndefined(context)
          : useJavaScript(
              "Get",
              [
                getHeap(scope, literal, context),
                translateBuiltInValue("Array.prototype", literal, context),
                string(String(position)),
              ],
              context,
            );
      const last = result.at(-1);
      return Array.isArray(last)
        ? [...result.slice(0, -1), [...last, value]]
        : [...result, [value]];
    }
    if (isHeapArray(element.expression, context)) {
      return [...result, translateHeapElements(element.expression, scope, context)];
    }
    // A string spreads its code points.
    if (ts.isStringLiteralLike(element.expression)) {
      return [
        ...result,
        [...element.expression.text].map((character) => translateString(character, context)),
      ];
    }
    if (isEvery(context.checker.getTypeAtLocation(element.expression), ts.TypeFlags.StringLike)) {
      return [
        ...result,
        useJavaScript(
          "StringCharacters",
          [translateExpression(element.expression, scope, context)],
          context,
        ),
      ];
    }
    // A spread of an iterator that the statement stepped first takes the values it gathered.
    const gathered = scope.results.get(element);
    if (gathered !== undefined) return [...result, gathered];
    if (
      (isGeneratorType(element.expression, context) ||
        isBuiltInIteratorType(element.expression, context)) &&
      !isArrayIteration(element.expression, context)
    ) {
      throw new TlaTypeScriptError("tla-ts can't step an iterator in this spread", element);
    }
    if (
      getKind(element.expression, context) !== "sequence" &&
      !isArrayIteration(element.expression, context)
    ) {
      throw new TlaTypeScriptError(
        "Sets have no order, so spread one only into every(), some(), filter(), map(), or find()",
        element,
      );
    }
    const value = translateExpression(element.expression, scope, context);
    return [
      ...result,
      context.heap !== undefined && !isArrayIteration(element.expression, context)
        ? translateArrayIteration(value, getHeap(scope, element, context), element, context)
        : value,
    ];
  }, []);
  if (parts.length === 0) return tuple([]);
  return concatenate(parts.map((part) => (Array.isArray(part) ? tuple(part) : part)));
};

const mergeEntries = (entries: [Expression, Expression][]) =>
  entries.map((entry) => apply(":>", entry)).reduce((left, right) => apply("@@", [left, right]));

const formatRecord = (fields: Field[], node: ts.Node) => {
  if (fields.every((field) => isNumericKey(field.key))) {
    return mergeEntries(fields.map((field) => [number(Number(field.key)), field.value]));
  }
  if (fields.some((field) => isNumericKey(field.key))) {
    throw new TlaTypeScriptError("Give an object only numeric keys or none", node);
  }
  return fields.every((field) => isFieldName(field.key))
    ? record(
        "Record",
        fields.map((field) => ({ name: field.key, value: field.value })),
      )
    : mergeEntries(fields.map((field) => [string(field.key), field.value]));
};

const translateObjectLiteral = (
  node: ts.ObjectLiteralExpression,
  scope: Scope,
  context: Context,
) => {
  if (getKind(node, context) === "object") {
    const ref = scope.allocated.get(node);
    if (ref === undefined) {
      throw new TlaTypeScriptError("Make objects only where a statement always runs", node);
    }
    return ref;
  }
  const checker = context.checker;
  const getKey = (property: ts.ObjectLiteralElementLike) =>
    property.name === undefined ? undefined : getPropertyKey(property.name);
  const getValue = (property: ts.ObjectLiteralElementLike) => {
    if (ts.isPropertyAssignment(property)) {
      return translateExpression(property.initializer, scope, context);
    }
    if (ts.isShorthandPropertyAssignment(property)) {
      return translateExpression(property.name, scope, context);
    }
    throw new TlaTypeScriptError("Unsupported object member", property);
  };
  const spreads = node.properties.filter(ts.isSpreadAssignment);
  if (spreads.length === 0) {
    if (node.properties.length === 0) {
      throw new TlaTypeScriptError("TLA+ has no empty record, so use a Map", node);
    }
    return formatRecord(
      node.properties.map((property) => {
        const key = getKey(property);
        if (key === undefined) {
          throw new TlaTypeScriptError("Computed keys need a spread base", property);
        }
        return { key, value: getValue(property) };
      }),
      node,
    );
  }
  // { ...base, a: 1 } updates fields that base already has with EXCEPT.
  const base = node.properties[0];
  const updates = node.properties.slice(1);
  if (ts.isSpreadAssignment(base) && spreads.length === 1) {
    const baseType = checker.getTypeAtLocation(base.expression);
    const value = translateExpression(base.expression, scope, context);
    if (updates.length === 0) return value;
    const isUpdate = updates.every((property) => {
      const key = getKey(property);
      return key === undefined || baseType.getProperty(key) !== undefined;
    });
    if (isUpdate) {
      const changes = updates.map((property) => {
        const key = getKey(property);
        if (key !== undefined) return { path: [getPathStep(key)], value: getValue(property) };
        if (property.name === undefined || !ts.isComputedPropertyName(property.name)) {
          throw new TlaTypeScriptError("Unsupported object member", property);
        }
        const computed = translateExpression(property.name.expression, scope, context);
        return {
          path: [{ kind: "Index" as const, args: [computed] }],
          value: getValue(property),
        };
      });
      return except(value, changes);
    }
  }
  // Otherwise each field takes its value from the last member that sets it.
  return formatRecord(
    checker
      .getTypeAtLocation(node)
      .getProperties()
      .map((property) => {
        const key = property.name;
        const member = node.properties.findLast((candidate) =>
          ts.isSpreadAssignment(candidate)
            ? checker.getTypeAtLocation(candidate.expression).getProperty(key) !== undefined
            : getKey(candidate) === key,
        );
        if (
          member === undefined ||
          (!ts.isSpreadAssignment(member) && getKey(member) === undefined)
        ) {
          throw new TlaTypeScriptError(`Can't tell which value ${key} takes`, node);
        }
        return {
          key,
          value: ts.isSpreadAssignment(member)
            ? getField(translateExpression(member.expression, scope, context), key)
            : getValue(member),
        };
      }),
    node,
  );
};

// A numeric literal that an operator converts with ToInt32, which gives the same integer of 32 bits
// for a literal that TLC can't hold, such as the 0x85ebca6b of a hash.
const translateInt32Literal = (node: ts.Expression) => {
  const literal = ts.isParenthesizedExpression(node) ? node.expression : node;
  const isNegated =
    ts.isPrefixUnaryExpression(literal) && literal.operator === ts.SyntaxKind.MinusToken;
  const numeric = isNegated ? literal.operand : literal;
  if (!ts.isNumericLiteral(numeric)) return undefined;
  const value = Math.trunc(Number(numeric.text)) * (isNegated ? -1 : 1);
  if (!Number.isFinite(value) || Math.abs(value) < 2 ** 31) return undefined;
  const unsigned = ((value % 2 ** 32) + 2 ** 32) % 2 ** 32;
  // TLC can't read 2^31, even negated.
  return unsigned === 2 ** 31
    ? apply("-", [number(-(2 ** 31 - 1)), number(1)])
    : number(unsigned > 2 ** 31 ? unsigned - 2 ** 32 : unsigned);
};

const translateMath = (node: ts.CallExpression, method: string, scope: Scope, context: Context) => {
  const isSpecial = context.hasSpecialNumbers;
  // Math's functions convert their arguments to numbers. A statement converts the objects among
  // them through their methods, and ToNumber stops on any other.
  const translate = (inner: ts.Expression) => {
    const value = translateExpression(inner, scope, context);
    if ((context.checker.getTypeAtLocation(inner).flags & ts.TypeFlags.NumberLike) !== 0) {
      return value;
    }
    const converted = useJavaScript("ToNumber", [value], context);
    return isSpecial ? converted : useJavaScript("PlainNumber", [converted], context);
  };
  const argument = node.arguments[0];
  if (method === "imul" && node.arguments.length === 2) {
    return useJavaScript(
      "Imul",
      node.arguments.map((inner) => translateInt32Literal(inner) ?? translate(inner)),
      context,
    );
  }
  if (method === "clz32" && node.arguments.length === 1) {
    return useJavaScript(
      "Clz32",
      [translateInt32Literal(argument) ?? translate(argument)],
      context,
    );
  }
  if (method === "hypot" && !node.arguments.some(ts.isSpreadElement)) {
    return useJavaScript("Hypot", [tuple(node.arguments.map(translate))], context);
  }
  if (method === "pow" && node.arguments.length === 2) {
    const power = useJavaScript("Power", node.arguments.map(translate), context);
    return isSpecial ? power : useJavaScript("PlainNumber", [power], context);
  }
  if ((method === "round" || method === "sign") && node.arguments.length === 1) {
    return useJavaScript(method === "round" ? "Round" : "Sign", [translate(argument)], context);
  }
  if (method === "ceil" && node.arguments.length === 1 && isSpecial) {
    // Math.ceil(x) is -Math.floor(-x).
    const negated = useJavaScript("Negate", [translate(argument)], context);
    const floor = useJavaScript("FloorDivide", [negated, number(1)], context);
    return useJavaScript("Negate", [floor], context);
  }
  if ((method === "floor" || method === "trunc") && node.arguments.length === 1) {
    const division = ts.isParenthesizedExpression(argument) ? argument.expression : argument;
    if (
      !ts.isBinaryExpression(division) ||
      division.operatorToken.kind !== ts.SyntaxKind.SlashToken
    ) {
      if (isSpecial) {
        return useJavaScript(
          method === "floor" ? "FloorDivide" : "TruncDivide",
          [translate(argument), number(1)],
          context,
        );
      }
      throw new TlaTypeScriptError(
        `Math.${method} only takes a division, as in Math.${method}(a / b)`,
        node,
      );
    }
    const left = translate(division.left);
    const right = translate(division.right);
    if (isSpecial) {
      return useJavaScript(
        method === "floor" ? "FloorDivide" : "TruncDivide",
        [left, right],
        context,
      );
    }
    if (method === "floor") return apply("\\div", [left, right]);
    context.prelude.add("Quot");
    return apply("Quot", [left, right]);
  }
  if (method === "abs" && node.arguments.length === 1) {
    if (isSpecial) return useJavaScript("AbsoluteValue", [translate(argument)], context);
    return share(translate(argument), "value", context, (value) =>
      ifExpression(apply("<", [value, number(0)]), apply("-.", [value]), value),
    );
  }
  if ((method === "min" || method === "max") && node.arguments.length > 0) {
    const comparison = method === "min" ? "<=" : ">=";
    if (node.arguments.length === 1 && ts.isSpreadElement(argument)) {
      if (isSpecial) {
        return useJavaScript(
          method === "min" ? "MinimumOf" : "MaximumOf",
          [translateSet(argument.expression, scope, context)],
          context,
        );
      }
      const values = translateSet(argument.expression, scope, context);
      const candidate = context.names.getFresh("candidate");
      const other = context.names.getFresh("other");
      return choose(
        candidate,
        values,
        quantify(
          "Forall",
          [bound(other, values)],
          apply(comparison, [identifier(candidate), identifier(other)]),
        ),
      );
    }
    if (isSpecial) {
      return node.arguments
        .map(translate)
        .reduce((result, inner) =>
          useJavaScript(method === "min" ? "Minimum" : "Maximum", [result, inner], context),
        );
    }
    return node.arguments
      .map(translate)
      .reduce((result, inner) =>
        share(result, "best", context, (best) =>
          share(inner, "value", context, (value) =>
            ifExpression(apply(comparison, [best, value]), best, value),
          ),
        ),
      );
  }
  return translateUnknown(node, `Unsupported call: Math.${method}`, context);
};

export const translateCall = (
  node: ts.CallExpression,
  scope: Scope,
  context: Context,
  isDefined: boolean,
) => {
  const keyFor = node.expression;
  if (
    ts.isPropertyAccessExpression(keyFor) &&
    keyFor.name.text === "keyFor" &&
    getBuiltIn(keyFor.expression, context) === "Symbol" &&
    node.arguments.length === 1 &&
    !ts.isSpreadElement(node.arguments[0])
  ) {
    return useJavaScript(
      "SymbolKeyFor",
      [getHeap(scope, node, context), translateExpression(node.arguments[0], scope, context)],
      context,
    );
  }
  if (isSymbolCall(node, context)) {
    const made = scope.allocated.get(node);
    if (made === undefined) {
      throw new TlaTypeScriptError("Make symbols only where a statement always runs", node);
    }
    return made;
  }
  if (getBinding(node, context) !== undefined) {
    const bound = scope.allocated.get(node);
    if (bound === undefined) {
      throw new TlaTypeScriptError("Make objects only where a statement always runs", node);
    }
    return bound;
  }
  const converted =
    translateHasInstanceCall(node, scope, context) ??
    translateConversion(node, scope, context) ??
    translateIntrinsic(node, scope, context) ??
    translateJsonCall(node, scope, context) ??
    (isMethodCall(node) ? undefined : translateRegExpCall(node, scope, context));
  if (converted !== undefined) return converted;
  // decodeURI and decodeURIComponent may throw, so only a statement runs them.
  const uriCall = getURICall(node, context);
  if (uriCall !== undefined && !uriCall.isDecode) {
    const text = translateExpression(uriCall.text, scope, context);
    return uriCall.isUnescape
      ? useJavaScript("Unescape", [text], context)
      : useJavaScript("EncodeURI", [text, uriCall.kept], context);
  }
  const symbol = getSymbol(node.expression, context.checker);
  const helper = getTopLevelDeclaration(symbol);
  if (helper?.getSourceFile().isDeclarationFile) {
    return translateUnknown(node, `Unsupported call: ${node.expression.getText()}`, context);
  }
  if (
    helper !== undefined &&
    ts.isVariableDeclaration(helper) &&
    (helper.initializer === undefined || !ts.isFunctionLike(helper.initializer)) &&
    getFactoryCall(helper.initializer, context) === undefined
  ) {
    throw new TlaTypeScriptError(`Unsupported call: ${node.expression.getText()}`, node);
  }
  if (helper !== undefined) return translateHelperCall(helper, node, scope, context);
  const called = getCalledMethod(node.expression, context);
  if (called !== undefined) {
    return ifExpression(
      translateHoldsMethod(called, scope, context),
      translateLocalCall(node, scope, context, called),
      apply("Assert", [boolean(false), string("tla-ts can't tell which method this call runs")]),
    );
  }
  const callee = isMethodCall(node) ? getCallee(node.expression, context) : undefined;
  if (callee !== undefined && ts.isMethodDeclaration(callee)) {
    return translateLocalCall(node, scope, context);
  }
  // A call of a function that a field holds.
  const field = symbol?.valueDeclaration;
  if (
    isMethodCall(node) &&
    context.heap !== undefined &&
    field !== undefined &&
    !field.getSourceFile().isDeclarationFile &&
    (ts.isPropertyDeclaration(field) || ts.isParameter(field) || ts.isPropertySignature(field))
  ) {
    return translateLocalCall(node, scope, context);
  }
  if (!isMethodCall(node)) {
    const operator = symbol === undefined ? undefined : scope.bindings.get(symbol);
    if (operator === undefined || (symbol !== undefined && scope.functions.has(symbol))) {
      return translateLocalCall(node, scope, context);
    }
    const declaration = symbol?.valueDeclaration;
    if (
      operator.kind !== "Identifier" ||
      (declaration !== undefined && ts.isVariableDeclaration(declaration))
    ) {
      throw new TlaTypeScriptError(`Unsupported call: ${node.expression.getText()}`, node);
    }
    const values = node.arguments.map((argument) => translateExpression(argument, scope, context));
    return apply(operator.name, values);
  }
  const receiver = node.expression.expression;
  const method = node.expression.name.text;
  const global = ts.isIdentifier(receiver) ? receiver.text : undefined;
  if (global === "Math" && method !== "hasOwnProperty") {
    return translateMath(node, method, scope, context);
  }
  const escaped = node.arguments.at(0);
  if (
    getBuiltIn(receiver, context) === "RegExp" &&
    method === "escape" &&
    node.arguments.length === 1 &&
    escaped !== undefined &&
    getKind(escaped, context) === "string"
  ) {
    return useJavaScript("RegExpEscape", [translateExpression(escaped, scope, context)], context);
  }
  const parsed =
    global === "Number" && method === "parseInt"
      ? translateParseInt(node, scope, context)
      : undefined;
  if (parsed !== undefined) return parsed;
  // Every number that TLA+ holds, but NaN and the infinities, is a safe integer.
  if (global === "Number" && NUMBER_TESTS.has(method) && node.arguments.length <= 1) {
    const argument = node.arguments.at(0);
    if (argument === undefined) return boolean(false);
    const value = translateExpression(argument, scope, context);
    if (method === "isFinite") return useJavaScript("IsFinite", [value], context);
    if (method !== "isNaN") {
      return share(value, "value", context, (shared) =>
        junction("And", [
          useJavaScript("IsFinite", [shared], context),
          not(useJavaScript("IsFraction", [shared], context)),
        ]),
      );
    }
    context.prelude.add("JavaScript");
    return apply("=", [value, identifier("NaN")]);
  }
  if (
    getBuiltIn(receiver, context) === "String" &&
    (method === "fromCharCode" || method === "fromCodePoint") &&
    node.arguments.every(
      (argument) => !ts.isSpreadElement(argument) && isNumberLike(argument, context),
    )
  ) {
    const made = useJavaScript(
      "FromCharCodes",
      [
        tuple(node.arguments.map((argument) => translateExpression(argument, scope, context))),
        boolean(method === "fromCodePoint"),
      ],
      context,
    );
    return context.heap === undefined
      ? made
      : ifExpression(
          useJavaScript(
            "HoldsBuiltIn",
            [
              getHeap(scope, node, context),
              translateBuiltInValue("String", node, context),
              string(method),
              string(`String.${method}`),
            ],
            context,
          ),
          made,
          apply("Assert", [
            boolean(false),
            string(`tla-ts can't call String.${method} where a script replaced it`),
          ]),
        );
  }
  if (
    getBuiltIn(receiver, context) === "Date" &&
    method === "UTC" &&
    areDateFields(node.arguments, context)
  ) {
    return useJavaScript(
      "TimeNumber",
      [translateDateFields(node, node.arguments, scope, context)],
      context,
    );
  }
  if (global === "Array" && method === "isArray" && node.arguments.length === 1) {
    const argument = node.arguments[0];
    if (getKind(argument, context) === "object") {
      return useJavaScript(
        "IsArray",
        [getHeap(scope, node, context), translateExpression(argument, scope, context)],
        context,
      );
    }
    translateExpression(argument, scope, context);
    const names = getTypeNames(context.checker.getTypeAtLocation(argument), context.checker);
    if (getKind(argument, context) === "sequence" && names?.every((name) => name === "object")) {
      return boolean(true);
    }
    if (
      getKind(argument, context) === "object" ||
      names?.every((name) => name !== "object" && name !== "function")
    ) {
      return boolean(false);
    }
    throw new TlaTypeScriptError("Array.isArray needs a value whose type tells", node);
  }
  // Reflect's functions on an object do what in and Object's functions do, and throw a TypeError
  // only where the value isn't one.
  const reflected = global === "Reflect" ? node.arguments.at(0) : undefined;
  const reflectedKind = reflected === undefined ? undefined : getKind(reflected, context);
  const isReflectedObject =
    reflected !== undefined &&
    context.heap !== undefined &&
    (reflectedKind === "object" || isBuiltInObject(reflected, context));
  if (isReflectedObject && method === "has" && node.arguments.length === 2) {
    return useJavaScript(
      "Has",
      [
        getHeap(scope, node, context),
        translateObjectValue(reflected, scope, context),
        translatePropertyKey(node.arguments[1], scope, context),
      ],
      context,
    );
  }
  if (isReflectedObject && method === "isExtensible" && node.arguments.length === 1) {
    return useJavaScript(
      "IsExtensible",
      [getHeap(scope, node, context), translateObjectValue(reflected, scope, context)],
      context,
    );
  }
  if (method === "ownKeys" && node.arguments.length === 1 && reflected !== undefined) {
    if (isReflectedObject) {
      return useJavaScript(
        "OwnPropertyKeys",
        [getHeap(scope, node, context), translateObjectValue(reflected, scope, context)],
        context,
      );
    }
    if (reflectedKind === "sequence") {
      return useJavaScript(
        "ElementNames",
        [translateExpression(reflected, scope, context)],
        context,
      );
    }
  }
  const ownKeys = global === "Object" ? OWN_KEYS.get(method) : undefined;
  if (ownKeys !== undefined && node.arguments.length === 1 && context.heap !== undefined) {
    const argument = node.arguments[0];
    if (
      getKind(argument, context) === "object" ||
      isBuiltInObject(argument, context) ||
      isFunctionValue(argument, context) ||
      isDescriptionOfAll(argument, context)
    ) {
      return useJavaScript(
        ownKeys,
        [getHeap(scope, node, context), translateFunctionObject(argument, scope, context)],
        context,
      );
    }
    // A number, a boolean, or a symbol converts to an object with no own properties.
    if (
      isNumberLike(argument, context) ||
      isBooleanLike(argument, context) ||
      isEvery(context.checker.getTypeAtLocation(argument), ts.TypeFlags.ESSymbolLike)
    ) {
      return tuple([]);
    }
    const kind = getKind(argument, context);
    // An array or a string that isn't on the heap has no properties that symbols key.
    if (method === "getOwnPropertySymbols" && (kind === "sequence" || kind === "string")) {
      return tuple([]);
    }
    if (kind === "sequence" && method === "getOwnPropertyNames") {
      return useJavaScript(
        "ElementNames",
        [translateExpression(argument, scope, context)],
        context,
      );
    }
    // A string converts to a String object, which holds its characters and its length.
    if (kind === "string" && method === "getOwnPropertyNames") {
      context.prelude.add("Null");
      return useJavaScript(
        "OwnKeys",
        [
          useJavaScript(
            "WrapperObject",
            [identifier("Null"), translateExpression(argument, scope, context)],
            context,
          ),
        ],
        context,
      );
    }
    if (kind === "sequence" || kind === "string") {
      const value = translateExpression(argument, scope, context);
      return share(
        kind === "sequence"
          ? value
          : useJavaScript("StringSplit", [value, string(""), getUndefined(context)], context),
        "elements",
        context,
        (elements) => {
          const position = context.names.getFresh("position");
          const key = apply("ToString", [apply("-", [identifier(position), number(1)])]);
          return method === "values"
            ? elements
            : functionOf(
                [bound(position, apply("..", [number(1), apply("Len", [elements])]))],
                method === "keys" ? key : tuple([key, index(elements, [identifier(position)])]),
              );
        },
      );
    }
  }
  // freeze, seal, and preventExtensions give a primitive back as it is.
  const primitive = global === "Object" ? node.arguments.at(0) : undefined;
  const primitiveNames =
    primitive === undefined
      ? undefined
      : getTypeNames(context.checker.getTypeAtLocation(primitive), context.checker);
  if (
    primitive !== undefined &&
    ["freeze", "seal", "preventExtensions"].includes(method) &&
    primitiveNames?.every((name) => name !== "object" && name !== "function")
  ) {
    return share(translateExpression(primitive, scope, context), "value", context, (value) =>
      context.heap === undefined
        ? value
        : ifExpression(
            useJavaScript("IsRef", [value], context),
            apply("Assert", [boolean(false), string(`tla-ts can't tell what ${method} changes`)]),
            value,
          ),
    );
  }
  const test = OBJECT_TESTS.get(method);
  // Only freeze, seal, and preventExtensions on a script's objects, or on the built-in objects a
  // script's heap holds, make an object inextensible.
  if (global === "Object" && test !== undefined && node.arguments.length > 0) {
    const argument = node.arguments[0];
    const names = getTypeNames(context.checker.getTypeAtLocation(argument), context.checker);
    // A function that a script makes and the heap doesn't hold stays extensible, as only freeze,
    // seal, and preventExtensions of objects on the heap make an object inextensible. A built-in
    // function, which a variable may hold, may be frozen.
    const declaration = ts.isIdentifier(argument)
      ? getSymbol(argument, context.checker)?.valueDeclaration
      : undefined;
    const isFunction =
      ts.isArrowFunction(argument) ||
      ts.isFunctionExpression(argument) ||
      (ts.isIdentifier(argument) &&
        declaration !== undefined &&
        (ts.isFunctionDeclaration(declaration) ||
          (ts.isVariableDeclaration(declaration) &&
            declaration.initializer !== undefined &&
            (ts.isArrowFunction(skipCasts(declaration.initializer)) ||
              ts.isFunctionExpression(skipCasts(declaration.initializer))))) &&
        names?.every((name) => name === "function") &&
        getKind(argument, context) !== "object");
    const isBuiltIn = isBuiltInObject(argument, context);
    if (isBuiltIn && context.heap !== undefined) {
      return useJavaScript(
        test,
        [getHeap(scope, node, context), translateObjectValue(argument, scope, context)],
        context,
      );
    }
    if (isBuiltIn || isFunction) return boolean(method === "isExtensible");
    const value = translateExpression(argument, scope, context);
    const kind = getKind(argument, context);
    if (kind === "object") {
      return useJavaScript(test, [getHeap(scope, node, context), value], context);
    }
    if (names?.every((name) => name !== "object" && name !== "function")) {
      // TypeScript can't see a callback assign a variable without a type, so in a script the
      // value may still be an object.
      return context.heap === undefined
        ? boolean(method !== "isExtensible")
        : ifExpression(
            useJavaScript("IsRef", [value], context),
            useJavaScript(test, [getHeap(scope, node, context), value], context),
            boolean(method !== "isExtensible"),
          );
    }
    if (kind === "sequence" || kind === "set" || kind === "map") {
      return boolean(method === "isExtensible");
    }
    // A function that the heap or the built-in objects hold is an object there, which may be
    // frozen, as %ThrowTypeError% is, which a script reaches through descriptors. Another function
    // stays extensible, and undefined isn't.
    if (
      context.heap !== undefined &&
      names?.includes("function") &&
      names.every((name) => name === "function" || name === "undefined")
    ) {
      context.builtIns.add("get Function.prototype.arguments");
      return ifExpression(
        useJavaScript("IsRef", [value], context),
        useJavaScript(test, [getHeap(scope, node, context), value], context),
        ifExpression(
          apply("=", [value, getUndefined(context)]),
          boolean(method !== "isExtensible"),
          boolean(method === "isExtensible"),
        ),
      );
    }
  }
  if (isRevocable(node, context)) {
    const revocable = scope.allocated.get(node);
    if (revocable === undefined) {
      throw new TlaTypeScriptError("Make objects only where a statement always runs", node);
    }
    return revocable;
  }
  const isFromEntriesCall = isFromEntries(node, context);
  if (isCreation(node, context) || isFromEntriesCall) {
    const contextual = context.checker.getContextualType(node);
    const isTyped =
      contextual !== undefined &&
      ((contextual.flags & ts.TypeFlags.Unknown) !== 0 || hasHeapType(contextual, context));
    if (!isTyped) {
      throw new TlaTypeScriptError(
        `Give the object Object.${isFromEntriesCall ? "fromEntries" : "create"} makes an object type`,
        node,
      );
    }
    const created = scope.allocated.get(node);
    if (created === undefined) {
      throw new TlaTypeScriptError("Make objects only where a statement always runs", node);
    }
    return created;
  }
  // A number, a boolean, or a symbol converts to an object with no own properties.
  const [target, key] = node.arguments;
  if (
    global === "Object" &&
    method === "getOwnPropertyDescriptor" &&
    target !== undefined &&
    key !== undefined &&
    isInertValue(key) &&
    (isInertValue(target) || isSymbolCall(target, context)) &&
    (isNumberLike(target, context) ||
      isBooleanLike(target, context) ||
      isEvery(context.checker.getTypeAtLocation(target), ts.TypeFlags.ESSymbolLike))
  ) {
    return getUndefined(context);
  }
  // Object.setPrototypeOf gives back a primitive other than null and undefined, where the prototype
  // is null or an object.
  const prototype = node.arguments.at(1);
  const targetNames =
    target === undefined
      ? undefined
      : getTypeNames(context.checker.getTypeAtLocation(target), context.checker);
  const prototypeNames =
    prototype === undefined
      ? undefined
      : getTypeNames(context.checker.getTypeAtLocation(prototype), context.checker);
  if (
    global === "Object" &&
    method === "setPrototypeOf" &&
    target !== undefined &&
    prototype !== undefined &&
    node.arguments.length === 2 &&
    node.arguments.every(isInertValue) &&
    (targetNames?.every((name) => ["number", "boolean", "string", "symbol"].includes(name)) ||
      isEvery(context.checker.getTypeAtLocation(target), ts.TypeFlags.BigIntLike)) &&
    (prototype.kind === ts.SyntaxKind.NullKeyword ||
      prototypeNames?.every((name) => name === "object" || name === "function"))
  ) {
    // TypeScript can't see a callback assign a variable without a type an object, or any hold null.
    context.prelude.add("Null");
    return share(translateExpression(target, scope, context), "target", context, (value) =>
      ifExpression(
        apply("\\/", [
          apply("\\in", [value, set([getUndefined(context), identifier("Null")])]),
          ...(context.heap === undefined ? [] : [useJavaScript("IsRef", [value], context)]),
        ]),
        apply("Assert", [
          boolean(false),
          string("tla-ts can't tell what Object.setPrototypeOf changes"),
        ]),
        value,
      ),
    );
  }
  if (isDescriptionOfAll(node, context)) {
    const described = scope.allocated.get(node);
    if (described === undefined) {
      throw new TlaTypeScriptError("Make objects only where a statement always runs", node);
    }
    return described;
  }
  if (isDescription(node, context)) {
    const described = scope.allocated.get(node);
    if (described === undefined) {
      throw new TlaTypeScriptError("Make objects only where a statement always runs", node);
    }
    const key = translatePropertyKey(node.arguments[1], scope, context);
    const describedValue = getDescribedValue(node, context);
    return ifExpression(
      describedValue === undefined
        ? useJavaScript(
            "HasOwn",
            [
              getHeap(scope, node, context),
              translateObjectValue(node.arguments[0], scope, context),
              key,
            ],
            context,
          )
        : useJavaScript(
            `HasOwn${describedValue}`,
            [translateExpression(node.arguments[0], scope, context), key],
            context,
          ),
      described,
      getUndefined(context),
    );
  }
  const arrayLike = translateArrayLikeCall(node, scope, context);
  if (arrayLike !== undefined) return arrayLike;
  const calledMethod =
    method === "call" &&
    ts.isPropertyAccessExpression(receiver) &&
    receiver.expression.getText() === "Object.prototype"
      ? receiver.name.text
      : undefined;
  const ownMethod =
    calledMethod ?? (global === "Object" && method === "hasOwn" ? "hasOwnProperty" : method);
  const owned =
    calledMethod !== undefined || (global === "Object" && method === "hasOwn")
      ? node.arguments
      : node.arguments.length === 1
        ? [receiver, node.arguments[0]]
        : [];
  const isOwnMethod =
    (ownMethod === "hasOwnProperty" || ownMethod === "propertyIsEnumerable") && owned.length === 2;
  // A function that the heap doesn't hold owns its keys, none of them enumerable.
  const ownFunctionKeys = isOwnMethod ? getOwnFunctionKeys(owned[0], context) : undefined;
  if (ownFunctionKeys !== undefined) {
    return share(translateExpression(owned[0], scope, context), "function", context, (value) =>
      share(translatePropertyKey(owned[1], scope, context), "key", context, (key) =>
        ifExpression(
          useJavaScript("IsRef", [value], context),
          useJavaScript(
            ownMethod === "hasOwnProperty" ? "HasOwn" : "IsEnumerableOwn",
            [getHeap(scope, node, context), value, key],
            context,
          ),
          ownMethod === "propertyIsEnumerable"
            ? boolean(false)
            : ifExpression(
                apply("\\in", [key, set([string("arguments"), string("caller")])]),
                apply("Assert", [
                  boolean(false),
                  string(
                    "tla-ts can't tell whether this function has its own arguments and caller",
                  ),
                ]),
                apply("\\in", [key, set(ownFunctionKeys.map(string))]),
              ),
        ),
      ),
    );
  }
  if (
    isOwnMethod &&
    (getKind(owned[0], context) === "object" ||
      (context.heap !== undefined && isBuiltInObject(owned[0], context)) ||
      isFunctionValue(owned[0], context))
  ) {
    return useJavaScript(
      ownMethod === "hasOwnProperty" ? "HasOwn" : "IsEnumerableOwn",
      [
        getHeap(scope, node, context),
        translateFunctionObject(owned[0], scope, context),
        translatePropertyKey(owned[1], scope, context),
      ],
      context,
    );
  }
  if (calledMethod === "toString" && node.arguments.length <= 1) {
    const argument = node.arguments.at(0);
    // Object of an object gives the object, whose kind its type tells.
    const read =
      argument !== undefined &&
      ts.isCallExpression(argument) &&
      isObjectConversion(argument, context) &&
      argument.arguments.length === 1
        ? argument.arguments[0]
        : argument;
    const kind = read === undefined ? "other" : getKind(read, context);
    const collection = read === undefined ? undefined : getCollection(read, context);
    // A primitive gives the Symbol.toStringTag of its prototype where that's a string.
    const type = argument === undefined ? undefined : context.checker.getTypeAtLocation(argument);
    const flags =
      type === undefined
        ? 0
        : (type.isUnion() ? type.types : [type]).reduce((all, inner) => all | inner.flags, 0);
    for (const [flag, name] of new Map([
      [ts.TypeFlags.NumberLike, "Number"],
      [ts.TypeFlags.StringLike, "String"],
      [ts.TypeFlags.BooleanLike, "Boolean"],
      [ts.TypeFlags.BigIntLike, "BigInt"],
      [ts.TypeFlags.ESSymbolLike, "Symbol"],
    ])) {
      if (
        (flags & (flag | ts.TypeFlags.Any | ts.TypeFlags.Unknown | ts.TypeFlags.Instantiable)) !==
        0
      ) {
        context.builtIns.add(`${name}.prototype`);
      }
    }
    return useJavaScript(
      "ObjectToString",
      [
        getHeap(scope, node, context),
        argument === undefined
          ? getUndefined(context)
          : translateExpression(argument, scope, context),
        string(kind === "sequence" ? "Array" : (collection ?? "")),
      ],
      context,
    );
  }
  if (global === "Object" && method === "is" && node.arguments.length === 2) {
    if (
      node.arguments.some(
        (argument) =>
          isObject(context.checker.getTypeAtLocation(argument)) &&
          !isBuiltInObject(argument, context) &&
          getKind(argument, context) !== "object",
      )
    ) {
      throw new TlaTypeScriptError("TLA+ compares objects by value, not by identity", node);
    }
    const values = node.arguments.map((argument) => translateExpression(argument, scope, context));
    return isComparable(node.arguments[0], node.arguments[1], context)
      ? apply("=", values)
      : useJavaScript("SameValue", values, context);
  }
  // Error.prototype.toString of an error that the heap holds, where it inherits that method.
  if (
    ts.isPropertyAccessExpression(node.expression) &&
    method === "toString" &&
    node.arguments.length === 0 &&
    isHeldErrorName(node.expression.expression, context)
  ) {
    const heap = getHeap(scope, node, context);
    return share(
      translateExpression(node.expression.expression, scope, context),
      "error",
      context,
      (error) =>
        ifExpression(
          apply("=", [
            useJavaScript("Get", [heap, error, string("toString")], context),
            useJavaScript(":>", [identifier("Ref"), string("Error.prototype.toString")], context),
          ]),
          useJavaScript("ErrorToString", [heap, error], context),
          apply("Assert", [boolean(false), string("tla-ts can't call this toString")]),
        ),
    );
  }
  // An object's toString or toLocaleString that TypeScript types as Object's, or Object.prototype's
  // own, where it reads Object.prototype's.
  if (
    (method === "toString" || method === "toLocaleString") &&
    node.arguments.length === 0 &&
    context.heap !== undefined &&
    context.checker
      .getSymbolAtLocation(node.expression.name)
      ?.declarations?.some(
        (declaration) =>
          ts.isInterfaceDeclaration(declaration.parent) &&
          declaration.parent.name.text === "Object",
      ) === true &&
    // A wrapper object reads its prototype's toString.
    !["Boolean", "Number", "String", "Symbol", "BigInt"].includes(
      context.checker.getTypeAtLocation(receiver).getSymbol()?.name ?? "",
    ) &&
    (getKind(receiver, context) === "object" ||
      context.checker.getTypeAtLocation(receiver).getSymbol()?.name === "Object" ||
      (ts.isPropertyAccessExpression(receiver) &&
        receiver.name.text === "prototype" &&
        getBuiltIn(receiver.expression, context) === "Object"))
  ) {
    return useJavaScript(
      "ObjectMethodString",
      [
        getHeap(scope, node, context),
        translateObjectValue(receiver, scope, context),
        string(method),
      ],
      context,
    );
  }
  const constructed =
    global === "Object" && method === "fromEntries"
      ? translateFunctionConstructor(node.arguments[0], scope, context)
      : translateArrayConstructor(node, scope, context);
  return constructed ?? translateMethod(node, scope, context, isDefined);
};

// A value that a Set or a Map keeps as a key, where -0 is 0.
export const translateSetKey = (node: ts.Expression, scope: Scope, context: Context) => {
  // A set or a map finds a key by identity, which a sequence lacks.
  if (
    getKind(node, context) !== "object" &&
    mayBeSequenceType(
      context.checker.getNonNullableType(context.checker.getTypeAtLocation(node)),
      context.checker,
    )
  ) {
    throw new TlaTypeScriptError(
      "tla-ts can't tell whether two equal arrays are the same array",
      node,
    );
  }
  const value = translateExpression(node, scope, context);
  return context.hasSpecialNumbers && mayBeNumber(node, context)
    ? useJavaScript("KeyOf", [value], context)
    : value;
};

// A value as a string, as JavaScript converts it in a template or beside a string in +.
// A BigInt, which the JavaScript module holds as its integer under the model value Big.
export const translateBigInt = (value: number, context: Context) =>
  useJavaScript(":>", [identifier("Big"), number(value)], context);

// The types of the primitives that StringOf converts, where a union may hold any of them.
export const PRIMITIVE_NAMES = new Set(["string", "number", "boolean", "undefined", "null"]);

export const translateToString = (node: ts.Expression, scope: Scope, context: Context) => {
  const value = translateExpression(node, scope, context);
  const type = context.checker.getTypeAtLocation(node);
  const flags = type.flags;
  const inner = skipCasts(node);
  // A read of a missing element gives undefined where TypeScript types it as the element, so only
  // a string that the script writes or joins is surely one.
  if (getKind(node, context) === "string" && isEvery(type, ts.TypeFlags.StringLike)) {
    return ts.isStringLiteralLike(inner) ||
      ts.isTemplateExpression(inner) ||
      (ts.isBinaryExpression(inner) && inner.operatorToken.kind === ts.SyntaxKind.PlusToken)
      ? value
      : share(value, "text", context, (text) =>
          ifExpression(apply("=", [text, getUndefined(context)]), string("undefined"), text),
        );
  }
  if (isNumberLike(node, context)) return translateNumberString(value, context);
  if (isBigIntLike(node, context) || isBooleanLike(node, context)) {
    return useJavaScript("StringOf", [value], context);
  }
  if (flags & ts.TypeFlags.Null) return string("null");
  if (flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Void)) return string("undefined");
  const names = getTypeNames(context.checker.getTypeAtLocation(node), context.checker);
  if (names === undefined || names.every((name) => PRIMITIVE_NAMES.has(name))) {
    return useJavaScript("StringOf", [value], context);
  }
  // A function converts to its source text, which a branch that never runs, such as an error's
  // message, may still hold.
  if (names.every((name) => name === "function")) {
    return apply("Assert", [boolean(false), string("tla-ts can't convert a function to a string")]);
  }
  throw new TlaTypeScriptError(`Convert this to a string explicitly: ${node.getText()}`, node);
};

const translateTemplate = (node: ts.TemplateExpression, scope: Scope, context: Context) => {
  return concatenate([
    ...(node.head.text === "" ? [] : [string(node.head.text)]),
    ...node.templateSpans.flatMap((span) => {
      const value = translateToString(span.expression, scope, context);
      return span.literal.text === "" ? [value] : [value, string(span.literal.text)];
    }),
  ]);
};

// Both sides name one variable, which holds one value at a time.
const isSameName = (left: ts.Expression, right: ts.Expression, context: Context) =>
  ts.isIdentifier(left) &&
  ts.isIdentifier(right) &&
  getSymbol(left, context.checker) === getSymbol(right, context.checker);

const OBJECT_FLAGS =
  ts.TypeFlags.Object |
  ts.TypeFlags.NonPrimitive |
  ts.TypeFlags.Any |
  ts.TypeFlags.Unknown |
  ts.TypeFlags.TypeParameter;

// A value that may be an object that the heap doesn't hold.
const mayBeValueObject = (node: ts.Expression, context: Context) => {
  const kind = getKind(node, context);
  const type = context.checker.getTypeAtLocation(node);
  return (
    kind === "set" ||
    kind === "map" ||
    (kind === "other" &&
      (type.isUnion() ? type.types : [type]).some((member) => (member.flags & OBJECT_FLAGS) !== 0))
  );
};

// The raw text of a template's literal, where a carriage return, alone or before a line feed, is a
// line feed.
export const getRawString = (literal: ts.TemplateLiteralLikeNode) =>
  (literal.rawText ?? "").replace(/\r\n?/g, "\n");

const getRawText = (literal: ts.TemplateLiteralLikeNode) => string(getRawString(literal));

// String.raw of a template, which joins the raw text of its literals with its substitutions.
const translateRawTemplate = (
  node: ts.TaggedTemplateExpression,
  scope: Scope,
  context: Context,
) => {
  const template = node.template;
  const joined = ts.isNoSubstitutionTemplateLiteral(template)
    ? getRawText(template)
    : concatenate([
        getRawText(template.head),
        ...template.templateSpans.flatMap((span) => [
          translateToString(span.expression, scope, context),
          getRawText(span.literal),
        ]),
      ]);
  return context.heap === undefined
    ? joined
    : ifExpression(
        useJavaScript(
          "HoldsBuiltIn",
          [
            getHeap(scope, node, context),
            translateBuiltInValue("String", node, context),
            string("raw"),
            string("String.raw"),
          ],
          context,
        ),
        joined,
        apply("Assert", [
          boolean(false),
          string("tla-ts can't call String.raw where a script replaced it"),
        ]),
      );
};

const translateBinary = (node: ts.BinaryExpression, scope: Scope, context: Context) => {
  const kind = node.operatorToken.kind;
  const translate = (inner: ts.Expression) => translateExpression(inner, scope, context);
  const isString =
    getKind(node.left, context) === "string" || getKind(node.right, context) === "string";
  // The left operand runs though nothing reads it, so that a getter it reads, which tla-ts can't
  // call, stops the check. A literal can't stop it.
  if (kind === ts.SyntaxKind.CommaToken) {
    if (ts.isLiteralExpression(node.left)) return translate(node.right);
    const left = translate(node.left);
    const right = translate(node.right);
    return ifExpression(apply("=", [left, left]), right, right);
  }
  const logical = LOGICAL_OPERATORS.get(kind);
  if (logical !== undefined) {
    if (isBooleanLike(node.left, context) && isBooleanLike(node.right, context)) {
      return junction(logical, [translate(node.left), translate(node.right)]);
    }
    // The operand that decides is the value, as JavaScript gives it.
    return share(translate(node.left), "left", context, (left) => {
      const isTruthy = translateTruthy(node.left, left, context);
      const right = translate(node.right);
      return logical === "And"
        ? ifExpression(isTruthy, right, left)
        : ifExpression(isTruthy, left, right);
    });
  }
  if (kind === ts.SyntaxKind.PlusToken && isString) {
    return apply("\\o", [
      translateToString(node.left, scope, context),
      translateToString(node.right, scope, context),
    ]);
  }
  if (ORDERING_OPERATORS.has(kind) && isString) {
    if (getKind(node.left, context) !== "string" || getKind(node.right, context) !== "string") {
      throw new TlaTypeScriptError("Compare a string only with another string", node);
    }
    const left = translate(node.left);
    const right = translate(node.right);
    const isLess = (lesser: Expression, greater: Expression) =>
      useJavaScript("StringLessThan", [lesser, greater], context);
    return kind === ts.SyntaxKind.LessThanToken
      ? isLess(left, right)
      : kind === ts.SyntaxKind.GreaterThanToken
        ? isLess(right, left)
        : kind === ts.SyntaxKind.LessThanEqualsToken
          ? not(isLess(right, left))
          : not(isLess(left, right));
  }
  const bigIntOperator = BIGINT_OPERATORS.get(kind);
  if (
    bigIntOperator !== undefined &&
    isBigIntLike(node.left, context) &&
    isBigIntLike(node.right, context)
  ) {
    return useJavaScript(bigIntOperator, [translate(node.left), translate(node.right)], context);
  }
  // An ordering compares BigInts and numbers by their mathematical values.
  const isBigIntOrdering =
    ORDERING_OPERATORS.has(kind) &&
    (isBigIntLike(node.left, context) || isBigIntLike(node.right, context)) &&
    [node.left, node.right].every(
      (side) => isBigIntLike(side, context) || isNumberLike(side, context),
    );
  if (isBigIntOrdering) {
    const [lesser, greater] =
      kind === ts.SyntaxKind.LessThanToken || kind === ts.SyntaxKind.LessThanEqualsToken
        ? [node.left, node.right]
        : [node.right, node.left];
    const isStrict =
      kind === ts.SyntaxKind.LessThanToken || kind === ts.SyntaxKind.GreaterThanToken;
    return useJavaScript(
      isStrict ? "NumericLessThan" : "NumericLessOrEqual",
      [translate(lesser), translate(greater)],
      context,
    );
  }
  if (
    ARITHMETIC_OPERATORS.has(kind) &&
    (!isNumberLike(node.left, context) || !isNumberLike(node.right, context))
  ) {
    throw new TlaTypeScriptError(`${node.operatorToken.getText()} needs numbers`, node);
  }
  const numberOperator = context.hasSpecialNumbers ? NUMBER_OPERATORS.get(kind) : undefined;
  if (numberOperator !== undefined) {
    const operands = [translate(node.left), translate(node.right)];
    return useJavaScript(
      numberOperator.name,
      numberOperator.isSwapped ? operands.toReversed() : operands,
      context,
    );
  }
  if (kind === ts.SyntaxKind.PlusToken)
    return apply("+", [translate(node.left), translate(node.right)]);
  if (kind === ts.SyntaxKind.PercentToken) {
    context.prelude.add("Rem");
    return apply("Rem", [translate(node.left), translate(node.right)]);
  }
  if (kind === ts.SyntaxKind.QuestionQuestionToken) {
    context.prelude.add("Null");
    context.prelude.add("Undefined");
    return share(translate(node.left), "value", context, (value) =>
      ifExpression(
        apply("\\in", [value, set([identifier("Null"), identifier("Undefined")])]),
        translate(node.right),
        value,
      ),
    );
  }
  if (kind === ts.SyntaxKind.InstanceOfKeyword) return translateInstanceOf(node, scope, context);
  const isLoose =
    kind === ts.SyntaxKind.EqualsEqualsToken || kind === ts.SyntaxKind.ExclamationEqualsToken;
  const isPositive =
    kind === ts.SyntaxKind.EqualsEqualsEqualsToken || kind === ts.SyntaxKind.EqualsEqualsToken;
  const [leftNames, rightNames] = [node.left, node.right].map((side) =>
    getTypeNames(context.checker.getTypeAtLocation(side), context.checker),
  );
  // == is === between values of one type.
  if (
    isLoose &&
    !(leftNames?.length === 1 && rightNames?.length === 1 && leftNames[0] === rightNames[0])
  ) {
    const isEqual = useJavaScript(
      "LooseEquals",
      [
        context.heap === undefined ? tuple([]) : getHeap(scope, node, context),
        translate(node.left),
        translate(node.right),
      ],
      context,
    );
    return isPositive ? isEqual : not(isEqual);
  }
  const isEquality =
    isLoose ||
    kind === ts.SyntaxKind.EqualsEqualsEqualsToken ||
    kind === ts.SyntaxKind.ExclamationEqualsEqualsToken;
  if (
    isEquality &&
    context.hasSpecialNumbers &&
    (mayBeNumber(node.left, context) || mayBeNumber(node.right, context))
  ) {
    const isEqual = useJavaScript(
      "StrictEquals",
      [translate(node.left), translate(node.right)],
      context,
    );
    return isPositive ? isEqual : not(isEqual);
  }
  if (isEquality && !isComparable(node.left, node.right, context)) {
    const isSame = useJavaScript(
      "SameValue",
      [translate(node.left), translate(node.right)],
      context,
    );
    return isPositive ? isSame : not(isSame);
  }
  // A script's arrays outside the heap are TLA+ sequences, which compare by value, so equal ones
  // may still be two arrays, unless both sides name the same one.
  if (
    isEquality &&
    isScript(node.getSourceFile()) &&
    getKind(node.left, context) === "sequence" &&
    getKind(node.right, context) === "sequence" &&
    !isSameName(node.left, node.right, context)
  ) {
    return ifExpression(
      apply("=", [translate(node.left), translate(node.right)]),
      apply("Assert", [
        boolean(false),
        string("tla-ts can't tell whether two equal arrays are the same array"),
      ]),
      boolean(!isPositive),
    );
  }
  // A script's other objects outside the heap, such as a Set or an error that JavaScript throws,
  // compare by value too, unless they hold the identity that made them.
  if (
    isEquality &&
    isScript(node.getSourceFile()) &&
    mayBeValueObject(node.left, context) &&
    mayBeValueObject(node.right, context) &&
    !isSameName(node.left, node.right, context)
  ) {
    const isSame = useJavaScript(
      "IsIdentical",
      [translate(node.left), translate(node.right)],
      context,
    );
    return isPositive ? isSame : not(isSame);
  }
  if (kind === ts.SyntaxKind.InKeyword) {
    if (ts.isPrivateIdentifier(node.left)) {
      const member = getPrivateMember(node.left, context);
      if (member === undefined) {
        throw new TlaTypeScriptError("Unsupported private name", node.left);
      }
      return translateHasPrivate(member, node.right, scope, context);
    }
    const container = getKind(node.right, context);
    // A script's heap holds the built-in objects too, such as Number.
    if (container === "object" || (container === "other" && context.heap !== undefined)) {
      return useJavaScript(
        "Has",
        [
          getHeap(scope, node, context),
          translate(node.right),
          translatePropertyKey(node.left, scope, context),
        ],
        context,
      );
    }
    // An array has its indices from 0, and properties such as length that tla-ts can't list, and
    // a Map or a Set has properties, not its keys.
    if (container === "sequence" && isNumberLike(node.left, context)) {
      const length = apply("Len", [translate(node.right)]);
      const isOwn = context.hasSpecialNumbers
        ? apply("\\in", [
            useJavaScript("ElementPosition", [translate(node.left)], context),
            apply("..", [number(1), length]),
          ])
        : apply("\\in", [
            translate(node.left),
            apply("..", [number(0), apply("-", [length, number(1)])]),
          ]);
      return context.hasInheritedElements
        ? junction("Or", [
            isOwn,
            useJavaScript(
              "Has",
              [
                getHeap(scope, node, context),
                translateBuiltInValue("Array.prototype", node, context),
                translatePropertyKey(node.left, scope, context),
              ],
              context,
            ),
          ])
        : isOwn;
    }
    if (container !== "other") {
      throw new TlaTypeScriptError("Unsupported operator: in", node.operatorToken);
    }
    return apply("\\in", [translate(node.left), apply("DOMAIN", [translate(node.right)])]);
  }
  const bitwise = BITWISE_OPERATORS.get(kind);
  if (
    bitwise !== undefined &&
    (isBigIntLike(node.left, context) || isBigIntLike(node.right, context))
  ) {
    throw new TlaTypeScriptError(
      `Unsupported operator on BigInts: ${node.operatorToken.getText()}`,
      node,
    );
  }
  if (bitwise !== undefined) {
    return useJavaScript(
      bitwise,
      [node.left, node.right].map(
        (operand) =>
          translateInt32Literal(operand) ?? translateToNumber(operand, node, scope, context),
      ),
      context,
    );
  }
  if (kind === ts.SyntaxKind.SlashToken) {
    throw new TlaTypeScriptError("Write division as Math.floor(a / b) or Math.trunc(a / b)", node);
  }
  // TLA+'s ^ takes no negative exponent, where ** gives a fraction or Infinity, which stop here.
  if (kind === ts.SyntaxKind.AsteriskAsteriskToken) {
    return useJavaScript(
      "PlainNumber",
      [useJavaScript("Power", [translate(node.left), translate(node.right)], context)],
      context,
    );
  }
  const operator = BINARY_OPERATORS.get(kind);
  if (operator === undefined) {
    throw new TlaTypeScriptError(
      `Unsupported operator: ${node.operatorToken.getText()}`,
      node.operatorToken,
    );
  }
  return apply(operator, [translate(node.left), translate(node.right)]);
};

// A field of the state before the step, which is the variable's unprimed value.
const getPreviousVariable = (name: string, node: ts.Node, context: Context) => {
  const variable = [...context.variables].find((entry) => entry[0].name === name);
  if (variable === undefined) throw new TlaTypeScriptError(`Unknown variable: ${name}`, node);
  return variable[1];
};

const translateEnumMember = (node: ts.Node, symbol: ts.Symbol, context: Context) => {
  const declaration = symbol.valueDeclaration;
  const value =
    declaration !== undefined && ts.isEnumMember(declaration)
      ? context.checker.getConstantValue(declaration)
      : undefined;
  if (typeof value === "string") return translateString(value, context);
  if (typeof value === "number" && Number.isInteger(value)) return number(value);
  throw new TlaTypeScriptError("Unsupported enum member", node);
};

// The value that an enum or a top-level declaration gives a name.
// A built-in object where a script's heap holds it.
const isHeapBuiltIn = (node: ts.Expression, scope: Scope, context: Context) =>
  context.heap !== undefined && scope.bindings.has(context.heap) && isBuiltInObject(node, context);

const translateDeclared = (
  node: ts.Node,
  symbol: ts.Symbol | undefined,
  scope: Scope,
  context: Context,
) => {
  if (symbol !== undefined && symbol.flags & ts.SymbolFlags.EnumMember) {
    return translateEnumMember(node, symbol, context);
  }
  const declaration = getTopLevelDeclaration(symbol);
  if (declaration === undefined) return undefined;
  if (ts.isVariableDeclaration(declaration) && getFactoryCall(declaration.initializer, context)) {
    throw new TlaTypeScriptError(
      "tla-ts can't use a function that a factory returns as a value",
      node,
    );
  }
  // A function passes as its operator's name, and a constant as its value.
  return getFunction(declaration) === undefined
    ? translateHelperCall(declaration, undefined, scope, context)
    : identifier(getDefinition(declaration, context).name);
};

const SPECIAL_NUMBER_NAMES = new Map([
  ["NaN", "NaN"],
  ["Infinity", "Infinity"],
  ["-Infinity", "NegativeInfinity"],
  ["-0", "NegativeZero"],
]);

const getFraction = (value: number, context: Context) => {
  const name = context.fractions.get(value) ?? context.names.getFresh("Fraction");
  context.fractions.set(value, name);
  return name;
};

// A number that tla-ts works out as it compiles, or undefined where this script can't hold it. A
// script that computes as JavaScript holds a number that isn't an integer as a model value, whose
// negation has one too, which Negate gives. TLC holds its floor, so it stays inside 32 bits.
export const getNumberValue = (value: number, context: Context) => {
  if (Number.isInteger(value) && !Object.is(value, -0) && Math.abs(value) <= 2 ** 31 - 1) {
    return number(value);
  }
  if (!context.hasSpecialNumbers) return undefined;
  const special = SPECIAL_NUMBER_NAMES.get(Object.is(value, -0) ? "-0" : String(value));
  if (special === undefined && (Number.isInteger(value) || Math.abs(value) >= 2 ** 31 - 1)) {
    return undefined;
  }
  context.prelude.add("JavaScript");
  if (special !== undefined) return identifier(special);
  getFraction(-value, context);
  return identifier(getFraction(value, context));
};

const translateFraction = (value: number, node: ts.Node, context: Context) => {
  const fraction = getNumberValue(value, context);
  if (fraction === undefined) {
    throw new TlaTypeScriptError(`Only integers are supported: ${node.getText()}`, node);
  }
  return fraction;
};

const translateIdentifier = (node: ts.Identifier, scope: Scope, context: Context) => {
  if (node.text === "undefined") return getUndefined(context);
  rejectGeneratorUse(node, context);
  if (
    context.hasSpecialNumbers &&
    (node.text === "NaN" || node.text === "Infinity") &&
    (getSymbol(node, context.checker)?.declarations ?? []).every(
      (declaration) => declaration.getSourceFile().isDeclarationFile,
    )
  ) {
    context.prelude.add("JavaScript");
    return identifier(node.text);
  }
  rejectBeforeDeclaration(node, scope, context);
  const symbol = getSymbol(node, context.checker);
  const held = symbol === undefined ? undefined : scope.functions.get(symbol);
  if (held !== undefined) {
    const value = getFunctionValue(held, context);
    if (value === undefined) {
      throw new TlaTypeScriptError(`${node.text} holds a function, so only call it`, node);
    }
    return translateFunctionValue(value, context);
  }
  const binding = symbol === undefined ? undefined : scope.bindings.get(symbol);
  if (binding !== undefined) return binding;
  // A call holds the arguments object it makes under the body of the function it calls.
  const argumentsBody = getArgumentsOwner(node, context.checker)?.body;
  const argumentsObject = argumentsBody && scope.allocated.get(argumentsBody);
  if (argumentsObject !== undefined) return argumentsObject;
  if (symbol !== undefined && symbol === scope.previous) {
    return formatRecord(
      context.checker
        .getTypeAtLocation(node)
        .getProperties()
        .map((property) => ({
          key: property.name,
          value: getPreviousVariable(property.name, node, context),
        })),
      node,
    );
  }
  const functionValue = getFunctionValue(node, context);
  if (functionValue !== undefined) return translateFunctionValue(functionValue, context);
  if (symbol?.valueDeclaration !== undefined && ts.isFunctionExpression(symbol.valueDeclaration)) {
    throw new TlaTypeScriptError(
      `tla-ts can't read ${node.text}, the name that this function gives itself`,
      node,
    );
  }
  const declared = translateDeclared(node, symbol, scope, context);
  if (declared !== undefined) return declared;
  if (symbol !== undefined && context.variables.has(symbol)) {
    throw new TlaTypeScriptError(`${node.text} can't be read here`, node);
  }
  const builtIn =
    context.heap === undefined ? undefined : translateBuiltInObject(node, scope, context);
  if (builtIn !== undefined) return builtIn;
  const errorClass = getErrorClass(symbol, context.checker)?.[0];
  if (errorClass !== undefined) return getConstructor(errorClass, context);
  const intrinsic = translateIntrinsic(node, scope, context);
  if (intrinsic !== undefined) return intrinsic;
  // A name that only declarations type, as Node's typings type process, has no code to run.
  const declarations = symbol?.declarations ?? [];
  if (
    declarations.length > 0 &&
    declarations.every(
      (declaration) =>
        (declaration.getSourceFile().isDeclarationFile ||
          (ts.getCombinedModifierFlags(declaration) & ts.ModifierFlags.Ambient) !== 0) &&
        !declaration.getSourceFile().hasNoDefaultLib,
    )
  ) {
    throw new TlaTypeScriptError(
      `tla-ts can't run ${node.text}, which only a declaration gives`,
      node,
    );
  }
  // The global object, whose properties tla-ts doesn't read.
  if (
    node.text === "globalThis" &&
    context.heap !== undefined &&
    symbol !== undefined &&
    (symbol.flags & ts.SymbolFlags.ValueModule) !== 0
  ) {
    context.prelude.add("JavaScript");
    return identifier("GlobalObject");
  }
  throw new TlaTypeScriptError(`Unknown name: ${node.text}`, node);
};

// A read of a property that a getter of a heap class or object literal computes, which inlines
// the getter while the object holds it.
const translateGetterRead = (
  node: ts.PropertyAccessExpression | ts.ElementAccessExpression,
  scope: Scope,
  context: Context,
) => {
  const getter = getObjectGetter(node, context);
  const key = getAccessKey(node);
  if (getter === undefined || key === undefined) return undefined;
  const heap = getHeap(scope, node, context);
  const value = translateObjectValue(node.expression, scope, context);
  if (isPrivateMember(getter)) {
    return ifExpression(
      translateHasPrivate(getter, node.expression, scope, context),
      translateGetterCall(node, { method: getter, receiver: node.expression, key }, scope, context),
      apply("Assert", [boolean(false), string(PRIVATE_TYPE_ERROR)]),
    );
  }
  return ifExpression(
    apply("=", [
      useJavaScript("GetterOf", [heap, value, string(key)], context),
      getMethodValue(getter, context),
    ]),
    translateGetterCall(node, { method: getter, receiver: node.expression, key }, scope, context),
    useJavaScript("Get", [heap, value, string(key)], context),
  );
};

const OWN_KEYS = new Map([
  ["getOwnPropertyNames", "OwnPropertyNames"],
  ["getOwnPropertySymbols", "OwnPropertySymbols"],
  ["keys", "ObjectKeys"],
  ["values", "ObjectValues"],
  ["entries", "ObjectEntries"],
]);

const PRIVATE_TYPE_ERROR =
  "tla-ts can't throw the TypeError of using a private name an object lacks";

// A private field's value, a private method, or what a private getter gives.
const translatePrivateRead = (
  node: ts.PropertyAccessExpression,
  scope: Scope,
  context: Context,
) => {
  const getterRead = translateGetterRead(node, scope, context);
  if (getterRead !== undefined) return getterRead;
  const member = ts.isPrivateIdentifier(node.name)
    ? getPrivateMember(node.name, context)
    : undefined;
  if (member === undefined) throw new TlaTypeScriptError("Unsupported private name", node.name);
  if (ts.isPropertyDeclaration(member)) {
    return useJavaScript(
      "PrivateGet",
      [
        getHeap(scope, node, context),
        translateObjectValue(node.expression, scope, context),
        string(getPrivateKey(member, context)),
      ],
      context,
    );
  }
  const method = getObjectMethod(member, context);
  return ifExpression(
    translateHasPrivate(member, node.expression, scope, context),
    method === undefined
      ? apply("Assert", [
          boolean(false),
          string("tla-ts can't throw the TypeError of reading an accessor without a getter"),
        ])
      : getMethodValue(method, context),
    apply("Assert", [boolean(false), string(PRIVATE_TYPE_ERROR)]),
  );
};

// The properties that a regexp's getters read from its record, and its lastIndex, which stays 0
// without objects.
const REGEXP_PROPERTIES = new Set([
  "source",
  "flags",
  "hasIndices",
  "global",
  "ignoreCase",
  "multiline",
  "dotAll",
  "unicode",
  "unicodeSets",
  "sticky",
  "lastIndex",
]);

// A read of a regexp's property, or without objects of an element or a property of the array that
// exec or match gives. An optional read gives undefined where the array is null, though not for
// the rest of a chain.
const translateRegExpRead = (
  node: ts.PropertyAccessExpression | ts.ElementAccessExpression,
  getKey: () => Expression | undefined,
  scope: Scope,
  context: Context,
) => {
  const type = context.checker.getTypeAtLocation(node.expression);
  const isRegExp = type.getSymbol()?.name === "RegExp";
  // With objects, a flag or the source is what a getter of RegExp.prototype reads from the regexp.
  if (context.heap !== undefined) {
    const name = ts.isPropertyAccessExpression(node) ? node.name.text : "";
    return isRegExp &&
      node.questionDotToken === undefined &&
      name !== "lastIndex" &&
      REGEXP_PROPERTIES.has(name)
      ? field(
          useJavaScript(
            "RegExpOf",
            [
              getHeap(scope, node, context),
              translateExpression(node.expression, scope, context),
              set([string("RegExp.prototype")]),
            ],
            context,
          ),
          name,
        )
      : undefined;
  }
  if (!isRegExp && !isRegExpArray(context.checker.getNonNullableType(type))) return undefined;
  const name = ts.isPropertyAccessExpression(node) ? node.name.text : undefined;
  const key = getKey();
  const parent = node.parent;
  const isChainContinued =
    node.questionDotToken !== undefined &&
    (ts.isPropertyAccessExpression(parent) ||
      ts.isElementAccessExpression(parent) ||
      ts.isCallExpression(parent)) &&
    parent.expression === node;
  if (
    key === undefined ||
    isChainContinued ||
    (isRegExp && (name === undefined || !REGEXP_PROPERTIES.has(name)))
  ) {
    throw new TlaTypeScriptError(`Unsupported property: ${node.getText()}`, node);
  }
  const value = translateExpression(node.expression, scope, context);
  if (isRegExp) return name === "lastIndex" ? number(0) : field(value, name ?? "");
  return node.questionDotToken === undefined
    ? useJavaScript("RegExpElement", [value, key], context)
    : share(value, "array", context, (shared) =>
        ifExpression(
          apply("=", [shared, identifier("Null")]),
          getUndefined(context),
          useJavaScript("RegExpElement", [shared, key], context),
        ),
      );
};

// The key that reads an element or a property of the array that exec or match gives: a string, or
// a number that a literal writes, as the string that names it.
const translateRegExpKey = (key: ts.Expression, scope: Scope, context: Context) =>
  ts.isNumericLiteral(key)
    ? string(String(Number(key.text)))
    : isEvery(context.checker.getTypeAtLocation(key), ts.TypeFlags.StringLike)
      ? translateExpression(key, scope, context)
      : undefined;

// A read of a value of a native error's type, which may be an error that the heap holds. That one,
// or a key that an error's record lacks, reads through Get, which looks on the error's prototypes.
const translateNativeErrorRead = (
  value: Expression,
  key: Expression,
  heap: Expression,
  context: Context,
) =>
  share(value, "error", context, (error) =>
    share(key, "key", context, (sharedKey) =>
      ifExpression(
        apply("\\/", [
          useJavaScript("IsRef", [error], context),
          not(apply("\\in", [sharedKey, apply("DOMAIN", [error])])),
        ]),
        useJavaScript("Get", [heap, error, sharedKey], context),
        index(error, [sharedKey]),
      ),
    ),
  );

// A boolean or a number has no properties of its own, so it reads them from its prototype.
const translatePrimitiveRead = (
  node: ts.PropertyAccessExpression | ts.ElementAccessExpression,
  getKey: () => Expression,
  scope: Scope,
  context: Context,
) => {
  const names = getTypeNames(context.checker.getTypeAtLocation(node.expression), context.checker);
  const prototype =
    names?.length !== 1
      ? undefined
      : names[0] === "boolean"
        ? "Boolean.prototype"
        : names[0] === "number"
          ? "Number.prototype"
          : undefined;
  if (prototype === undefined) return undefined;
  if (context.heap === undefined) {
    throw new TlaTypeScriptError(`Unsupported property: ${node.getText()}`, node);
  }
  return useJavaScript(
    "Get",
    [getHeap(scope, node, context), translateBuiltInValue(prototype, node, context), getKey()],
    context,
  );
};

const translatePropertyAccess = (
  node: ts.PropertyAccessExpression,
  scope: Scope,
  context: Context,
) => {
  const regExpRead = translateRegExpRead(node, () => string(node.name.text), scope, context);
  if (regExpRead !== undefined) return regExpRead;
  if (node.questionDotToken !== undefined && scope.checked?.has(node) !== true) {
    throw new TlaTypeScriptError("Optional chaining isn't supported", node);
  }
  if (ts.isPrivateIdentifier(node.name)) return translatePrivateRead(node, scope, context);
  if (node.expression.kind === ts.SyntaxKind.SuperKeyword) {
    return translateSuperRead(node, string(node.name.text), scope, context);
  }
  const declared = translateDeclared(node, getSymbol(node, context.checker), scope, context);
  if (declared !== undefined) return declared;
  const intrinsic = translateIntrinsic(node, scope, context);
  if (intrinsic !== undefined) return intrinsic;
  const receiver = node.expression;
  const name = node.name.text;
  const getterRead = translateGetterRead(node, scope, context);
  if (getterRead !== undefined) return getterRead;
  const receiverNames = getTypeNames(context.checker.getTypeAtLocation(receiver), context.checker);
  // A symbol has no properties of its own, so it reads them from Symbol.prototype.
  if (receiverNames?.length === 1 && receiverNames[0] === "symbol") {
    return name === "description"
      ? translateSymbolProperty(receiver, name, node, scope, context)
      : useJavaScript(
          "Get",
          [
            getHeap(scope, node, context),
            translateBuiltInValue("Symbol.prototype", node, context),
            string(name),
          ],
          context,
        );
  }
  // A BigInt has no properties of its own, so it reads them from BigInt.prototype.
  if (isBigIntLike(receiver, context)) {
    if (context.heap === undefined) {
      throw new TlaTypeScriptError(`Unsupported property: ${node.getText()}`, node);
    }
    return useJavaScript(
      "Get",
      [
        getHeap(scope, node, context),
        translateBuiltInValue("BigInt.prototype", node, context),
        string(name),
      ],
      context,
    );
  }
  const primitiveRead = translatePrimitiveRead(node, () => string(name), scope, context);
  if (primitiveRead !== undefined) return primitiveRead;
  // A value of type Function, such as an object's constructor, may be a built-in function, which
  // only the heap knows the properties of.
  const isFunctionType =
    context.heap !== undefined &&
    context.checker.getTypeAtLocation(receiver).getSymbol()?.name === "Function";
  if (
    getKind(receiver, context) === "object" ||
    isFunctionType ||
    isHeapBuiltIn(receiver, scope, context)
  ) {
    return translateFoundGetter(
      node,
      getHeap(scope, node, context),
      translateObjectValue(receiver, scope, context),
      string(name),
      scope,
      context,
    );
  }
  if (
    scope.previous !== undefined &&
    ts.isIdentifier(receiver) &&
    getSymbol(receiver, context.checker) === scope.previous
  ) {
    return getPreviousVariable(name, node, context);
  }
  // A function that isn't an object keeps the length and the name it starts with. tla-ts tells the
  // name only where the function's own syntax gives it.
  if (
    (name === "length" || name === "name") &&
    context.checker.getTypeAtLocation(receiver).getCallSignatures().length > 0
  ) {
    const getProperty = (candidate: FunctionNode) => {
      if (name === "length") return number(getFunctionLength(getParameters(candidate)));
      const parent = candidate.parent;
      const given =
        (ts.isFunctionDeclaration(candidate) || ts.isFunctionExpression(candidate)) &&
        candidate.name !== undefined
          ? candidate.name
          : ts.isMethodDeclaration(candidate) &&
              (ts.isIdentifier(candidate.name) ||
                ts.isPrivateIdentifier(candidate.name) ||
                ts.isStringLiteral(candidate.name))
            ? candidate.name
            : (ts.isArrowFunction(candidate) || ts.isFunctionExpression(candidate)) &&
                ts.isVariableDeclaration(parent) &&
                parent.initializer === candidate &&
                ts.isIdentifier(parent.name)
              ? parent.name
              : undefined;
      return given === undefined ? undefined : string(given.text);
    };
    const symbol = ts.isIdentifier(receiver) ? getSymbol(receiver, context.checker) : undefined;
    const held = symbol === undefined ? undefined : scope.functions.get(symbol);
    const heldProperty = held === undefined ? undefined : getProperty(held);
    if (heldProperty !== undefined) return heldProperty;
    if (held !== undefined || context.heap === undefined) {
      throw new TlaTypeScriptError(`Unsupported property: ${node.getText()}`, node);
    }
    return share(translateExpression(receiver, scope, context), "function", context, (value) =>
      getFunctionCandidates(receiver, context).reduceRight<Expression>(
        (otherwise, candidate) => {
          const candidateValue = getCandidateValue(candidate, context);
          const property = getProperty(candidate);
          return candidateValue === undefined || property === undefined
            ? otherwise
            : ifExpression(apply("=", [value, candidateValue]), property, otherwise);
        },
        apply("Assert", [
          boolean(false),
          string("tla-ts can't tell which function this value holds"),
        ]),
      ),
    );
  }
  const size =
    name === "length" || name === "size" ? translateSize(receiver, scope, context) : undefined;
  if (size !== undefined) return size;
  // An array holds only its elements and its length, so it reads any other property, such as its
  // constructor, from its prototypes.
  if (getKind(receiver, context) === "sequence" && context.heap !== undefined) {
    return useJavaScript(
      "Get",
      [
        getHeap(scope, node, context),
        translateBuiltInValue("Array.prototype", node, context),
        string(name),
      ],
      context,
    );
  }
  if (
    getKind(receiver, context) !== "other" ||
    context.checker.getTypeAtLocation(receiver).getCallSignatures().length > 0
  ) {
    throw new TlaTypeScriptError(`Unsupported property: ${node.getText()}`, node);
  }
  if (context.heap !== undefined && isCaughtRead(receiver, context)) {
    return useJavaScript(
      "Get",
      [getHeap(scope, node, context), translateExpression(receiver, scope, context), string(name)],
      context,
    );
  }
  // A generator runs its methods only where a script calls them.
  if (context.heap !== undefined && mayBeGeneratorType(receiver, context)) {
    throw new TlaTypeScriptError(`tla-ts can't read a generator's ${name} as a value`, node);
  }
  rejectAnyReceiver(receiver, context);
  if (context.heap !== undefined && isNativeErrorValue(receiver, context)) {
    return translateNativeErrorRead(
      translateExpression(receiver, scope, context),
      string(name),
      getHeap(scope, node, context),
      context,
    );
  }
  return getField(translateExpression(receiver, scope, context), name);
};

// A read of super.key or super[key], which finds the key from the base of the class the read is
// in, and runs a getter with the method's this.
const translateSuperRead = (
  node: ts.PropertyAccessExpression | ts.ElementAccessExpression,
  key: Expression,
  scope: Scope,
  context: Context,
) => {
  const lookup = getSuperLookup(node.expression, scope, context);
  return translateFoundGetter(
    node,
    getHeap(scope, node, context),
    lookup.start,
    key,
    scope,
    context,
    lookup.receiver,
  );
};

// The operators that convert an operand to a number, as + does where both operands are numbers.
const NUMERIC_OPERATORS = new Set([
  ts.SyntaxKind.MinusToken,
  ts.SyntaxKind.AsteriskToken,
  ts.SyntaxKind.SlashToken,
  ts.SyntaxKind.PercentToken,
  ts.SyntaxKind.AsteriskAsteriskToken,
  ts.SyntaxKind.LessThanToken,
  ts.SyntaxKind.GreaterThanToken,
  ts.SyntaxKind.LessThanEqualsToken,
  ts.SyntaxKind.GreaterThanEqualsToken,
  ts.SyntaxKind.AmpersandToken,
  ts.SyntaxKind.BarToken,
  ts.SyntaxKind.CaretToken,
  ts.SyntaxKind.LessThanLessThanToken,
  ts.SyntaxKind.GreaterThanGreaterThanToken,
  ts.SyntaxKind.GreaterThanGreaterThanGreaterThanToken,
  ts.SyntaxKind.MinusEqualsToken,
  ts.SyntaxKind.AsteriskEqualsToken,
  ts.SyntaxKind.SlashEqualsToken,
  ts.SyntaxKind.PercentEqualsToken,
  ts.SyntaxKind.AsteriskAsteriskEqualsToken,
  ts.SyntaxKind.AmpersandEqualsToken,
  ts.SyntaxKind.BarEqualsToken,
  ts.SyntaxKind.CaretEqualsToken,
  ts.SyntaxKind.LessThanLessThanEqualsToken,
  ts.SyntaxKind.GreaterThanGreaterThanEqualsToken,
  ts.SyntaxKind.GreaterThanGreaterThanGreaterThanEqualsToken,
]);

// Whether an operator or a Math function converts a value to a number, which takes undefined as
// NaN.
const isNumericOperand = (node: ts.Expression, context: Context): boolean => {
  const parent = node.parent;
  if (ts.isParenthesizedExpression(parent) || ts.isAsExpression(parent)) {
    return isNumericOperand(parent, context);
  }
  if (ts.isPrefixUnaryExpression(parent)) {
    return [ts.SyntaxKind.MinusToken, ts.SyntaxKind.PlusToken, ts.SyntaxKind.TildeToken].includes(
      parent.operator,
    );
  }
  if (ts.isCallExpression(parent)) {
    return (
      parent.arguments.includes(node) &&
      ts.isPropertyAccessExpression(parent.expression) &&
      parent.expression.expression.getText() === "Math"
    );
  }
  if (!ts.isBinaryExpression(parent)) return false;
  const kind = parent.operatorToken.kind;
  const isAssigned = kind >= ts.SyntaxKind.FirstAssignment && kind <= ts.SyntaxKind.LastAssignment;
  return (
    !(isAssigned && parent.left === node) &&
    (NUMERIC_OPERATORS.has(kind) ||
      ([ts.SyntaxKind.PlusToken, ts.SyntaxKind.PlusEqualsToken].includes(kind) &&
        isNumberLike(parent.left, context) &&
        isNumberLike(parent.right, context)))
  );
};

// A read that an operator converts to a number, where a read past an array's end, or of a key that
// an index signature lacks, gives undefined, though TypeScript types it as the value: NaN in a
// script that has special numbers, and otherwise a stop, as tla-ts holds no NaN there.
const toNumericRead = (node: ts.Expression, read: Expression, context: Context) =>
  isNumberLike(node, context) && isNumericOperand(node, context)
    ? guardNumber(read, context)
    : read;

const guardNumber = (read: Expression, context: Context) => {
  context.prelude.add("JavaScript");
  return share(read, "element", context, (element) =>
    ifExpression(
      apply("=", [element, getUndefined(context)]),
      context.hasSpecialNumbers
        ? identifier("NaN")
        : apply("Assert", [
            boolean(false),
            string("tla-ts can't compute with the undefined that a read past an array's end gives"),
          ]),
      element,
    ),
  );
};

// Whether a node is a pattern's target, which an assignment or a for-of gives a value.
const isPatternTarget = (node: ts.Node): boolean => {
  const parent = node.parent;
  if (
    ts.isArrayLiteralExpression(parent) ||
    ts.isObjectLiteralExpression(parent) ||
    ts.isShorthandPropertyAssignment(parent) ||
    ts.isSpreadElement(parent) ||
    ts.isSpreadAssignment(parent) ||
    (ts.isPropertyAssignment(parent) && parent.initializer === node) ||
    (ts.isBinaryExpression(parent) &&
      parent.left === node &&
      parent.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      isPatternTarget(parent))
  ) {
    return isPatternTarget(parent);
  }
  return (
    (ts.isArrayLiteralExpression(node) || ts.isObjectLiteralExpression(node)) &&
    ((ts.isBinaryExpression(parent) &&
      parent.left === node &&
      parent.operatorToken.kind === ts.SyntaxKind.EqualsToken) ||
      ((ts.isForOfStatement(parent) || ts.isForInStatement(parent)) && parent.initializer === node))
  );
};

// Whether a value is a number that the script computes: a literal, or what an operator, a length,
// or Math gives, or a name that holds only those, which can't be the undefined that a read past an
// array's end gives.
const isComputedNumber = (node: ts.Expression, context: Context, seen: Set<ts.Symbol>): boolean => {
  const inner = skipCasts(node);
  if (ts.isConditionalExpression(inner)) {
    return (
      isComputedNumber(inner.whenTrue, context, seen) &&
      isComputedNumber(inner.whenFalse, context, seen)
    );
  }
  if (ts.isBinaryExpression(inner)) {
    const kind = inner.operatorToken.kind;
    return kind === ts.SyntaxKind.EqualsToken || kind === ts.SyntaxKind.CommaToken
      ? isComputedNumber(inner.right, context, seen)
      : [
            ts.SyntaxKind.AmpersandAmpersandToken,
            ts.SyntaxKind.BarBarToken,
            ts.SyntaxKind.QuestionQuestionToken,
          ].includes(kind)
        ? isComputedNumber(inner.left, context, seen) &&
          isComputedNumber(inner.right, context, seen)
        : true;
  }
  if (ts.isIdentifier(inner)) return holdsComputedNumber(inner, context, seen);
  return (
    ts.isNumericLiteral(inner) ||
    ts.isPrefixUnaryExpression(inner) ||
    ts.isPostfixUnaryExpression(inner) ||
    (ts.isPropertyAccessExpression(inner) && inner.name.text === "length") ||
    (ts.isCallExpression(inner) &&
      ts.isPropertyAccessExpression(inner.expression) &&
      inner.expression.expression.getText() === "Math")
  );
};

// Whether a variable holds only numbers that the script computes, where its declaration and each
// assignment give one.
const holdsComputedNumber = (
  name: ts.Identifier,
  context: Context,
  seen = new Set<ts.Symbol>(),
): boolean => {
  const symbol = getSymbol(name, context.checker);
  const declaration = symbol?.valueDeclaration;
  if (symbol === undefined || declaration === undefined) return false;
  if (seen.has(symbol) || declaration.getSourceFile().isDeclarationFile) return true;
  seen.add(symbol);
  if (
    !ts.isVariableDeclaration(declaration) ||
    declaration.initializer === undefined ||
    !isComputedNumber(declaration.initializer, context, seen)
  ) {
    return false;
  }
  const container =
    ts.findAncestor(declaration.parent, (ancestor) => ts.isFunctionLike(ancestor)) ??
    declaration.getSourceFile();
  return findNodes(container, ts.isIdentifier).every((reference) => {
    if (reference === declaration.name || getSymbol(reference, context.checker) !== symbol) {
      return true;
    }
    const parent = reference.parent;
    if (
      ts.isBinaryExpression(parent) &&
      parent.left === reference &&
      parent.operatorToken.kind === ts.SyntaxKind.EqualsToken
    ) {
      return isComputedNumber(parent.right, context, seen);
    }
    return !isPatternTarget(reference);
  });
};

const translateElementAccess = (
  node: ts.ElementAccessExpression,
  scope: Scope,
  context: Context,
  isDefined: boolean,
) => {
  const read = translateElementRead(node, scope, context, isDefined);
  return isDefined ? read : toNumericRead(node, read, context);
};

const translateElementRead = (
  node: ts.ElementAccessExpression,
  scope: Scope,
  context: Context,
  isDefined: boolean,
) => {
  if (node.expression.kind === ts.SyntaxKind.SuperKeyword) {
    return translateSuperRead(
      node,
      translatePropertyKey(node.argumentExpression, scope, context),
      scope,
      context,
    );
  }
  const regExpRead = translateRegExpRead(
    node,
    () => translateRegExpKey(node.argumentExpression, scope, context),
    scope,
    context,
  );
  if (regExpRead !== undefined) return regExpRead;
  // A built-in object that a well-known symbol keys, such as Iterator.prototype[Symbol.iterator],
  // whose own properties the heap then holds.
  const builtIn =
    context.heap !== undefined && scope.bindings.has(context.heap)
      ? translateBuiltInObject(node, scope, context)
      : undefined;
  if (builtIn !== undefined) return builtIn;
  const getterRead = translateGetterRead(node, scope, context);
  if (getterRead !== undefined) return getterRead;
  const primitiveRead = translatePrimitiveRead(
    node,
    () => translatePropertyKey(node.argumentExpression, scope, context),
    scope,
    context,
  );
  if (primitiveRead !== undefined) return primitiveRead;
  const kind = getKind(node.expression, context);
  // A Map or a Set off the heap has no own properties, so a symbol reads its prototype's.
  if (
    (kind === "map" || kind === "set") &&
    context.heap !== undefined &&
    isSymbolKey(node.argumentExpression, context)
  ) {
    return useJavaScript(
      "Get",
      [
        getHeap(scope, node, context),
        translateBuiltInValue(kind === "map" ? "Map.prototype" : "Set.prototype", node, context),
        translatePropertyKey(node.argumentExpression, scope, context),
      ],
      context,
    );
  }
  if (kind === "object" || isHeapBuiltIn(node.expression, scope, context)) {
    // A built-in object's symbol may key an object whose type isn't one that the heap holds, such
    // as Array.prototype[Symbol.unscopables].
    const type = context.checker.getTypeAtLocation(node);
    if (
      isSymbolKey(node.argumentExpression, context) &&
      getKind(node, context) === "other" &&
      (type.flags & ts.TypeFlags.Object) !== 0 &&
      type.getCallSignatures().length === 0
    ) {
      throw new TlaTypeScriptError("tla-ts can't read this object through a symbol", node);
    }
    return translateFoundGetter(
      node,
      getHeap(scope, node, context),
      translateObjectValue(node.expression, scope, context),
      translatePropertyKey(node.argumentExpression, scope, context),
      scope,
      context,
    );
  }
  if (context.heap !== undefined && isCaughtRead(node.expression, context)) {
    return useJavaScript(
      "Get",
      [
        getHeap(scope, node, context),
        translateExpression(node.expression, scope, context),
        translatePropertyKey(node.argumentExpression, scope, context),
      ],
      context,
    );
  }
  rejectAnyReceiver(node.expression, context);
  const value = translateExpression(node.expression, scope, context);
  const key = translateKey(node, scope, context);
  // An array reads an element past its end from its prototypes.
  if (kind === "sequence" && !isDefined) {
    return context.hasInheritedElements
      ? getElement(
          value,
          key,
          context,
          useJavaScript(
            "Get",
            [
              getHeap(scope, node, context),
              translateBuiltInValue("Array.prototype", node, context),
              translatePropertyKey(node.argumentExpression, scope, context),
            ],
            context,
          ),
        )
      : getElement(value, key, context);
  }
  // An object read through its index signature, rather than a property its type declares, may
  // lack the key, where JavaScript reads undefined.
  const checker = context.checker;
  const objectType = checker.getNonNullableType(checker.getTypeAtLocation(node.expression));
  const argument = node.argumentExpression;
  const isDeclared =
    (ts.isStringLiteralLike(argument) || ts.isNumericLiteral(argument)) &&
    objectType.getProperty(argument.text) !== undefined;
  if (
    kind === "other" &&
    !isDefined &&
    !isDeclared &&
    checker.getIndexInfosOfType(objectType).length > 0
  ) {
    return share(value, "object", context, (object) =>
      share(key, "key", context, (shared) =>
        ifExpression(
          apply("\\in", [shared, apply("DOMAIN", [object])]),
          index(object, [shared]),
          getUndefined(context),
        ),
      ),
    );
  }
  if (
    kind === "other" &&
    context.heap !== undefined &&
    isNativeErrorValue(node.expression, context)
  ) {
    return translateNativeErrorRead(
      value,
      translatePropertyKey(node.argumentExpression, scope, context),
      getHeap(scope, node, context),
      context,
    );
  }
  if (kind !== "string") return index(value, [key]);
  if (context.hasInheritedElements && !isDefined) {
    throw new TlaTypeScriptError(
      "tla-ts can't read a string past its end where a script changes Object.prototype",
      node,
    );
  }
  return share(value, "string", context, (text) =>
    share(key, "position", context, (position) => {
      const character = apply("SubSeq", [text, position, position]);
      if (isDefined) return character;
      return ifExpression(
        apply("\\in", [position, apply("..", [number(1), apply("Len", [text])])]),
        character,
        getUndefined(context),
      );
    }),
  );
};

// Whether a value is truthy, which a script's heap tells at run time. Otherwise the value's type
// tells: undefined and null are falsy, an object truthy, and a string, a number, or a boolean is
// truthy unless it's "", 0, or false. Undefined and null compare first, as TLC compares them with
// any value.
const translateTruthy = (node: ts.Expression, value: Expression, context: Context) => {
  if (context.heap !== undefined) return useJavaScript("ToBoolean", [value], context);
  const type = context.checker.getTypeAtLocation(node);
  const members = type.isUnion() ? type.types : [type];
  const getTruthKind = (member: ts.Type) =>
    (member.flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Void)) !== 0
      ? "undefined"
      : (member.flags & ts.TypeFlags.Null) !== 0
        ? "null"
        : (member.flags & (ts.TypeFlags.Object | ts.TypeFlags.NonPrimitive)) !== 0
          ? "object"
          : (member.flags & ts.TypeFlags.StringLike) !== 0
            ? "string"
            : (member.flags & ts.TypeFlags.NumberLike) !== 0 && !context.hasSpecialNumbers
              ? "number"
              : (member.flags & ts.TypeFlags.BigIntLike) !== 0
                ? "bigint"
                : (member.flags & ts.TypeFlags.BooleanLike) !== 0
                  ? "boolean"
                  : undefined;
  const kinds = new Set(members.map(getTruthKind));
  const defined = [...kinds].filter((kind) => kind !== "undefined" && kind !== "null");
  if (kinds.has(undefined) || defined.length > 1) {
    throw new TlaTypeScriptError("Conditions must be booleans, so compare explicitly", node);
  }
  // A read through an index signature may give undefined whatever the type says.
  context.prelude.add("Null");
  const tests = [
    apply("\\notin", [value, set([identifier("Null"), getUndefined(context)])]),
    ...(defined[0] === "string" ? [apply("#", [value, string("")])] : []),
    ...(defined[0] === "number" ? [apply("#", [value, number(0)])] : []),
    ...(defined[0] === "bigint" ? [apply("#", [value, translateBigInt(0, context)])] : []),
    ...(defined[0] === "boolean" ? [value] : []),
  ];
  return defined.length === 0
    ? boolean(false)
    : tests.length === 1
      ? tests[0]
      : junction("And", tests);
};

// A condition, which converts to a boolean as JavaScript does.
export const translateCondition = (node: ts.Expression, scope: Scope, context: Context) =>
  isBooleanLike(node, context)
    ? translateExpression(node, scope, context)
    : translateTruthy(node, translateExpression(node, scope, context), context);

// Negates a condition, cancelling ! and turning a negated || into a conjunction of guards, so that
// TLC sees the same formula as a hand-written spec and counts the same successors.
export const translateNegatedCondition = (
  node: ts.Expression,
  scope: Scope,
  context: Context,
): Expression => {
  if (ts.isParenthesizedExpression(node)) {
    return translateNegatedCondition(node.expression, scope, context);
  }
  // A condition that a statement evaluated first has its value.
  if (scope.results.has(node)) return not(translateCondition(node, scope, context));
  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.ExclamationToken) {
    return translateCondition(node.operand, scope, context);
  }
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.BarBarToken) {
    const left = translateNegatedCondition(node.left, scope, context);
    const right = translateNegatedCondition(node.right, scope, context);
    return junction("And", [left, right]);
  }
  return not(translateCondition(node, scope, context));
};

// An expression as a TLA+ expression. Under a non-null assertion, isDefined skips the check that a
// lookup such as map.get(key) found a value.
export const translateExpression = (
  node: ts.Expression,
  scope: Scope,
  context: Context,
  isDefined = false,
): Expression => {
  const call = node.parent;
  const parameter =
    (ts.isCallExpression(call) || ts.isNewExpression(call)) && call.arguments?.includes(node)
      ? getCallee(call.expression, context)?.parameters.at(call.arguments.indexOf(node))
      : undefined;
  if (parameter !== undefined && isSetSource(parameter, context)) {
    return translateSetArgument(
      node,
      () => translateNode(node, scope, context, isDefined),
      scope,
      context,
    );
  }
  const translated = translateNode(node, scope, context, isDefined);
  // The base of an optional chain that a check already read is the value that it read.
  return locate(
    isSetOrMapRead(node, context) &&
      !(ts.isOptionalChain(node.parent) && scope.checked?.has(node.parent) === true)
      ? useJavaScript("CollectionData", [getHeap(scope, node, context), translated], context)
      : translated,
    getLocation(node),
  );
};

// Whether an expression gives a set or a map that the heap holds where a script reads its value,
// rather than passes it on or changes it.
const isSetOrMapRead = (node: ts.Expression, context: Context) => {
  const parent = node.parent;
  const isRead =
    (ts.isPropertyAccessExpression(parent) &&
      parent.expression === node &&
      getHeapSetOrMapChange(parent.parent, context) === undefined) ||
    (ts.isForOfStatement(parent) && parent.expression === node) ||
    ts.isSpreadElement(parent) ||
    (ts.isNewExpression(parent) &&
      ["Set", "Map"].includes(getBuiltIn(parent.expression, context) ?? ""));
  return isRead && isHeapSetOrMap(node, context);
};

const readsArguments = (node: ts.Node): boolean =>
  (ts.isIdentifier(node) && node.text === "arguments") ||
  (ts.forEachChild(node, (child) => readsArguments(child) || undefined) ?? false);

// Whether a pattern takes the elements before a position without running code, as a default that
// calls a function, a nested pattern, or a setter would.
export const isInertBefore = (pattern: ts.Node | undefined, count: number) => {
  const elements =
    pattern !== undefined &&
    (ts.isArrayBindingPattern(pattern) || ts.isArrayLiteralExpression(pattern))
      ? pattern.elements
      : [];
  return elements
    .slice(0, count)
    .every(
      (element) =>
        ts.isOmittedExpression(element) ||
        ts.isIdentifier(element) ||
        (ts.isBindingElement(element) &&
          element.dotDotDotToken === undefined &&
          ts.isIdentifier(element.name) &&
          (element.initializer === undefined || isInertValue(element.initializer))) ||
        (ts.isBinaryExpression(element) &&
          element.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
          ts.isIdentifier(element.left) &&
          isInertValue(element.right)),
    );
};

// The array pattern that an array literal goes straight into, which takes its elements in order,
// so that nothing sees where it has holes, with whether nothing runs between the literal and the
// pattern: a call's later arguments, and the parameters before the pattern.
const getSourcePattern = (node: ts.Expression, context: Context) => {
  const parent = node.parent;
  if (ts.isVariableDeclaration(parent) || ts.isParameter(parent) || ts.isBindingElement(parent)) {
    return parent.initializer === node && ts.isArrayBindingPattern(parent.name)
      ? { pattern: parent.name, isDirect: true }
      : undefined;
  }
  if (ts.isBinaryExpression(parent)) {
    return parent.operatorToken.kind === ts.SyntaxKind.EqualsToken &&
      parent.right === node &&
      ts.isArrayLiteralExpression(parent.left)
      ? { pattern: parent.left, isDirect: true }
      : undefined;
  }
  if (!ts.isCallExpression(parent) && !ts.isNewExpression(parent)) return undefined;
  const position = parent.arguments?.indexOf(node) ?? -1;
  if (position === -1 || parent.arguments?.slice(0, position).some(ts.isSpreadElement)) {
    return undefined;
  }
  const declaration = context.checker.getResolvedSignature(parent)?.getDeclaration();
  const parameter = declaration?.parameters.at(position);
  return declaration !== undefined &&
    parameter !== undefined &&
    parameter.dotDotDotToken === undefined &&
    ts.isArrayBindingPattern(parameter.name) &&
    !readsArguments(declaration)
    ? {
        pattern: parameter.name,
        isDirect:
          (parent.arguments ?? []).slice(position + 1).every(isInertValue) &&
          declaration.parameters
            .slice(0, position)
            .every(
              (earlier) =>
                ts.isIdentifier(earlier.name) &&
                (earlier.initializer === undefined || isInertValue(earlier.initializer)),
            ),
      }
    : undefined;
};

// A hole of a literal that an array pattern takes, which reads what Array.prototype holds at its
// index, where nothing that runs before the pattern reads it may change Array.prototype.
const translatePatternHole = (
  node: ts.OmittedExpression,
  literal: ts.ArrayLiteralExpression,
  scope: Scope,
  context: Context,
) => {
  const source = getSourcePattern(literal, context);
  if (source === undefined) return undefined;
  if (context.heap === undefined) return getUndefined(context);
  const lastHole = literal.elements.reduce(
    (last, element, position) => (ts.isOmittedExpression(element) ? position : last),
    0,
  );
  if (!source.isDirect || !isInertBefore(source.pattern, lastHole)) {
    throw new TlaTypeScriptError(
      "tla-ts can't read the holes of an array that a pattern takes after code runs",
      node,
    );
  }
  return useJavaScript(
    "Get",
    [
      getHeap(scope, literal, context),
      translateBuiltInValue("Array.prototype", literal, context),
      string(String(literal.elements.indexOf(node))),
    ],
    context,
  );
};

// An optional chain is undefined where the base of its first ?. is undefined or null, and reads
// the rest of the chain from that base otherwise.
const translateOptionalChain = (node: ts.Expression, scope: Scope, context: Context) => {
  const getLinks = (link: ts.Expression): ts.Expression[] =>
    ts.isOptionalChain(link) ? [link, ...getLinks(link.expression)] : [];
  const optional = getLinks(node)
    .filter(
      (link) =>
        (ts.isPropertyAccessExpression(link) ||
          ts.isElementAccessExpression(link) ||
          ts.isCallExpression(link)) &&
        link.questionDotToken !== undefined &&
        scope.checked?.has(link) !== true,
    )
    .at(-1);
  if (optional === undefined || !ts.isOptionalChain(optional)) return undefined;
  if (ts.isCallExpression(optional)) {
    throw new TlaTypeScriptError("Optional calls aren't supported", optional);
  }
  const base = optional.expression;
  context.prelude.add("Null");
  context.prelude.add("Undefined");
  return share(translateExpression(base, scope, context), "base", context, (shared) =>
    ifExpression(
      apply("\\in", [shared, set([identifier("Null"), identifier("Undefined")])]),
      identifier("Undefined"),
      translateExpression(
        node,
        {
          ...scope,
          results: new Map([...scope.results, [base, shared]]),
          checked: new Set([...(scope.checked ?? []), optional]),
        },
        context,
      ),
    ),
  );
};

const translateNode = (
  node: ts.Expression,
  scope: Scope,
  context: Context,
  isDefined: boolean,
): Expression => {
  const isChainEnd =
    ts.isOptionalChain(node) &&
    !(ts.isOptionalChain(node.parent) && node.parent.expression === node);
  const chain = isChainEnd ? translateOptionalChain(node, scope, context) : undefined;
  if (chain !== undefined) return chain;
  const hole =
    ts.isOmittedExpression(node) && ts.isArrayLiteralExpression(node.parent)
      ? translatePatternHole(node, node.parent, scope, context)
      : undefined;
  if (hole !== undefined) return hole;
  // The wrapper that the statement made of the value that Array.prototype's method runs on.
  const wrapper = getWrappedThis(node, context) && scope.allocated.get(node);
  if (wrapper !== undefined) return wrapper;
  if (
    ts.isParenthesizedExpression(node) ||
    ts.isAsExpression(node) ||
    ts.isSatisfiesExpression(node) ||
    ts.isTypeAssertionExpression(node)
  ) {
    return translateExpression(node.expression, scope, context, isDefined);
  }
  if (ts.isNonNullExpression(node)) {
    return translateExpression(node.expression, scope, context, true);
  }
  const result = scope.results.get(node);
  if (result !== undefined) return result;
  const thisOwner = node.kind === ts.SyntaxKind.ThisKeyword ? getThisOwner(node) : undefined;
  if (thisOwner !== undefined && thisOwner === scope.receiver?.method) return scope.receiver.value;
  // An arrow function that a call took names the this of where it was written.
  const arrow = ts.findAncestor(
    node,
    (ancestor) =>
      ancestor === thisOwner ||
      (ts.isArrowFunction(ancestor) && scope.arrowReceivers?.get(ancestor)?.method === thisOwner),
  );
  const arrowReceiver = arrow === undefined ? undefined : scope.arrowReceivers?.get(arrow);
  if (thisOwner !== undefined && arrowReceiver !== undefined) return arrowReceiver.value;
  // new.target, which a construction gives its constructor and a call gives as undefined. An arrow
  // function reads its owner's, so only one that runs where it's made can read it.
  if (ts.isMetaProperty(node) && node.keywordToken === ts.SyntaxKind.NewKeyword) {
    const owner = ts.findAncestor(
      node.parent,
      (ancestor) =>
        (ts.isFunctionLike(ancestor) && !ts.isArrowFunction(ancestor)) ||
        ts.isClassStaticBlockDeclaration(ancestor) ||
        ts.isPropertyDeclaration(ancestor) ||
        (ts.isArrowFunction(ancestor) &&
          !(
            ts.isParenthesizedExpression(ancestor.parent) &&
            ts.isCallExpression(ancestor.parent.parent) &&
            ancestor.parent.parent.expression === ancestor.parent
          )),
    );
    if (owner === undefined || ts.isArrowFunction(owner)) {
      throw new TlaTypeScriptError(`Unsupported expression: ${node.getText()}`, node);
    }
    if (scope.receiver?.method === owner) {
      return scope.receiver.newTarget ?? getUndefined(context);
    }
    if (ts.isConstructorDeclaration(owner)) {
      throw new TlaTypeScriptError(`Unsupported expression: ${node.getText()}`, node);
    }
    return getUndefined(context);
  }
  // A module's this is undefined, which an arrow function outside any other function reads too.
  if (
    node.kind === ts.SyntaxKind.ThisKeyword &&
    ts.isSourceFile(
      ts.findAncestor(
        node.parent,
        (ancestor) =>
          ts.isSourceFile(ancestor) ||
          (ts.isFunctionLike(ancestor) && !ts.isArrowFunction(ancestor)) ||
          ts.isClassLike(ancestor),
      ) ?? node,
    ) &&
    isModuleFile(node.getSourceFile())
  ) {
    return getUndefined(context);
  }
  // A static field's or static block's this is its class, which an arrow function there reads
  // wherever it runs, where nothing assigns the class's name. A class expression has the name of
  // the variable that it initializes only once the class is made, so only an arrow function that
  // is a static field's value reads it, where making the class runs no code that could call it.
  const isStatic =
    thisOwner !== undefined &&
    (ts.isClassStaticBlockDeclaration(thisOwner) ||
      (ts.isPropertyDeclaration(thisOwner) &&
        (ts.getCombinedModifierFlags(thisOwner) & ts.ModifierFlags.Static) !== 0));
  const heldClass =
    isStatic &&
    ts.isPropertyDeclaration(thisOwner) &&
    thisOwner.initializer !== undefined &&
    ts.isArrowFunction(thisOwner.initializer) &&
    ts.findAncestor(node.parent, ts.isArrowFunction) === thisOwner.initializer &&
    ts.isClassExpression(thisOwner.parent) &&
    thisOwner.parent.members.every(
      (member) =>
        !ts.isClassStaticBlockDeclaration(member) &&
        (member.name === undefined || !ts.isComputedPropertyName(member.name)) &&
        !(
          ts.isPropertyDeclaration(member) &&
          (ts.getCombinedModifierFlags(member) & ts.ModifierFlags.Static) !== 0 &&
          member.initializer !== undefined &&
          !ts.isArrowFunction(member.initializer) &&
          !ts.isFunctionExpression(member.initializer) &&
          !ts.isLiteralExpression(member.initializer)
        ),
    ) &&
    ts.isVariableDeclaration(thisOwner.parent.parent) &&
    thisOwner.parent.parent.initializer === thisOwner.parent &&
    ts.isIdentifier(thisOwner.parent.parent.name)
      ? thisOwner.parent.parent.name
      : undefined;
  const staticClass =
    isStatic && ts.isClassDeclaration(thisOwner.parent) ? thisOwner.parent.name : heldClass;
  const staticSymbol = staticClass && getSymbol(staticClass, context.checker);
  if (
    staticClass !== undefined &&
    staticSymbol !== undefined &&
    !isAssigned(staticSymbol, node.getSourceFile(), context)
  ) {
    return translateExpression(staticClass, scope, context);
  }
  if (ts.isBigIntLiteral(node)) {
    const value = BigInt(node.text.slice(0, -1).replaceAll("_", ""));
    if (value > 2n ** 31n - 1n) {
      throw new TlaTypeScriptError(`TLC's integers have 32 bits, so ${node.text} is too big`, node);
    }
    return translateBigInt(Number(value), context);
  }
  if (ts.isNumericLiteral(node)) {
    const value = Number(node.text);
    if (!Number.isInteger(value)) return translateFraction(value, node, context);
    if (value > 2 ** 31 - 1) {
      throw new TlaTypeScriptError(`TLC's integers have 32 bits, so ${node.text} is too big`, node);
    }
    return number(value);
  }
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return translateString(node.text, context);
  }
  if (ts.isTemplateExpression(node)) return translateTemplate(node, scope, context);
  if (
    ts.isTaggedTemplateExpression(node) &&
    ts.isPropertyAccessExpression(node.tag) &&
    node.tag.name.text === "raw" &&
    getBuiltIn(node.tag.expression, context) === "String"
  ) {
    return translateRawTemplate(node, scope, context);
  }
  if (node.kind === ts.SyntaxKind.TrueKeyword) return boolean(true);
  if (node.kind === ts.SyntaxKind.FalseKeyword) return boolean(false);
  if (node.kind === ts.SyntaxKind.NullKeyword) {
    context.prelude.add("Null");
    return identifier("Null");
  }
  if (ts.isIdentifier(node)) {
    const value = translateIdentifier(node, scope, context);
    // A name may hold what a read past an array's end gave, unless the script computes it.
    return isNumberLike(node, context) &&
      isNumericOperand(node, context) &&
      !holdsComputedNumber(node, context)
      ? guardNumber(value, context)
      : value;
  }
  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.ExclamationToken) {
    return not(translateCondition(node.operand, scope, context));
  }
  if (
    ts.isPrefixUnaryExpression(node) &&
    (node.operator === ts.SyntaxKind.MinusToken || node.operator === ts.SyntaxKind.TildeToken) &&
    isBigIntLike(node.operand, context)
  ) {
    const negated = useJavaScript(
      "BigIntNegate",
      [translateExpression(node.operand, scope, context)],
      context,
    );
    // ~x is -x - 1.
    return node.operator === ts.SyntaxKind.MinusToken
      ? negated
      : useJavaScript("BigIntSubtract", [negated, translateBigInt(1, context)], context);
  }
  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken) {
    const isLiteral = ts.isNumericLiteral(node.operand);
    if (isLiteral && !Number.isInteger(Number(node.operand.text))) {
      return translateFraction(-Number(node.operand.text), node, context);
    }
    if (isLiteral && Number(node.operand.text) === 0 && !context.hasSpecialNumbers) {
      throw new TlaTypeScriptError("TLA+ integers have no negative zero", node);
    }
    // TLC's least integer, whose negation would overflow, as TLC computes it without overflow.
    if (isLiteral && Number(node.operand.text) === 2 ** 31) {
      return apply("-", [apply("-.", [number(2 ** 31 - 1)]), number(1)]);
    }
    const operand = isNumberLike(node.operand, context)
      ? translateExpression(node.operand, scope, context)
      : translateToNumber(node.operand, node, scope, context);
    return context.hasSpecialNumbers && !(isLiteral && Number(node.operand.text) !== 0)
      ? useJavaScript("Negate", [operand], context)
      : apply("-.", [operand]);
  }
  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.PlusToken) {
    return translateToNumber(node.operand, node, scope, context);
  }
  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.TildeToken) {
    return useJavaScript(
      "BitwiseNot",
      [translateToNumber(node.operand, node, scope, context)],
      context,
    );
  }
  if (ts.isBinaryExpression(node)) return translateBinary(node, scope, context);
  if (ts.isConditionalExpression(node)) {
    return ifExpression(
      translateCondition(node.condition, scope, context),
      translateExpression(node.whenTrue, scope, context),
      translateExpression(node.whenFalse, scope, context),
    );
  }
  if (ts.isArrayLiteralExpression(node) && !context.heapCollections.has(node)) {
    // A sequence has no properties but an array's, so a type that gives it others, as a script
    // writes them, needs an array that the heap holds.
    const checker = context.checker;
    const contextual = checker.getContextualType(node);
    const arrayKeys = new Set(
      checker
        .getTypeAtLocation(node)
        .getProperties()
        .map((property) => property.name),
    );
    const members = contextual?.isUnion() ? contextual.types : [contextual];
    // An iterable, such as a generator that a pattern takes, an async iterable, or what flatMap's
    // mapper may return, reads an array only as one.
    const isIterable = (member: ts.Type) =>
      member
        .getProperties()
        .some(
          (property) =>
            property.name.startsWith("__@iterator") || property.name.startsWith("__@asyncIterator"),
        );
    const contextualKeys = members.some((member) => member !== undefined && isIterable(member))
      ? []
      : members.flatMap((member) =>
          member === undefined ||
          (member.flags & (ts.TypeFlags.Object | ts.TypeFlags.Intersection)) === 0 ||
          isSequenceType(member, checker)
            ? []
            : member.getProperties().map((property) => property.name),
        );
    if (contextualKeys.some((key) => !arrayKeys.has(key))) {
      throw new TlaTypeScriptError("Use an array only as an array, not as an object", node);
    }
    return translateElements(node.elements, scope, context, node);
  }
  if (ts.isObjectLiteralExpression(node)) return translateObjectLiteral(node, scope, context);
  if (ts.isPropertyAccessExpression(node)) {
    const read = translatePropertyAccess(node, scope, context);
    // A property that the type doesn't declare comes from an index signature, which may lack it.
    const checker = context.checker;
    return checker
      .getNonNullableType(checker.getTypeAtLocation(node.expression))
      .getProperty(node.name.text) === undefined
      ? toNumericRead(node, read, context)
      : read;
  }
  if (ts.isElementAccessExpression(node)) {
    return translateElementAccess(node, scope, context, isDefined);
  }
  // A regexp is the record of its pattern without objects, and else the object that a statement
  // makes.
  if (ts.isRegularExpressionLiteral(node) || getMadeRegExp(node, context) !== undefined) {
    const allocated = scope.allocated.get(node);
    if (context.heap === undefined) return translateRegExpValue(node, scope, context);
    if (allocated === undefined) {
      throw new TlaTypeScriptError("Make objects only where a statement always runs", node);
    }
    return allocated;
  }
  if (ts.isCallExpression(node) && context.heapCollections.has(node)) {
    const made = scope.allocated.get(node);
    if (made === undefined) {
      throw new TlaTypeScriptError("Make objects only where a statement always runs", node);
    }
    return made;
  }
  const calledErrors = getCalledError(node, context);
  if (ts.isCallExpression(node) && calledErrors !== undefined) {
    return translateNewError(node, calledErrors, scope, context);
  }
  if (
    ts.isCallExpression(node) &&
    !isObjectConversion(node, context) &&
    !(isValueOfCall(node, context) && getNewWrapper(node, context) !== undefined) &&
    getNewClass(node, context) === undefined
  ) {
    return translateCall(node, scope, context, isDefined);
  }
  if (ts.isTypeOfExpression(node)) return translateTypeOf(node, scope, context);
  // The operand runs though nothing reads it, as a comma's left operand does.
  if (ts.isVoidExpression(node)) {
    if (ts.isLiteralExpression(node.expression)) return getUndefined(context);
    const operand = translateExpression(node.expression, scope, context);
    return ifExpression(
      apply("=", [operand, operand]),
      getUndefined(context),
      getUndefined(context),
    );
  }
  const functionValue = getFunctionValue(node, context);
  if (functionValue !== undefined) return translateFunctionValue(functionValue, context);
  const errorClass =
    ts.isClassExpression(node) && ts.isVariableDeclaration(node.parent)
      ? getErrorClass(getSymbol(node.parent.name, context.checker), context.checker)?.[0]
      : undefined;
  if (errorClass !== undefined) return getConstructor(errorClass, context);
  const isHeapObject =
    ((ts.isArrayLiteralExpression(node) || isHoleyNewArray(node) || isNewArrayOfElements(node)) &&
      context.heapCollections.has(node)) ||
    (ts.isClassExpression(node) && isHeapClass(node, context)) ||
    isHeapFunction(node, context) ||
    isFunctionObject(node, context) ||
    isNestedFunction(node, context) ||
    isClosure(node, context) ||
    getNewClass(node, context) !== undefined ||
    isHeldError(node, context) ||
    isNewObject(node, context) ||
    isNewDate(node, context) ||
    isNewProxy(node, context) ||
    getNewBuffer(node, context) !== undefined ||
    getNewWrapper(node, context) !== undefined;
  if (isHeapObject) {
    const allocated = scope.allocated.get(node);
    if (allocated === undefined) {
      throw new TlaTypeScriptError("Make objects only where a statement always runs", node);
    }
    return isValueOfCall(node, context)
      ? ifExpression(
          useJavaScript(
            "HoldsBuiltIn",
            [
              getHeap(scope, node, context),
              translateBuiltInValue("Object.prototype", node, context),
              string("valueOf"),
              string("Object.prototype.valueOf"),
            ],
            context,
          ),
          allocated,
          apply("Assert", [
            boolean(false),
            string("tla-ts can't call an Object.prototype.valueOf that a script replaced"),
          ]),
        )
      : allocated;
  }
  // new Object, or Object, of an object gives the object.
  const passed = isObjectConversion(node, context) ? node.arguments?.at(0) : undefined;
  if (
    isObjectConversion(node, context) &&
    passed !== undefined &&
    node.arguments?.length === 1 &&
    isHeapType(context.checker.getTypeAtLocation(node), context) &&
    (getKind(passed, context) === "object" || isBuiltInObject(passed, context))
  ) {
    return translateObjectValue(passed, scope, context);
  }
  // Any other object, such as an array that a sequence holds or an error, is given back too, where
  // the call's type keeps its kind. A property's value may not have its type, as
  // Object.defineProperty can give it any.
  const passedTypes =
    passed === undefined
      ? undefined
      : getTypeNames(context.checker.getTypeAtLocation(passed), context.checker);
  if (
    isObjectConversion(node, context) &&
    passed !== undefined &&
    node.arguments?.length === 1 &&
    !ts.isPropertyAccessExpression(skipCasts(passed)) &&
    !ts.isElementAccessExpression(skipCasts(passed)) &&
    passedTypes !== undefined &&
    passedTypes.length > 0 &&
    passedTypes.every((name) => name === "object" || name === "function") &&
    getKind(node, context) === getKind(passed, context)
  ) {
    return translateExpression(passed, scope, context);
  }
  // A set or a map that the heap holds, which a statement makes.
  if (
    ts.isNewExpression(node) &&
    context.heapCollections.has(node) &&
    ["Set", "Map"].includes(getBuiltIn(node.expression, context) ?? "")
  ) {
    const made = scope.allocated.get(node);
    if (made === undefined) {
      throw new TlaTypeScriptError("Make objects only where a statement always runs", node);
    }
    return made;
  }
  if (ts.isNewExpression(node)) {
    const classes = getErrorClass(getSymbol(node.expression, context.checker), context.checker);
    return classes === undefined
      ? translateNew(node, scope, context)
      : translateNewError(node, classes, scope, context);
  }
  throw new TlaTypeScriptError(`Unsupported expression: ${node.getText()}`, node);
};
