// Expr.Action.implication_to_enabled, the ENABLEDaxioms frontend: it proves a rule about ENABLED
// from facts of the form the rule needs.

import { TlapmBugError, TlaProverError } from "../../errors";
import {
  adjoin,
  adjoinAll,
  getScopeAt,
  isEqualExpr,
  mapScoped,
  shiftExpr,
  type Builtin,
  type Expr,
  type Scope,
  type Sequent,
} from "../../obligations/expression";
import { getLevelInfo } from "../../obligations/levels";

interface Rule {
  name: string;
  left: Expr;
  right: Expr;
}

const TRUE: Expr = { kind: "Internal", builtin: "TRUE" };

const getOperands = (expression: Expr, builtin: Builtin) =>
  expression.kind === "Apply" &&
  expression.operator.kind === "Internal" &&
  expression.operator.builtin === builtin &&
  expression.args.length === 2
    ? expression.args
    : undefined;

const getEnabled = (expression: Expr) =>
  expression.kind === "Apply" &&
  expression.operator.kind === "Internal" &&
  expression.operator.builtin === "ENABLED" &&
  expression.args.length === 1
    ? expression.args[0]
    : undefined;

// Both operands of the connective, when each is an ENABLED.
const getEnabledOperands = (expression: Expr, builtin: Builtin) => {
  const operands = getOperands(expression, builtin);
  const left = operands && getEnabled(operands[0]);
  const right = operands && getEnabled(operands[1]);
  return left && right ? [left, right] : undefined;
};

// E_visit.collect_primed_vars: the variables under a prime, an UNCHANGED, or a subscript.
const getPrimedVariables = (scope: Scope | undefined, expression: Expr) => {
  const names = new Set<string>();
  const visit = (state: { scope: Scope | undefined; isPrimed: boolean }, inner: Expr): Expr => {
    const primed = { ...state, isPrimed: true };
    const operator = inner.kind === "Apply" && inner.operator.kind === "Internal" && inner.operator;
    const builtin = operator && operator.builtin;
    const args = inner.kind === "Apply" ? inner.args : [];
    const isScoped =
      (builtin === "Prime" && args.length === 1) ||
      builtin === "ENABLED" ||
      (builtin === "Cdot" && args.length === 2) ||
      (builtin === "UNCHANGED" && args.length === 1) ||
      inner.kind === "Sub";
    if (isScoped && state.isPrimed) throw new TlapmBugError();
    if (builtin === "Prime" && args.length === 1) visit(primed, args[0]);
    else if (builtin === "Cdot" && args.length === 2) visit(state, args[1]);
    else if (builtin === "UNCHANGED" && args.length === 1) visit(primed, args[0]);
    else if (inner.kind === "Sub") {
      visit(state, inner.action);
      visit(primed, inner.subscript);
    } else if (inner.kind === "Ix") {
      const hyp = getScopeAt(state.scope, inner.index - 1)?.hyp;
      if (!hyp) throw new TlapmBugError();
      if (hyp.kind === "Flex" && state.isPrimed) names.add(hyp.name);
    } else if (builtin !== "ENABLED") {
      mapScoped(state, inner, visit, (current, hyp) => ({
        ...current,
        scope: adjoin(current.scope, hyp),
      }));
    }
    return inner;
  };
  visit({ scope, isPrimed: false }, expression);
  return names;
};

const isDisjoint = (scope: Scope | undefined, left: Expr, right: Expr) => {
  const leftNames = getPrimedVariables(scope, left);
  return [...getPrimedVariables(scope, right)].every((name) => !leftNames.has(name));
};

// check_active: the rule the goal's form calls for, with the operands the facts must mention.
const getRule = (scope: Scope | undefined, goal: Expr): Rule | undefined => {
  const getLevelOf = (expression: Expr) => getLevelInfo(scope, expression).level;
  const assertActions = (left: Expr, right: Expr) => {
    if (getLevelOf(left) > 2 || getLevelOf(right) > 2) throw new TlapmBugError();
  };
  const enabled = getEnabled(goal);
  const enabledDisjunction = enabled && getOperands(enabled, "Disj");
  if (enabledDisjunction) {
    assertActions(enabledDisjunction[0], enabledDisjunction[1]);
    return { name: "abdisj_inverse", left: enabledDisjunction[0], right: enabledDisjunction[1] };
  }
  const disjunction = getEnabledOperands(goal, "Disj");
  if (disjunction) {
    assertActions(disjunction[0], disjunction[1]);
    return { name: "abdisj", left: disjunction[0], right: disjunction[1] };
  }
  const enabledConjunction = enabled && getOperands(enabled, "Conj");
  if (enabledConjunction) {
    const left = enabledConjunction[0];
    const right = enabledConjunction[1];
    const isApart = isDisjoint(scope, left, right);
    assertActions(left, right);
    if (!isApart) return undefined;
    return { name: getLevelOf(left) === 2 ? "abconj_inverse" : "pconj_inverse", left, right };
  }
  const conjunction = getEnabledOperands(goal, "Conj");
  if (conjunction) {
    return isDisjoint(scope, conjunction[0], conjunction[1])
      ? { name: "abconj", left: conjunction[0], right: conjunction[1] }
      : undefined;
  }
  const operands = getOperands(goal, "Conj");
  const action = operands && getEnabled(operands[1]);
  if (operands && action) {
    return getLevelOf(operands[0]) <= 1 && getLevelOf(action) <= 2
      ? { name: "pconj", left: operands[0], right: action }
      : undefined;
  }
  const equivalence = getEnabledOperands(goal, "Equiv") ?? getEnabledOperands(goal, "Eq");
  if (equivalence) return { name: "equiv", left: equivalence[0], right: equivalence[1] };
  const implication = getEnabledOperands(goal, "Implies");
  return implication && { name: "implies", left: implication[0], right: implication[1] };
};

// implication_to_enabled: the goal follows by the rule its form calls for when a visible fact is
// the rule's premise and others say that both operands are in BOOLEAN, or the premise is an
// equivalence. The goal then becomes TRUE; otherwise tlapm records the obligation as not tried.
export const implicationToEnabled = (sequent: Sequent): Sequent => {
  const goalScope = adjoinAll(undefined, sequent.context);
  const rule = getRule(goalScope, sequent.active);
  const found = { isPremise: false, isLeftBoolean: false, isRightBoolean: false };
  sequent.context.forEach((hyp, index) => {
    if (!rule || hyp.kind !== "Fact" || hyp.visibility !== "Visible") return;
    const amount = sequent.context.length - index;
    const fact = hyp.expression;
    const isLeft = (expression: Expr) => isEqualExpr(shiftExpr(amount, expression), rule.left);
    const isRight = (expression: Expr) => isEqualExpr(shiftExpr(amount, expression), rule.right);
    const isPair = (operands: Expr[] | undefined, names: string[]) =>
      operands !== undefined &&
      isLeft(operands[0]) &&
      isRight(operands[1]) &&
      names.includes(rule.name);
    const enabled = getEnabled(fact);
    const enabledConjunction = enabled && getOperands(enabled, "Conj");
    const conjunction = getOperands(fact, "Conj");
    const action = conjunction && getEnabled(conjunction[1]);
    const membership = getOperands(fact, "Mem");
    const isBoolean = membership?.[1].kind === "Internal" && membership[1].builtin === "BOOLEAN";
    if (
      isPair(enabledConjunction, ["pconj"]) ||
      isPair(enabled && getOperands(enabled, "Disj"), ["abdisj"]) ||
      isPair(getEnabledOperands(fact, "Disj"), ["abdisj_inverse"]) ||
      isPair(enabledConjunction, ["abconj"]) ||
      isPair(getEnabledOperands(fact, "Conj"), ["abconj_inverse", "pconj_inverse"]) ||
      isPair(conjunction && action && [conjunction[0], action], ["pconj_inverse"])
    ) {
      found.isPremise = true;
    } else if (isPair(getOperands(fact, "Equiv"), ["equiv"])) {
      found.isPremise = true;
      found.isLeftBoolean = true;
      found.isRightBoolean = true;
    } else if (isPair(getOperands(fact, "Eq"), ["equiv"])) {
      found.isPremise = true;
    } else if (membership && isBoolean && isLeft(membership[0])) {
      found.isLeftBoolean = true;
    } else if (membership && isBoolean && isRight(membership[0])) {
      found.isRightBoolean = true;
    } else if (isPair(getOperands(fact, "Implies"), ["implies"])) {
      found.isPremise = true;
    }
  });
  if (!found.isPremise || !found.isLeftBoolean || !found.isRightBoolean) {
    throw new TlaProverError("ENABLEDaxioms proof directive did not succeed.\n");
  }
  return { ...sequent, active: TRUE };
};
