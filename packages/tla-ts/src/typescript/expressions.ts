import ts from "@typescript/typescript6";
import {
  translateArrayConstructor,
  translateFunctionConstructor,
  translateMethod,
  translateNew,
  translateSet,
  translateSize,
} from "./collections";
import type { Expression } from "../ast";
import {
  type Context,
  getElement,
  getFunction,
  getSymbol,
  getTopLevelDeclaration,
  getUndefined,
  isMethodCall,
  share,
  translateString,
} from "./context";
import { TlaTypeScriptError } from "../errors";
import { getDefinition, translateHelperCall, translateLocalCall } from "./functions";
import type { Scope } from "./scope";
import {
  apply,
  boolean,
  bound,
  choose,
  except,
  getLocation,
  identifier,
  ifExpression,
  index,
  junction,
  locate,
  not,
  number,
  quantify,
  record,
  set,
  string,
  tuple,
} from "./tla";
import {
  getField,
  getKind,
  getPathStep,
  getPropertyKey,
  isBooleanLike,
  isFieldName,
  isNumberLike,
  isNumericKey,
  isObject,
  translateUnknown,
} from "./types";

interface Field {
  key: string;
  value: Expression;
}

const BINARY_OPERATORS = new Map([
  [ts.SyntaxKind.MinusToken, "-"],
  [ts.SyntaxKind.AsteriskToken, "*"],
  [ts.SyntaxKind.AsteriskAsteriskToken, "^"],
  [ts.SyntaxKind.EqualsEqualsEqualsToken, "="],
  [ts.SyntaxKind.ExclamationEqualsEqualsToken, "#"],
  [ts.SyntaxKind.LessThanToken, "<"],
  [ts.SyntaxKind.LessThanEqualsToken, "<="],
  [ts.SyntaxKind.GreaterThanToken, ">"],
  [ts.SyntaxKind.GreaterThanEqualsToken, ">="],
]);

const ORDERING_OPERATORS = new Set([
  ts.SyntaxKind.LessThanToken,
  ts.SyntaxKind.LessThanEqualsToken,
  ts.SyntaxKind.GreaterThanToken,
  ts.SyntaxKind.GreaterThanEqualsToken,
]);

const LOGICAL_OPERATORS = new Map([
  [ts.SyntaxKind.AmpersandAmpersandToken, "And" as const],
  [ts.SyntaxKind.BarBarToken, "Or" as const],
]);

const concatenate = (parts: Expression[]) =>
  parts.reduce((left, right) => apply("\\o", [left, right]));

// The key of an element access, which counts from 1 in a sequence where JavaScript counts from 0.
export const translateKey = (node: ts.ElementAccessExpression, scope: Scope, context: Context) => {
  const key = node.argumentExpression;
  const kind = getKind(node.expression, context);
  if (kind !== "sequence" && kind !== "string") return translateExpression(key, scope, context);
  const position = translateExpression(key, scope, context);
  return position.kind === "Number"
    ? number(position.value + 1)
    : apply("+", [position, number(1)]);
};

const translateArrayLiteral = (node: ts.ArrayLiteralExpression, scope: Scope, context: Context) => {
  // Runs of plain elements become tuples, and each spread array stays a sequence of its own.
  const parts = node.elements.reduce<(Expression | Expression[])[]>((result, element) => {
    if (!ts.isSpreadElement(element)) {
      const value = translateExpression(element, scope, context);
      const last = result.at(-1);
      return Array.isArray(last)
        ? [...result.slice(0, -1), [...last, value]]
        : [...result, [value]];
    }
    if (getKind(element.expression, context) !== "sequence") {
      throw new TlaTypeScriptError(
        "Sets have no order, so spread one only into every(), some(), filter(), map(), or find()",
        element,
      );
    }
    return [...result, translateExpression(element.expression, scope, context)];
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

const translateMath = (node: ts.CallExpression, method: string, scope: Scope, context: Context) => {
  const translate = (inner: ts.Expression) => translateExpression(inner, scope, context);
  const argument = node.arguments[0];
  if ((method === "floor" || method === "trunc") && node.arguments.length === 1) {
    const division = ts.isParenthesizedExpression(argument) ? argument.expression : argument;
    if (
      !ts.isBinaryExpression(division) ||
      division.operatorToken.kind !== ts.SyntaxKind.SlashToken
    ) {
      throw new TlaTypeScriptError(
        `Math.${method} only takes a division, as in Math.${method}(a / b)`,
        node,
      );
    }
    const left = translate(division.left);
    const right = translate(division.right);
    if (method === "floor") return apply("\\div", [left, right]);
    context.prelude.add("Quot");
    return apply("Quot", [left, right]);
  }
  if (method === "abs" && node.arguments.length === 1) {
    return share(translate(argument), "value", context, (value) =>
      ifExpression(apply("<", [value, number(0)]), apply("-.", [value]), value),
    );
  }
  if ((method === "min" || method === "max") && node.arguments.length > 0) {
    const comparison = method === "min" ? "<=" : ">=";
    if (node.arguments.length === 1 && ts.isSpreadElement(argument)) {
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

const translateCall = (
  node: ts.CallExpression,
  scope: Scope,
  context: Context,
  isDefined: boolean,
) => {
  const symbol = getSymbol(node.expression, context.checker);
  const helper = getTopLevelDeclaration(symbol);
  if (helper?.getSourceFile().isDeclarationFile) {
    return translateUnknown(node, `Unsupported call: ${node.expression.getText()}`, context);
  }
  if (helper !== undefined) return translateHelperCall(helper, node, scope, context);
  if (!isMethodCall(node)) {
    const operator = symbol === undefined ? undefined : scope.bindings.get(symbol);
    if (operator === undefined) return translateLocalCall(node, scope, context);
    if (operator.kind !== "Identifier") {
      throw new TlaTypeScriptError(`Unsupported call: ${node.expression.getText()}`, node);
    }
    const values = node.arguments.map((argument) => translateExpression(argument, scope, context));
    return apply(operator.name, values);
  }
  const receiver = node.expression.expression;
  const method = node.expression.name.text;
  const global = ts.isIdentifier(receiver) ? receiver.text : undefined;
  if (global === "Math") return translateMath(node, method, scope, context);
  if (global === "Object" && method === "is" && node.arguments.length === 2) {
    if (node.arguments.some((argument) => isObject(context.checker.getTypeAtLocation(argument)))) {
      throw new TlaTypeScriptError("TLA+ compares objects by value, not by identity", node);
    }
    return apply(
      "=",
      node.arguments.map((argument) => translateExpression(argument, scope, context)),
    );
  }
  const constructed =
    global === "Object" && method === "fromEntries"
      ? translateFunctionConstructor(node.arguments[0], scope, context)
      : translateArrayConstructor(node, scope, context);
  return constructed ?? translateMethod(node, scope, context, isDefined);
};

// A value as a string, as JavaScript converts it in a template or beside a string in +.
const translateToString = (node: ts.Expression, scope: Scope, context: Context) => {
  const value = translateExpression(node, scope, context);
  const flags = context.checker.getTypeAtLocation(node).flags;
  if (getKind(node, context) === "string") return value;
  if (isNumberLike(node, context)) return apply("ToString", [value]);
  if (isBooleanLike(node, context)) return ifExpression(value, string("true"), string("false"));
  if (flags & ts.TypeFlags.Null) return string("null");
  if (flags & (ts.TypeFlags.Undefined | ts.TypeFlags.Void)) return string("undefined");
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

const translateBinary = (node: ts.BinaryExpression, scope: Scope, context: Context) => {
  const kind = node.operatorToken.kind;
  const translate = (inner: ts.Expression) => translateExpression(inner, scope, context);
  const isString =
    getKind(node.left, context) === "string" || getKind(node.right, context) === "string";
  const logical = LOGICAL_OPERATORS.get(kind);
  if (logical !== undefined) {
    if (!isBooleanLike(node.left, context) || !isBooleanLike(node.right, context)) {
      throw new TlaTypeScriptError(
        `${node.operatorToken.getText()} needs booleans, so compare explicitly`,
        node,
      );
    }
    return junction(logical, [translate(node.left), translate(node.right)]);
  }
  if (kind === ts.SyntaxKind.PlusToken && isString) {
    return apply("\\o", [
      translateToString(node.left, scope, context),
      translateToString(node.right, scope, context),
    ]);
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
  if (kind === ts.SyntaxKind.InKeyword) {
    return apply("\\in", [translate(node.left), apply("DOMAIN", [translate(node.right)])]);
  }
  if (kind === ts.SyntaxKind.SlashToken) {
    throw new TlaTypeScriptError("Write division as Math.floor(a / b) or Math.trunc(a / b)", node);
  }
  if (ORDERING_OPERATORS.has(kind) && isString) {
    throw new TlaTypeScriptError("TLA+ strings have no order, so compare them with === only", node);
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
  // A function passes as its operator's name, and a constant as its value.
  return getFunction(declaration) === undefined
    ? translateHelperCall(declaration, undefined, scope, context)
    : identifier(getDefinition(declaration, context).name);
};

const translateIdentifier = (node: ts.Identifier, scope: Scope, context: Context) => {
  if (node.text === "undefined") return getUndefined(context);
  const symbol = getSymbol(node, context.checker);
  const binding = symbol === undefined ? undefined : scope.bindings.get(symbol);
  if (binding !== undefined) return binding;
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
  const declared = translateDeclared(node, symbol, scope, context);
  if (declared !== undefined) return declared;
  if (symbol !== undefined && context.variables.has(symbol)) {
    throw new TlaTypeScriptError(`${node.text} can't be read here`, node);
  }
  throw new TlaTypeScriptError(`Unknown name: ${node.text}`, node);
};

const translatePropertyAccess = (
  node: ts.PropertyAccessExpression,
  scope: Scope,
  context: Context,
) => {
  if (node.questionDotToken !== undefined) {
    throw new TlaTypeScriptError("Optional chaining isn't supported", node);
  }
  const declared = translateDeclared(node, getSymbol(node, context.checker), scope, context);
  if (declared !== undefined) return declared;
  const receiver = node.expression;
  const name = node.name.text;
  if (
    scope.previous !== undefined &&
    ts.isIdentifier(receiver) &&
    getSymbol(receiver, context.checker) === scope.previous
  ) {
    return getPreviousVariable(name, node, context);
  }
  const size =
    name === "length" || name === "size" ? translateSize(receiver, scope, context) : undefined;
  if (size !== undefined) return size;
  if (
    getKind(receiver, context) !== "other" ||
    context.checker.getTypeAtLocation(receiver).getCallSignatures().length > 0
  ) {
    throw new TlaTypeScriptError(`Unsupported property: ${node.getText()}`, node);
  }
  return getField(translateExpression(receiver, scope, context), name);
};

const translateElementAccess = (
  node: ts.ElementAccessExpression,
  scope: Scope,
  context: Context,
  isDefined: boolean,
) => {
  const value = translateExpression(node.expression, scope, context);
  const key = translateKey(node, scope, context);
  const kind = getKind(node.expression, context);
  if (kind === "sequence" && !isDefined) return getElement(value, key, context);
  if (kind !== "string") return index(value, [key]);
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

export const translateCondition = (node: ts.Expression, scope: Scope, context: Context) => {
  if (!isBooleanLike(node, context)) {
    throw new TlaTypeScriptError("Conditions must be booleans, so compare explicitly", node);
  }
  return translateExpression(node, scope, context);
};

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
): Expression => locate(translateNode(node, scope, context, isDefined), getLocation(node));

const translateNode = (
  node: ts.Expression,
  scope: Scope,
  context: Context,
  isDefined: boolean,
): Expression => {
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
  if (ts.isNumericLiteral(node)) {
    const value = Number(node.text);
    if (!Number.isInteger(value)) {
      throw new TlaTypeScriptError(`Only integers are supported: ${node.text}`, node);
    }
    if (value > 2 ** 31 - 1) {
      throw new TlaTypeScriptError(`TLC's integers have 32 bits, so ${node.text} is too big`, node);
    }
    return number(value);
  }
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return translateString(node.text, context);
  }
  if (ts.isTemplateExpression(node)) return translateTemplate(node, scope, context);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return boolean(true);
  if (node.kind === ts.SyntaxKind.FalseKeyword) return boolean(false);
  if (node.kind === ts.SyntaxKind.NullKeyword) {
    context.prelude.add("Null");
    return identifier("Null");
  }
  if (ts.isIdentifier(node)) return translateIdentifier(node, scope, context);
  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.ExclamationToken) {
    if (!isBooleanLike(node.operand, context)) {
      throw new TlaTypeScriptError("! needs a boolean, so compare explicitly", node);
    }
    return not(translateExpression(node.operand, scope, context));
  }
  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken) {
    if (ts.isNumericLiteral(node.operand) && Number(node.operand.text) === 0) {
      throw new TlaTypeScriptError("TLA+ integers have no negative zero", node);
    }
    return apply("-.", [translateExpression(node.operand, scope, context)]);
  }
  if (ts.isBinaryExpression(node)) return translateBinary(node, scope, context);
  if (ts.isConditionalExpression(node)) {
    return ifExpression(
      translateCondition(node.condition, scope, context),
      translateExpression(node.whenTrue, scope, context),
      translateExpression(node.whenFalse, scope, context),
    );
  }
  if (ts.isArrayLiteralExpression(node)) return translateArrayLiteral(node, scope, context);
  if (ts.isObjectLiteralExpression(node)) return translateObjectLiteral(node, scope, context);
  if (ts.isPropertyAccessExpression(node)) return translatePropertyAccess(node, scope, context);
  if (ts.isElementAccessExpression(node)) {
    return translateElementAccess(node, scope, context, isDefined);
  }
  if (ts.isCallExpression(node)) return translateCall(node, scope, context, isDefined);
  if (ts.isNewExpression(node)) return translateNew(node, scope, context);
  throw new TlaTypeScriptError(`Unsupported expression: ${node.getText()}`, node);
};
