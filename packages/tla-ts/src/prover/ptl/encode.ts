import {
  bumpBy,
  shift,
  shiftExpr,
  substituteExpr,
  substituteHyp,
  type Substitution,
} from "../../obligations/substitution";
import {
  adjoin,
  applyBuiltin,
  at,
  mapAccumulate,
  mapScoped,
  type Builtin,
  type Expr,
  type Hyp,
  type Scope,
  type Sequent,
} from "../../obligations/expression";
import { getLevelInfo } from "../../obligations/levels";
import { expandAction, expandFairness, expandLeadsto, getTime } from "../../obligations/temporal";
import { getHashName, LEVEL_NUMBER_PREFIXES, LEVEL_PREFIXES } from "../prep/action";

const renameSequent = (scope: Scope | undefined, sequent: Sequent): Sequent => {
  const [inner, context] = mapAccumulate(
    scope,
    sequent.context,
    (current, hyp): [Scope | undefined, Hyp] => {
      const renamed = ((): Hyp => {
        switch (hyp.kind) {
          case "Fresh":
            return {
              ...hyp,
              name: `${LEVEL_PREFIXES[hyp.level]}_${hyp.name}_`,
              domain: hyp.domain && renameDeclarations(current, hyp.domain),
            };
          case "Flex":
            return { ...hyp, name: `VARIABLE_${hyp.name}_` };
          case "Defn": {
            const definition = hyp.definition;
            if (definition.kind !== "Operator") return hyp;
            const body = renameDeclarations(current, definition.body);
            const level = LEVEL_NUMBER_PREFIXES[getLevelInfo(current, body).level];
            return {
              ...hyp,
              definition: { ...definition, name: `${level}_${definition.name}_`, body },
            };
          }
          case "Fact":
            return { ...hyp, expression: renameDeclarations(current, hyp.expression) };
        }
      })();
      return [adjoin(current, renamed), renamed];
    },
  );
  return { context, active: renameDeclarations(inner, sequent.active) };
};

const renameDeclarations = (scope: Scope | undefined, expression: Expr): Expr => {
  if (expression.kind === "Sequent")
    return { ...expression, sequent: renameSequent(scope, expression.sequent) };
  const mapped = mapScoped(scope, expression, renameDeclarations, adjoin, "all");
  switch (mapped.kind) {
    case "Lambda":
      return {
        ...mapped,
        params: mapped.params.map((param) => ({ ...param, name: `Unknown_${param.name}_` })),
      };
    case "Quant":
    case "Fcn":
    case "SetOf":
      return {
        ...mapped,
        bounds: mapped.bounds.map((bound) => ({
          ...bound,
          name: `${LEVEL_PREFIXES[bound.level]}_${bound.name}_`,
        })),
      };
    case "Choose":
    case "SetSt":
      return { ...mapped, name: `CONSTANT_${mapped.name}_` };
    default:
      return mapped;
  }
};

const prepareHyps = (scope: Scope | undefined, expression: Expr): Expr => {
  if (expression.kind !== "Sequent")
    return mapScoped(scope, expression, prepareHyps, adjoin, "all");
  let innerScope = scope;
  let substitution: Substitution = shift(0);
  const context: Hyp[] = [];
  const push = (hyp: Hyp) => {
    const prepared =
      hyp.kind === "Fact" && hyp.visibility === "Visible" && hyp.time === "Always"
        ? { ...hyp, expression: applyBuiltin("BoxTrue", [hyp.expression], hyp.expression) }
        : hyp;
    context.push(prepared);
    innerScope = adjoin(innerScope, prepared);
  };
  for (const original of expression.sequent.context) {
    const hyp = substituteHyp(substitution, original);
    if (hyp.kind !== "Fresh" || !hyp.domain || original.kind !== "Fresh" || !original.domain) {
      push(
        hyp.kind === "Fact" ? { ...hyp, expression: prepareHyps(innerScope, hyp.expression) } : hyp,
      );
      substitution = bumpBy(1, substitution);
      continue;
    }
    const domain = prepareHyps(innerScope, hyp.domain);
    push({ ...hyp, domain: undefined });
    // tlapm judges the time of the domain as written, one hypothesis too deep.
    push({
      kind: "Fact",
      expression: applyBuiltin(
        "Mem",
        [at({ kind: "Ix", index: 1 }, domain), shiftExpr(1, domain)],
        domain,
      ),
      visibility: hyp.domainVisibility,
      time: hyp.level === "Constant" ? getTime(innerScope, original.domain) : "Now",
      location: hyp.location,
    });
    substitution = {
      kind: "Compose",
      outer: shift(1),
      inner: bumpBy(1, substitution),
    };
  }
  const active = substituteExpr(substitution, expression.sequent.active);
  return {
    ...expression,
    sequent: { context, active: prepareHyps(innerScope, active) },
  };
};

const BINARY: Partial<Record<Builtin, string>> = {
  Conj: "&",
  Disj: "|",
  Implies: "->",
  Equiv: "<->",
};

const UNARY: Partial<Record<Builtin, string>> = {
  Neg: "~",
  BoxTrue: "always",
  BoxFalse: "always",
  Diamond: "sometime",
  Prime: "next",
};

const removeTrue = (expression: Expr): Expr | undefined => {
  if (expression.kind === "Internal" && expression.builtin === "TRUE") return undefined;
  if (expression.kind === "List" && expression.bullet !== "Or") {
    const items = expression.items.flatMap((item) => removeTrue(item) ?? []);
    if (items.length <= 1) return items[0];
    return { ...expression, bullet: "And", items };
  }
  if (
    expression.kind !== "Apply" ||
    expression.operator.kind !== "Internal" ||
    expression.operator.builtin !== "Conj" ||
    expression.args.length !== 2
  )
    return expression;
  const left = removeTrue(expression.args[0]);
  const right = removeTrue(expression.args[1]);
  return left && right ? { ...expression, args: [left, right] } : (left ?? right);
};

const TRUE_TEXT = "(cc | ~ cc)";

export const encodePtl = (sequent: Sequent): string => {
  const print = (hyps: Hyp[], expression: Expr, isOutermost = false): string => {
    const recurse = (inner: Expr) => print(hyps, inner);
    switch (expression.kind) {
      case "Internal":
        if (expression.builtin === "TRUE") return TRUE_TEXT;
        if (expression.builtin === "FALSE") return "(cc & ~ cc)";
        break;
      case "Apply": {
        const operator = expression.operator;
        const args = expression.args;
        if (operator.kind !== "Internal") break;
        const binary = BINARY[operator.builtin];
        if (binary && args.length === 2)
          return `(${recurse(args[0])} ${binary} ${recurse(args[1])})`;
        const unary = UNARY[operator.builtin];
        if (unary && args.length === 1) return `(${unary} ${recurse(args[0])})`;
        break;
      }
      case "List": {
        if (expression.items.length === 0) return TRUE_TEXT;
        const junction = expression.bullet === "Or" ? "|" : "&";
        return expression.items
          .map(recurse)
          .reduceRight((right, left) => `(${left} ${junction} ${right})`);
      }
      case "Sequent": {
        const inner = [...hyps];
        const facts: string[] = [];
        for (const hyp of expression.sequent.context) {
          const fact =
            hyp.kind !== "Fact" || hyp.visibility !== "Visible"
              ? undefined
              : isOutermost
                ? removeTrue(hyp.expression)
                : hyp.expression;
          if (fact) facts.push(print(inner, fact));
          inner.push(hyp);
        }
        const goal = print(inner, expression.sequent.active);
        return facts.length === 0 ? goal : `(${facts.join(" & ")} -> ${goal})`;
      }
    }
    return getHashName(hyps, expression);
  };
  const renamed = renameDeclarations(undefined, { kind: "Sequent", sequent });
  const prepared = prepareHyps(undefined, expandAction(expandLeadsto(expandFairness(renamed))));
  return `not (${print([], prepared, true)})`;
};
