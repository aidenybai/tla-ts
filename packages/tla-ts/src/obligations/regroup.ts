// A port of tlapm's Pco.resolve.

import type { Expression, SourceLocation } from "../ast";
import { lookupOperator, type Operator } from "./operators";

type Grouping =
  | { kind: "Attached"; expression: Expression }
  | { kind: "Reduced"; isFinal: boolean };

const PREFIX_KEYWORDS: Partial<Record<Expression["kind"], string>> = {
  Always: "[]",
  Eventually: "<>",
  Enabled: "ENABLED",
  Unchanged: "UNCHANGED",
};

const isSamePosition = (left: SourceLocation | undefined, right: SourceLocation | undefined) =>
  left !== undefined &&
  right !== undefined &&
  left.line === right.line &&
  left.column === right.column;

const getStart = (expression: Expression) => {
  const range = expression.location.range;
  return range && { line: range.startLine, column: range.startColumn };
};

const getEnd = (expression: Expression) => {
  const range = expression.location.range;
  return range && { line: range.endLine, column: range.endColumn };
};

const withEnd = (expression: Expression, end: SourceLocation | undefined): Expression => {
  const range = expression.location.range;
  return range && end
    ? {
        ...expression,
        location: {
          ...expression.location,
          range: { ...range, endLine: end.line, endColumn: end.column },
        },
      }
    : expression;
};

const getOpenOperator = (expression: Expression) => {
  if (expression.kind === "Apply") {
    const operator = lookupOperator(expression.operator);
    const isInfix = expression.args.length === 2 && operator.fixity.startsWith("Infix");
    const isPrefix = expression.args.length === 1 && operator.fixity === "Prefix";
    if (!isInfix && !isPrefix) return undefined;
    const last = expression.args.length - 1;
    return {
      operator,
      isInfix,
      operand: expression.args[last],
      replace: (operand: Expression): Expression => ({
        ...expression,
        args: [...expression.args.slice(0, last), operand],
      }),
    };
  }
  const keyword = PREFIX_KEYWORDS[expression.kind];
  if (keyword === undefined || !("expression" in expression)) return undefined;
  return {
    operator: lookupOperator(keyword),
    isInfix: false,
    operand: expression.expression,
    replace: (operand: Expression): Expression => ({ ...expression, expression: operand }),
  };
};

const isBelow = (left: Operator, right: Operator) => left.high < right.low;

export const regroup = (expression: Extract<Expression, { kind: "Apply" }>): Expression => {
  const operator = lookupOperator(expression.operator);
  const [left, right] = expression.args;
  const end = getEnd(expression);
  const getInfix = (operand: Expression): Expression => {
    const range = expression.location.range;
    const start = getStart(operand);
    return {
      ...expression,
      args: [operand, right],
      location:
        range && start
          ? {
              ...expression.location,
              range: { ...range, startLine: start.line, startColumn: start.column },
            }
          : expression.location,
    };
  };
  const attach = (node: Expression, isOpen: boolean): Grouping => {
    const open = isOpen ? getOpenOperator(node) : undefined;
    if (!open) return { kind: "Reduced", isFinal: false };
    const inner = attach(open.operand, isSamePosition(getEnd(open.operand), getEnd(node)));
    if (inner.kind === "Attached")
      return { kind: "Attached", expression: withEnd(open.replace(inner.expression), end) };
    const isReduced =
      !inner.isFinal &&
      (isBelow(operator, open.operator) ||
        (open.isInfix &&
          operator.fixity === "InfixLeft" &&
          open.operator.fixity === "InfixLeft" &&
          !isBelow(open.operator, operator)));
    if (isReduced) return { kind: "Reduced", isFinal: !isBelow(operator, open.operator) };
    return { kind: "Attached", expression: withEnd(open.replace(getInfix(open.operand)), end) };
  };
  const grouping = attach(left, isSamePosition(getStart(left), getStart(expression)));
  return grouping.kind === "Attached" ? grouping.expression : expression;
};
