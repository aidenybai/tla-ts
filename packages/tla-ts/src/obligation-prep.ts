// A port of the parts of tlapm's Backend.Prep that shape what a backend receives: the frontends
// that find_meth selects and expand_enabled_cdot applies, expand_defs, which runs before
// Expr.Elab.normalize, and flatten, which runs after the action frontend.

import { TlapmBugError, TlaUnsupportedError } from "./errors";
import { expandActionOperators, lambdify } from "./obligation-action";
import { createAnonymizer } from "./obligation-anon";
import {
  at,
  bumpBy,
  consSubstitution,
  shift,
  shiftExpr,
  substituteExpr,
  substituteHyp,
  type Bound,
  type Expr,
  type Hyp,
  type Sequent,
  type Substitution,
} from "./obligation-expression";
import type { PragmaSetting } from "./obligation-pragma";

const FRONTENDS = new Set([
  "expandenabled",
  "expandcdot",
  "autouse",
  "lambdify",
  "enabledaxioms",
  "levelcomparison",
]);

// find_meth, as far as it selects frontends: the prover each group of a pragma names, for each
// visible fact that cites a pragma, alone or applied to arguments.
export const getFrontends = (sequent: Sequent) => {
  const frontends = new Set<string>();
  const pragmas: (PragmaSetting[][] | undefined)[] = [];
  sequent.context.forEach((hyp, index) => {
    pragmas.push(
      hyp.kind === "Defn" && hyp.definition.kind === "Bpragma" ? hyp.definition.methods : undefined,
    );
    if (hyp.kind !== "Fact" || hyp.visibility !== "Visible") return;
    const expression = hyp.expression;
    const cited = expression.kind === "Apply" ? expression.operator : expression;
    if (cited.kind !== "Ix") return;
    const args = expression.kind === "Apply" ? expression.args : [];
    pragmas[index - cited.index]?.forEach((group) => {
      let argumentIndex = 0;
      group.forEach((setting) => {
        const value = setting.value;
        const argument = value.kind === "Default" ? args[argumentIndex++] : undefined;
        if (setting.hint !== "prover") return;
        const prover =
          value.kind === "String" ? value.value : argument?.kind === "String" ? argument.value : "";
        if (FRONTENDS.has(prover)) frontends.add(prover);
      });
    });
  });
  return frontends;
};

// expand_enabled_cdot: the first frontend the methods cite, in tlapm's order, transforms the
// obligation. Its soundness checks throw a TlaProverError, as tlapm then runs no backend.
export const expandEnabledCdot = (sequent: Sequent, frontends: Set<string>): Sequent => {
  const isEnabled = frontends.has("expandenabled");
  const isCdot = frontends.has("expandcdot");
  const isAutoUse = frontends.has("autouse");
  const isLambdify = frontends.has("lambdify");
  if (!isEnabled && !isCdot && !isLambdify) {
    if (frontends.has("levelcomparison") || frontends.has("enabledaxioms")) {
      throw new TlaUnsupportedError("the LevelComparison and ENABLEDaxioms frontends");
    }
    return sequent;
  }
  // Expr.Anon's anon, which only meets the names that lambdification binds.
  const anonymizer = createAnonymizer(
    { value: 0 },
    () => {
      throw new TlapmBugError();
    },
    () => {},
  );
  const expression: Expr = { kind: "Sequent", sequent };
  const result =
    isEnabled || isCdot
      ? expandActionOperators(anonymizer, () => {}, undefined, expression, {
          isEnabled,
          isCdot,
          isAutoUse,
        })
      : lambdify(anonymizer, () => {}, undefined, expression, {
          isEnabled: true,
          isCdot: true,
          isAutoUse,
        });
  if (result.kind !== "Sequent") throw new TlapmBugError();
  return result.sequent;
};

// expand_defs: each visible operator definition and each pragma, whatever its visibility,
// substitutes into the rest of the obligation and leaves the context.
export const expandDefs = (sequent: Sequent): Sequent => {
  const context: Hyp[] = [];
  const substitution = sequent.context.reduce<Substitution>((current, hyp) => {
    if (hyp.kind === "Defn") {
      const definition = hyp.definition;
      if (
        definition.kind === "Bpragma" ||
        (definition.kind === "Operator" && hyp.visibility === "Visible")
      ) {
        return consSubstitution(substituteExpr(current, definition.body), current);
      }
    }
    context.push(substituteHyp(current, hyp));
    return bumpBy(1, current);
  }, shift(0));
  return { context, active: substituteExpr(substitution, sequent.active) };
};

const isUnbounded = (bound: Bound) => bound.domain.kind === "NoDomain";

// extract_equalities: the equalities in a conjunction, apart from the rest of it.
const extractEqualities = (expression: Expr): [Expr[], Expr | undefined] => {
  if (expression.kind === "List" && (expression.bullet === "And" || expression.bullet === "Refs")) {
    const parts = expression.items.map(extractEqualities);
    const equalities = parts.flatMap((part) => part[0]);
    const rest = parts.flatMap((part) => (part[1] ? [part[1]] : []));
    if (rest.length <= 1) return [equalities, rest[0]];
    return [equalities, { ...expression, bullet: "And", items: rest }];
  }
  if (expression.kind === "Apply" && expression.operator.kind === "Internal") {
    const builtin = expression.operator.builtin;
    if (builtin === "Conj" && expression.args.length === 2) {
      const left = extractEqualities(expression.args[0]);
      const right = extractEqualities(expression.args[1]);
      const equalities = [...left[0], ...right[0]];
      if (left[1] && right[1]) return [equalities, { ...expression, args: [left[1], right[1]] }];
      return [equalities, left[1] ?? right[1]];
    }
    if (builtin === "Eq") return [[expression], undefined];
  }
  if (expression.kind === "Internal" && expression.builtin === "TRUE") return [[], undefined];
  if (
    expression.kind === "Quant" &&
    expression.quantifier === "Forall" &&
    expression.bounds.every(isUnbounded)
  ) {
    const extracted = extractEqualities(expression.body);
    const quantify = (inner: Expr, from: Expr) =>
      at({ kind: "Quant", quantifier: "Forall", bounds: expression.bounds, body: inner }, from);
    return [
      extracted[0].map((equality) => quantify(equality, equality)),
      extracted[1] && quantify(extracted[1], expression),
    ];
  }
  return [[], expression];
};

// flatten: each visible fact becomes the rest of it, then its equalities.
export const flatten = (sequent: Sequent): Sequent => {
  const context: Hyp[] = [];
  const substitution = sequent.context.reduce<Substitution>((current, hyp) => {
    if (hyp.kind !== "Fact" || hyp.visibility !== "Visible") {
      context.push(substituteHyp(current, hyp));
      return bumpBy(1, current);
    }
    const extracted = extractEqualities(hyp.expression);
    const facts = [...(extracted[1] ? [extracted[1]] : []), ...extracted[0]];
    facts.forEach((fact, index) =>
      context.push({ ...hyp, expression: shiftExpr(index, substituteExpr(current, fact)) }),
    );
    return { kind: "Compose", outer: shift(facts.length - 1), inner: bumpBy(1, current) };
  }, shift(0));
  return { context, active: substituteExpr(substitution, sequent.active) };
};
