// tlapm's PTL backend up to the text it sends LS4 (Pltl.process_obligation, Prep.flatten, and
// Ls4's printer): temporal operators reduce to [], <> and prime, assumptions that hold
// always get a [], and every other subformula becomes an atom named by a hash of its printed form.
// The text is the negated obligation.

import {
  adjoin,
  applyBuiltin,
  at,
  bumpBy,
  mapAccumulate,
  mapScoped,
  shift,
  shiftExpr,
  substituteExpr,
  substituteHyp,
  type Builtin,
  type Expr,
  type Hyp,
  type Level,
  type Scope,
  type Sequent,
  type Substitution,
} from "../../obligation-expression";
import { renderDoc } from "../../obligation-format";
import { getLevelInfo } from "../../obligation-levels";
import { printExpression } from "../../obligation-printer";
import { expandAction, expandFairness, expandLeadsto, getTime } from "../../obligation-temporal";
import { getMd5 } from "../prep/md5";

const KIND_NAMES: Record<Level, string> = {
  Constant: "CONSTANT",
  State: "STATE",
  Action: "ACTION",
  Temporal: "TEMPORAL",
  Unknown: "Unknown",
};

const LEVEL_NAMES = ["CONSTANT", "STATE", "ACTION", "TEMPORAL"];

// Coalesce.rename_with_loc: each declared name gets its kind in front, or its level for a definition,
// as in VARIABLE_x_ and CONSTANT_i_, so atoms print with the names tlapm hashes. A variable a
// temporal quantifier binds keeps its name.
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
              name: `${KIND_NAMES[hyp.level]}_${hyp.name}_`,
              domain: hyp.domain && renameDeclarations(current, hyp.domain),
            };
          case "Flex":
            return { ...hyp, name: `VARIABLE_${hyp.name}_` };
          case "Defn": {
            const definition = hyp.definition;
            if (definition.kind !== "Operator") return hyp;
            const body = renameDeclarations(current, definition.body);
            const level = LEVEL_NAMES[getLevelInfo(current, body).level];
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
          name: `${KIND_NAMES[bound.level]}_${bound.name}_`,
        })),
      };
    case "Choose":
    case "SetSt":
      return { ...mapped, name: `CONSTANT_${mapped.name}_` };
    default:
      return mapped;
  }
};

interface PreparedHyps {
  scope: Scope | undefined;
  substitution: Substitution;
  context: Hyp[];
}

// Pltl.expand_domains and Pltl.box_assumptions: NEW x \in S becomes NEW x and the fact x \in S, and
// each visible fact that holds always gets a [].
const prepareHyps = (scope: Scope | undefined, expression: Expr): Expr => {
  if (expression.kind !== "Sequent")
    return mapScoped(scope, expression, prepareHyps, adjoin, "all");
  const state: PreparedHyps = { scope, substitution: shift(0), context: [] };
  const push = (hyp: Hyp) => {
    const prepared =
      hyp.kind === "Fact" && hyp.visibility === "Visible" && hyp.time === "Always"
        ? { ...hyp, expression: applyBuiltin("BoxTrue", [hyp.expression], hyp.expression) }
        : hyp;
    state.context.push(prepared);
    state.scope = adjoin(state.scope, prepared);
  };
  for (const original of expression.sequent.context) {
    const hyp = substituteHyp(state.substitution, original);
    if (hyp.kind === "Fact") {
      push({ ...hyp, expression: prepareHyps(state.scope, hyp.expression) });
      state.substitution = bumpBy(1, state.substitution);
      continue;
    }
    if (hyp.kind !== "Fresh" || !hyp.domain || original.kind !== "Fresh" || !original.domain) {
      push(hyp);
      state.substitution = bumpBy(1, state.substitution);
      continue;
    }
    const domain = prepareHyps(state.scope, hyp.domain);
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
      time: hyp.level === "Constant" ? getTime(state.scope, original.domain) : "Now",
      location: hyp.location,
    });
    state.substitution = {
      kind: "Compose",
      outer: shift(1),
      inner: bumpBy(1, state.substitution),
    };
  }
  const active = substituteExpr(state.substitution, expression.sequent.active);
  return {
    ...expression,
    sequent: { context: state.context, active: prepareHyps(state.scope, active) },
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

// Prep.flatten, which tlapm applies after Pltl.process_obligation has made every equality an atom:
// TRUE drops out of the conjunctions of each visible fact, and a fact left with nothing disappears.
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

// The text tlapm sends LS4 for an obligation after Prep.normalize_expand.
export const encodePtl = (sequent: Sequent): string => {
  // Ls4's printer. A sequent becomes an implication from its visible facts, joined by &, and
  // Prep.flatten applies to the facts of the outermost one.
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
    // Pltl.coalesce_fol: an atom is named by the first five hex digits of the MD5 of its print.
    return `h${getMd5(renderDoc(printExpression(hyps, expression))).slice(0, 5)}`;
  };
  const renamed = renameDeclarations(undefined, { kind: "Sequent", sequent });
  const prepared = prepareHyps(undefined, expandAction(expandLeadsto(expandFairness(renamed))));
  return `not (${print([], prepared, true)})`;
};
