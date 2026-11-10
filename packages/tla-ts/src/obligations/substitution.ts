// A port of tlapm's E_subst.

import { TlaProofError } from "../errors";
import {
  at,
  mapAccumulate,
  mapBoundDomains,
  mapDefnBody,
  mapExceptSpecs,
  mapSelectorArgs,
  stripProps,
  type Bound,
  type Defn,
  type Expr,
  type ExprCore,
  type Hyp,
  type Sequent,
} from "./expression";

export type Substitution =
  | { kind: "Shift"; amount: number }
  | { kind: "Cons"; expression: Expr; rest: Substitution }
  | { kind: "Compose"; outer: Substitution; inner: Substitution }
  | { kind: "Bump"; amount: number; rest: Substitution };

export const shift = (amount: number): Substitution => ({ kind: "Shift", amount });

export const consSubstitution = (expression: Expr, rest: Substitution): Substitution => ({
  kind: "Cons",
  expression,
  rest,
});

export const consAll = (expressions: Expr[], rest: Substitution) =>
  expressions.reduce((inner, expression) => consSubstitution(expression, inner), rest);

export const bumpBy = (amount: number, substitution: Substitution): Substitution =>
  substitution.kind === "Bump"
    ? { kind: "Bump", amount: substitution.amount + amount, rest: substitution.rest }
    : { kind: "Bump", amount, rest: substitution };

const applyIndex = (substitution: Substitution, index: number, from: Expr): Expr => {
  switch (substitution.kind) {
    case "Shift":
      return at({ kind: "Ix", index: substitution.amount + index }, from);
    case "Cons":
      return index === 1
        ? at(stripProps(substitution.expression), from)
        : applyIndex(substitution.rest, index - 1, from);
    case "Compose":
      return substituteExpr(substitution.outer, applyIndex(substitution.inner, index, from));
    case "Bump":
      return index <= substitution.amount
        ? at({ kind: "Ix", index }, from)
        : substituteExpr(
            shift(substitution.amount),
            applyIndex(substitution.rest, index - substitution.amount, from),
          );
  }
};

export const substituteExprs = (substitution: Substitution, expressions: Expr[]) =>
  expressions.map((expression) => substituteExpr(substitution, expression));

export const normalizeApply = (operator: Expr, args: Expr[]): ExprCore => {
  if (operator.kind === "Lambda") {
    if (operator.params.length !== args.length) throw new TlaProofError("Arity mismatch");
    return stripProps(substituteExpr(consAll(args, shift(0)), operator.body));
  }
  if (operator.kind === "Apply") {
    return { kind: "Apply", operator: operator.operator, args: [...operator.args, ...args] };
  }
  return args.length === 0 ? stripProps(operator) : { kind: "Apply", operator, args };
};

export const substituteBounds = (
  substitution: Substitution,
  bounds: Bound[],
): [Substitution, Bound[]] => [
  bumpBy(bounds.length, substitution),
  mapBoundDomains(bounds, (domain) => substituteExpr(substitution, domain)),
];

export const substituteDefn = (substitution: Substitution, definition: Defn): Defn => {
  switch (definition.kind) {
    case "Recursive":
    case "Operator":
    case "Bpragma":
      return mapDefnBody(definition, (body) => substituteExpr(substitution, body));
    case "Instance": {
      const inner = bumpBy(definition.instance.args.length, substitution);
      return {
        ...definition,
        instance: {
          ...definition.instance,
          substitutions: definition.instance.substitutions.map((entry) => ({
            name: entry.name,
            expression: substituteExpr(inner, entry.expression),
          })),
        },
      };
    }
  }
};

export const substituteHyp = (substitution: Substitution, hyp: Hyp): Hyp => {
  switch (hyp.kind) {
    case "Fresh":
      return hyp.domain ? { ...hyp, domain: substituteExpr(substitution, hyp.domain) } : hyp;
    case "Flex":
      return hyp;
    case "Defn":
      return { ...hyp, definition: substituteDefn(substitution, hyp.definition) };
    case "Fact":
      return { ...hyp, expression: substituteExpr(substitution, hyp.expression) };
  }
};

export const substituteSequent = (substitution: Substitution, sequent: Sequent): Sequent => {
  const [inner, context] = mapAccumulate(substitution, sequent.context, (current, hyp) => [
    bumpBy(1, current),
    substituteHyp(current, hyp),
  ]);
  return { context, active: substituteExpr(inner, sequent.active) };
};

export const substituteExpr = (substitution: Substitution, expression: Expr): Expr => {
  const recurse = (inner: Expr) => substituteExpr(substitution, inner);
  switch (expression.kind) {
    case "Internal":
    case "Opaque":
    case "String":
    case "Num":
    case "At":
      return expression;
    case "Ix":
      return applyIndex(substitution, expression.index, expression);
    case "Apply":
      return at(
        normalizeApply(
          recurse(expression.operator),
          substituteExprs(substitution, expression.args),
        ),
        expression,
      );
    case "Bang":
      return {
        ...expression,
        expression: recurse(expression.expression),
        selectors: expression.selectors.map((selector) => mapSelectorArgs(selector, recurse)),
      };
    case "Lambda":
      return {
        ...expression,
        body: substituteExpr(bumpBy(expression.params.length, substitution), expression.body),
      };
    case "Let": {
      const [inner, definitions] = mapAccumulate(
        substitution,
        expression.definitions,
        (current, definition) => [bumpBy(1, current), substituteDefn(current, definition)],
      );
      return { ...expression, definitions, body: substituteExpr(inner, expression.body) };
    }
    case "Sequent":
      return { ...expression, sequent: substituteSequent(substitution, expression.sequent) };
    case "With":
    case "Dot":
    case "Parens":
      return { ...expression, expression: recurse(expression.expression) };
    case "If":
      return {
        ...expression,
        condition: recurse(expression.condition),
        consequent: recurse(expression.consequent),
        alternative: recurse(expression.alternative),
      };
    case "List":
      return { ...expression, items: substituteExprs(substitution, expression.items) };
    case "Quant":
    case "Fcn": {
      const [inner, bounds] = substituteBounds(substitution, expression.bounds);
      return { ...expression, bounds, body: substituteExpr(inner, expression.body) };
    }
    case "Tquant":
      return {
        ...expression,
        body: substituteExpr(bumpBy(expression.names.length, substitution), expression.body),
      };
    case "Choose":
      return {
        ...expression,
        domain: expression.domain && recurse(expression.domain),
        body: substituteExpr(bumpBy(1, substitution), expression.body),
      };
    case "SetSt":
      return {
        ...expression,
        domain: recurse(expression.domain),
        body: substituteExpr(bumpBy(1, substitution), expression.body),
      };
    case "SetOf": {
      const [inner, bounds] = substituteBounds(substitution, expression.bounds);
      return { ...expression, bounds, element: substituteExpr(inner, expression.element) };
    }
    case "SetEnum":
    case "Tuple":
      return { ...expression, elements: substituteExprs(substitution, expression.elements) };
    case "Arrow":
      return {
        ...expression,
        domain: recurse(expression.domain),
        range: recurse(expression.range),
      };
    case "FcnApp":
      return {
        ...expression,
        function: recurse(expression.function),
        args: substituteExprs(substitution, expression.args),
      };
    case "Product":
      return { ...expression, factors: substituteExprs(substitution, expression.factors) };
    case "Rect":
    case "Record":
      return {
        ...expression,
        fields: expression.fields.map((field) => ({
          name: field.name,
          value: recurse(field.value),
        })),
      };
    case "Except":
      return {
        ...expression,
        function: recurse(expression.function),
        specs: mapExceptSpecs(expression.specs, recurse),
      };
    case "Sub":
    case "Tsub":
    case "Fair":
      return {
        ...expression,
        action: recurse(expression.action),
        subscript: recurse(expression.subscript),
      };
    case "Case":
      return {
        ...expression,
        arms: expression.arms.map((arm) => ({
          condition: recurse(arm.condition),
          body: recurse(arm.body),
        })),
        other: expression.other && recurse(expression.other),
      };
  }
};

export const shiftExpr = (amount: number, expression: Expr) =>
  amount === 0 ? expression : substituteExpr(shift(amount), expression);
