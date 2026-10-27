import ts from "typescript";
import {
  translateArrayConstructor,
  translateFunctionConstructor,
  translateMethod,
  translateNew,
  translateSet,
  translateSize,
} from "./collections";
import {
  type Context,
  getFunction,
  getSymbol,
  getTopLevelDeclaration,
  type HelperDeclaration,
  isMethodCall,
  share,
  translateString,
} from "./context";
import { TsproverError } from "./errors";
import { wrap, wrapEquated } from "./formula";
import { getDefinition, translateHelperCall, translateLocalCall } from "./functions";
import type { Scope } from "./scope";
import { getKind, isBooleanLike, isNumericKey } from "./types";

interface Field {
  key: string;
  value: string;
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
  [ts.SyntaxKind.AmpersandAmpersandToken, "/\\"],
  [ts.SyntaxKind.BarBarToken, "\\/"],
]);

// The TLA+ index of a JavaScript index into a sequence, since sequences count from 1.
export const translateIndex = (node: ts.Expression, scope: Scope, context: Context) =>
  ts.isNumericLiteral(node)
    ? String(Number(node.text) + 1)
    : `${wrap(translateExpression(node, scope, context))} + 1`;

// An array literal as a sequence, joining spread arrays with \o.
const translateArrayLiteral = (node: ts.ArrayLiteralExpression, scope: Scope, context: Context) => {
  // Runs of plain elements become tuples, and each spread array stays a sequence of its own.
  const parts = node.elements.reduce<(string | string[])[]>((result, element) => {
    if (!ts.isSpreadElement(element)) {
      const value = translateExpression(element, scope, context);
      const last = result.at(-1);
      return Array.isArray(last)
        ? [...result.slice(0, -1), [...last, value]]
        : [...result, [value]];
    }
    if (getKind(element.expression, context) !== "sequence") {
      throw new TsproverError(
        "Sets have no order, so spread one only into every(), some(), filter(), map(), or find()",
        element,
      );
    }
    return [...result, translateExpression(element.expression, scope, context)];
  }, []);
  const sequences = parts.map((part) => (Array.isArray(part) ? `<<${part.join(", ")}>>` : part));
  if (sequences.length === 0) return "<<>>";
  return sequences.length === 1 ? sequences[0] : sequences.map(wrap).join(" \\o ");
};

export const getField = (key: string) => (isNumericKey(key) ? `[${key}]` : `.${key}`);

const formatRecord = (fields: Field[]) =>
  fields.every((field) => isNumericKey(field.key))
    ? fields.map((field) => `(${field.key} :> ${field.value})`).join(" @@ ")
    : `[${fields.map((field) => `${field.key} |-> ${field.value}`).join(", ")}]`;

const translateObjectLiteral = (
  node: ts.ObjectLiteralExpression,
  scope: Scope,
  context: Context,
) => {
  const checker = context.checker;
  const getKey = (property: ts.ObjectLiteralElementLike) =>
    property.name === undefined || ts.isComputedPropertyName(property.name)
      ? undefined
      : property.name.getText().replace(/^["']|["']$/g, "");
  const getValue = (property: ts.ObjectLiteralElementLike) => {
    if (ts.isPropertyAssignment(property)) {
      return translateExpression(property.initializer, scope, context);
    }
    if (ts.isShorthandPropertyAssignment(property)) {
      return translateExpression(property.name, scope, context);
    }
    throw new TsproverError("Unsupported object member", property);
  };
  const spreads = node.properties.filter(ts.isSpreadAssignment);
  if (spreads.length === 0) {
    if (node.properties.length === 0) {
      throw new TsproverError("TLA+ has no empty record, so use a Map", node);
    }
    return formatRecord(
      node.properties.map((property) => {
        const key = getKey(property);
        if (key === undefined) {
          throw new TsproverError("Computed keys need a spread base", property);
        }
        return { key, value: getValue(property) };
      }),
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
        if (key !== undefined) return `!${getField(key)} = ${wrapEquated(getValue(property))}`;
        if (property.name === undefined || !ts.isComputedPropertyName(property.name)) {
          throw new TsproverError("Unsupported object member", property);
        }
        return `![${translateExpression(property.name.expression, scope, context)}] = ${wrapEquated(getValue(property))}`;
      });
      return `[${wrap(value)} EXCEPT ${changes.join(", ")}]`;
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
          throw new TsproverError(`Can't tell which value ${key} takes`, node);
        }
        return {
          key,
          value: ts.isSpreadAssignment(member)
            ? `${wrap(translateExpression(member.expression, scope, context))}${getField(key)}`
            : getValue(member),
        };
      }),
  );
};

const translateMath = (node: ts.CallExpression, method: string, scope: Scope, context: Context) => {
  const translate = (inner: ts.Expression) => wrap(translateExpression(inner, scope, context));
  const argument = node.arguments[0];
  if ((method === "floor" || method === "trunc") && node.arguments.length === 1) {
    const division = ts.isParenthesizedExpression(argument) ? argument.expression : argument;
    if (
      !ts.isBinaryExpression(division) ||
      division.operatorToken.kind !== ts.SyntaxKind.SlashToken
    ) {
      throw new TsproverError(
        `Math.${method} only takes a division, as in Math.${method}(a / b)`,
        node,
      );
    }
    const left = translate(division.left);
    const right = translate(division.right);
    if (method === "floor") return `${left} \\div ${right}`;
    context.prelude.add("Quot");
    return `Quot(${left}, ${right})`;
  }
  if (method === "abs" && node.arguments.length === 1) {
    return share(
      translate(argument),
      "value",
      context,
      (value) => `IF ${value} < 0 THEN -${value} ELSE ${value}`,
    );
  }
  if ((method === "min" || method === "max") && node.arguments.length > 0) {
    const comparison = method === "min" ? "<=" : ">=";
    if (node.arguments.length === 1 && ts.isSpreadElement(argument)) {
      const set = wrap(translateSet(argument.expression, scope, context));
      const candidate = context.names.getFresh("candidate");
      const other = context.names.getFresh("other");
      return `CHOOSE ${candidate} \\in ${set} : \\A ${other} \\in ${set} : ${candidate} ${comparison} ${other}`;
    }
    return node.arguments
      .map(translate)
      .reduce((result, inner) =>
        share(result, "best", context, (best) =>
          share(
            inner,
            "value",
            context,
            (value) => `IF ${best} ${comparison} ${value} THEN ${best} ELSE ${value}`,
          ),
        ),
      );
  }
  throw new TsproverError(`Unsupported call: Math.${method}`, node);
};

const translateCall = (
  node: ts.CallExpression,
  scope: Scope,
  context: Context,
  isDefined: boolean,
) => {
  const symbol = getSymbol(node.expression, context.checker);
  const helper = getTopLevelDeclaration(symbol);
  if (helper !== undefined) return translateHelperCall(helper, node, scope, context);
  if (!isMethodCall(node)) {
    const operator = symbol === undefined ? undefined : scope.bindings.get(symbol);
    if (operator === undefined) return translateLocalCall(node, scope, context);
    const values = node.arguments.map((argument) => translateExpression(argument, scope, context));
    return `${operator}(${values.join(", ")})`;
  }
  const receiver = node.expression.expression;
  const method = node.expression.name.text;
  const global = ts.isIdentifier(receiver) ? receiver.text : undefined;
  if (global === "Math") return translateMath(node, method, scope, context);
  const constructed =
    global === "Object" && method === "fromEntries"
      ? translateFunctionConstructor(node.arguments[0], scope, context)
      : translateArrayConstructor(node, scope, context);
  return constructed ?? translateMethod(node, scope, context, isDefined);
};

// A value as a string, as JavaScript converts it in a template or beside a string in +.
const translateToString = (node: ts.Expression, scope: Scope, context: Context) => {
  const value = translateExpression(node, scope, context);
  return getKind(node, context) === "string" ? value : `ToString(${value})`;
};

const translateTemplate = (node: ts.TemplateExpression, scope: Scope, context: Context) => {
  const parts = [
    ...(node.head.text === "" ? [] : [JSON.stringify(node.head.text)]),
    ...node.templateSpans.flatMap((span) => {
      const value = translateToString(span.expression, scope, context);
      return span.literal.text === "" ? [value] : [value, JSON.stringify(span.literal.text)];
    }),
  ];
  return parts.length === 1 ? parts[0] : parts.map(wrap).join(" \\o ");
};

const translateBinary = (node: ts.BinaryExpression, scope: Scope, context: Context) => {
  const kind = node.operatorToken.kind;
  const translate = (inner: ts.Expression) => wrap(translateExpression(inner, scope, context));
  const isString =
    getKind(node.left, context) === "string" || getKind(node.right, context) === "string";
  const logical = LOGICAL_OPERATORS.get(kind);
  if (logical !== undefined) {
    if (!isBooleanLike(node.left, context) || !isBooleanLike(node.right, context)) {
      throw new TsproverError(
        `${node.operatorToken.getText()} needs booleans, so compare explicitly`,
        node,
      );
    }
    return `${translate(node.left)} ${logical} ${translate(node.right)}`;
  }
  if (kind === ts.SyntaxKind.PlusToken && isString) {
    const left = wrap(translateToString(node.left, scope, context));
    return `${left} \\o ${wrap(translateToString(node.right, scope, context))}`;
  }
  if (kind === ts.SyntaxKind.PlusToken) return `${translate(node.left)} + ${translate(node.right)}`;
  if (kind === ts.SyntaxKind.PercentToken) {
    context.prelude.add("Rem");
    return `Rem(${translateExpression(node.left, scope, context)}, ${translateExpression(node.right, scope, context)})`;
  }
  if (kind === ts.SyntaxKind.QuestionQuestionToken) {
    context.prelude.add("Null");
    context.prelude.add("Undefined");
    return share(
      translate(node.left),
      "value",
      context,
      (value) => `IF ${value} \\in {Null, Undefined} THEN ${translate(node.right)} ELSE ${value}`,
    );
  }
  if (kind === ts.SyntaxKind.InKeyword) {
    return `${translate(node.left)} \\in DOMAIN ${translate(node.right)}`;
  }
  if (kind === ts.SyntaxKind.SlashToken) {
    throw new TsproverError("Write division as Math.floor(a / b) or Math.trunc(a / b)", node);
  }
  if (ORDERING_OPERATORS.has(kind) && isString) {
    throw new TsproverError("TLA+ strings have no order, so compare them with === only", node);
  }
  const operator = BINARY_OPERATORS.get(kind);
  if (operator === undefined) {
    throw new TsproverError(
      `Unsupported operator: ${node.operatorToken.getText()}`,
      node.operatorToken,
    );
  }
  return `${translate(node.left)} ${operator} ${translate(node.right)}`;
};

// A field of the state before the step, which is the variable's unprimed value.
const getPreviousVariable = (name: string, node: ts.Node, context: Context) => {
  const variable = [...context.variables].find((entry) => entry[0].name === name);
  if (variable === undefined) throw new TsproverError(`Unknown variable: ${name}`, node);
  return variable[1];
};

// A function passes as its operator's name, and a constant as its value.
const translateReference = (declaration: HelperDeclaration, scope: Scope, context: Context) =>
  getFunction(declaration) === undefined
    ? translateHelperCall(declaration, undefined, scope, context)
    : getDefinition(declaration, context).name;

const translateEnumMember = (node: ts.Node, symbol: ts.Symbol, context: Context) => {
  const declaration = symbol.valueDeclaration;
  const value =
    declaration !== undefined && ts.isEnumMember(declaration)
      ? context.checker.getConstantValue(declaration)
      : undefined;
  if (typeof value === "string") return translateString(value, context);
  if (typeof value === "number" && Number.isInteger(value)) return String(value);
  throw new TsproverError("Unsupported enum member", node);
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
  return declaration === undefined ? undefined : translateReference(declaration, scope, context);
};

const translateIdentifier = (node: ts.Identifier, scope: Scope, context: Context) => {
  if (node.text === "undefined") {
    context.prelude.add("Undefined");
    return "Undefined";
  }
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
    );
  }
  const declared = translateDeclared(node, symbol, scope, context);
  if (declared !== undefined) return declared;
  if (symbol !== undefined && context.variables.has(symbol)) {
    throw new TsproverError(`${node.text} can't be read here`, node);
  }
  throw new TsproverError(`Unknown name: ${node.text}`, node);
};

const translatePropertyAccess = (
  node: ts.PropertyAccessExpression,
  scope: Scope,
  context: Context,
) => {
  if (node.questionDotToken !== undefined) {
    throw new TsproverError("Optional chaining isn't supported", node);
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
  return size ?? `${wrap(translateExpression(receiver, scope, context))}.${name}`;
};

const translateElementAccess = (
  node: ts.ElementAccessExpression,
  scope: Scope,
  context: Context,
) => {
  const value = wrap(translateExpression(node.expression, scope, context));
  const index = node.argumentExpression;
  return getKind(node.expression, context) === "sequence"
    ? `${value}[${translateIndex(index, scope, context)}]`
    : `${value}[${translateExpression(index, scope, context)}]`;
};

export const translateCondition = (node: ts.Expression, scope: Scope, context: Context) => {
  if (!isBooleanLike(node, context)) {
    throw new TsproverError("Conditions must be booleans, so compare explicitly", node);
  }
  return translateExpression(node, scope, context);
};

// Negates a condition, cancelling ! and turning a negated || into a conjunction of guards, so that
// TLC sees the same formula as a hand-written spec and counts the same successors.
export const translateNegatedCondition = (
  node: ts.Expression,
  scope: Scope,
  context: Context,
): string => {
  if (ts.isParenthesizedExpression(node)) {
    return translateNegatedCondition(node.expression, scope, context);
  }
  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.ExclamationToken) {
    return translateCondition(node.operand, scope, context);
  }
  if (ts.isBinaryExpression(node) && node.operatorToken.kind === ts.SyntaxKind.BarBarToken) {
    const left = translateNegatedCondition(node.left, scope, context);
    const right = translateNegatedCondition(node.right, scope, context);
    return `${wrap(left)} /\\ ${wrap(right)}`;
  }
  return `~${wrap(translateCondition(node, scope, context))}`;
};

// An expression as a TLA+ expression. Under a non-null assertion, isDefined skips the check that a
// lookup such as map.get(key) found a value.
export const translateExpression = (
  node: ts.Expression,
  scope: Scope,
  context: Context,
  isDefined = false,
): string => {
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
    if (!Number.isInteger(Number(node.text))) {
      throw new TsproverError(`Only integers are supported: ${node.text}`, node);
    }
    return String(Number(node.text));
  }
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return translateString(node.text, context);
  }
  if (ts.isTemplateExpression(node)) return translateTemplate(node, scope, context);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return "TRUE";
  if (node.kind === ts.SyntaxKind.FalseKeyword) return "FALSE";
  if (node.kind === ts.SyntaxKind.NullKeyword) {
    context.prelude.add("Null");
    return "Null";
  }
  if (ts.isIdentifier(node)) return translateIdentifier(node, scope, context);
  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.ExclamationToken) {
    if (!isBooleanLike(node.operand, context)) {
      throw new TsproverError("! needs a boolean, so compare explicitly", node);
    }
    return `~${wrap(translateExpression(node.operand, scope, context))}`;
  }
  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken) {
    return `-${wrap(translateExpression(node.operand, scope, context))}`;
  }
  if (ts.isBinaryExpression(node)) return translateBinary(node, scope, context);
  if (ts.isConditionalExpression(node)) {
    return `IF ${translateCondition(node.condition, scope, context)} THEN ${translateExpression(node.whenTrue, scope, context)} ELSE ${translateExpression(node.whenFalse, scope, context)}`;
  }
  if (ts.isArrayLiteralExpression(node)) return translateArrayLiteral(node, scope, context);
  if (ts.isObjectLiteralExpression(node)) return translateObjectLiteral(node, scope, context);
  if (ts.isPropertyAccessExpression(node)) return translatePropertyAccess(node, scope, context);
  if (ts.isElementAccessExpression(node)) return translateElementAccess(node, scope, context);
  if (ts.isCallExpression(node)) return translateCall(node, scope, context, isDefined);
  if (ts.isNewExpression(node)) return translateNew(node, scope, context);
  throw new TsproverError(`Unsupported expression: ${node.getText()}`, node);
};
