import type { Expression, OperatorDefinition } from "../ast";
import { boolean, bound, ifExpression, junction, letExpression, not, quantify, set } from "./tla";

// The structure tla-ts generates for function bodies, kept until the end so that disabled paths
// simplify away.
export type Formula =
  | ExpressionFormula
  | DisabledFormula
  | AndFormula
  | IfFormula
  | LetFormula
  | BindFormula;

interface ExpressionFormula {
  kind: "expression";
  expression: Expression;
}

// A path through an action that assigns nothing, which TLA+ writes as FALSE.
interface DisabledFormula {
  kind: "disabled";
}

interface AndFormula {
  kind: "and";
  items: Formula[];
}

interface IfFormula {
  kind: "if";
  condition: Expression;
  whenTrue: Formula;
  whenFalse: Formula;
}

interface LetFormula {
  kind: "let";
  definitions: OperatorDefinition[];
  body: Formula;
}

// A name bound to a value, which an action evaluates once where it would evaluate a LET definition
// that may call Assert at each reference.
interface BindFormula {
  kind: "bind";
  name: string;
  value: Expression;
  body: Formula;
}

export const DISABLED: Formula = { kind: "disabled" };

export const leaf = (expression: Expression): Formula => ({ kind: "expression", expression });

const isTrue = (formula: Formula) =>
  formula.kind === "expression" &&
  formula.expression.kind === "Identifier" &&
  formula.expression.name === "TRUE";

export const and = (items: Formula[]): Formula => {
  const flattened = items.flatMap((item) => (item.kind === "and" ? item.items : [item]));
  if (flattened.some((item) => item.kind === "disabled")) return DISABLED;
  const kept = flattened.filter((item) => !isTrue(item));
  if (kept.length === 0) return leaf(boolean(true));
  return kept.length === 1 ? kept[0] : { kind: "and", items: kept };
};

export const ifThenElse = (
  condition: Expression,
  whenTrue: Formula,
  whenFalse: Formula,
  negated = not(condition),
): Formula => {
  if (whenTrue.kind === "disabled" && whenFalse.kind === "disabled") return DISABLED;
  if (whenFalse.kind === "disabled") return and([leaf(condition), whenTrue]);
  if (whenTrue.kind === "disabled") return and([leaf(negated), whenFalse]);
  return { kind: "if", condition, whenTrue, whenFalse };
};

export const letIn = (definitions: OperatorDefinition[], body: Formula): Formula => {
  if (body.kind === "disabled" || definitions.length === 0) return body;
  if (body.kind === "let") return letIn([...definitions, ...body.definitions], body.body);
  return { kind: "let", definitions, body };
};

export const bindValue = (name: string, value: Expression, body: Formula): Formula =>
  body.kind === "disabled" ? body : { kind: "bind", name, value, body };

export const render = (formula: Formula): Expression => {
  if (formula.kind === "disabled") return boolean(false);
  if (formula.kind === "expression") return formula.expression;
  if (formula.kind === "and") return junction("And", formula.items.map(render), true);
  if (formula.kind === "if") {
    return ifExpression(formula.condition, render(formula.whenTrue), render(formula.whenFalse));
  }
  if (formula.kind === "bind") {
    return quantify("Exists", [bound(formula.name, set([formula.value]))], render(formula.body));
  }
  return letExpression(formula.definitions, render(formula.body));
};
