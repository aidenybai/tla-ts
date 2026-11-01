// Ported from Isabelle2025's Provers/blast.ML. Copyright (c) 1986-2025 University of Cambridge,
// Technische Universitaet Muenchen, and contributors, see LICENSE.
//
// Operations on branches: naive substitution for equalities, closing a branch by complementary
// literals, and the pruning of choice points.

import { orElseGoal, thenGoal, type GoalTactic } from "../../pure/tactical";
import { assumeTac, eqAssumeTac, ematchTac } from "../../pure/tactic";
import {
  unify,
  type BlastState,
  type Branch,
  type Choices,
  type Formula,
  type Level,
} from "./state";
import {
  GOAL_NAME,
  blastAconv,
  destConstApp,
  hasLooseBound0,
  incrBlastBoundvars,
  insTerm,
  isGoal,
  mkBlastAbs,
  mkBlastApp,
  mkBlastConst,
  mkBlastVar,
  varOccur,
  type BlastTerm,
} from "./term";

export const negate = (state: BlastState, term: BlastTerm) =>
  mkBlastApp(mkBlastConst(state.context.data.notName), term);

// Converts a *Goal* to an ordinary negation.
export const negOfGoal = (state: BlastState, term: BlastTerm) => {
  const goal = destConstApp(term, GOAL_NAME);
  return goal === undefined ? term : negate(state, goal);
};

const negOfGoal2 = (state: BlastState, formula: Formula): Formula => ({
  term: negOfGoal(state, formula.term),
  md: formula.md,
});

// Converts the goals to negations in the safe parts of a branch. They could have been moved there
// from the literals by an equality substitution.
export const negOfGoals = (state: BlastState, pairs: readonly Level[]): Level[] =>
  pairs.map((level) => ({
    safe: level.safe.map((formula) => negOfGoal2(state, formula)),
    unsafe: level.unsafe,
  }));

// Replaces the atomic term old by new, returning the very same term where nothing changes.
const substAtomic = (old: BlastTerm, replacement: BlastTerm, term: BlastTerm): BlastTerm => {
  if (term.kind === "Var" && term.ref.value !== undefined)
    return substAtomic(old, replacement, term.ref.value);
  if (term.kind === "Abs") {
    const body = substAtomic(old, replacement, term.body);
    return body === term.body ? term : mkBlastAbs(term.name, body);
  }
  if (term.kind === "App") {
    const fun = substAtomic(old, replacement, term.fun);
    const arg = substAtomic(old, replacement, term.arg);
    return fun === term.fun && arg === term.arg ? term : mkBlastApp(fun, arg);
  }
  return blastAconv(term, old) ? replacement : term;
};

// Eta-contracts a term from outside, just enough to reduce it to an atom.
const etaContractAtom = (term: BlastTerm): BlastTerm => {
  if (term.kind !== "Abs") return term;
  const body = etaContract2(term.body);
  return body.kind === "App" && body.arg.kind === "Bound" && body.arg.index === 0
    ? hasLooseBound0(body.fun)
      ? term
      : etaContractAtom(incrBlastBoundvars(-1, body.fun))
    : term;
};

const etaContract2 = (term: BlastTerm): BlastTerm =>
  term.kind === "App" ? mkBlastApp(term.fun, etaContractAtom(term.arg)) : etaContractAtom(term);

// Can term occur in other? Does not examine the arguments of Skolem terms, which substitution does
// not affect, and is reflexive because hyp_subst_tac fails on x = x. No variables may occur in
// other except the arguments of a Skolem term, so that no equation that could be instantiated to
// a cycle is deleted.
const substOccur = (term: BlastTerm, other: BlastTerm) => {
  const vars = term.kind === "Skolem" ? term.args : [];
  const occEq = (current: BlastTerm): boolean => blastAconv(term, current) || occ(current);
  const occ = (current: BlastTerm): boolean => {
    switch (current.kind) {
      case "Var":
        return current.ref.value === undefined
          ? !vars.includes(current.ref)
          : occEq(current.ref.value);
      case "Abs":
        return occEq(current.body);
      case "App":
        return occEq(current.arg) || occEq(current.fun);
      default:
        return false;
    }
  };
  return occEq(other);
};

// Takes apart an equality and orients it to eliminate a Skolem term or a free variable, or gives
// undefined (DEST_EQ) if it has no substitutable side.
const orientEquality = (state: BlastState, term: BlastTerm): [BlastTerm, BlastTerm] | undefined => {
  if (
    term.kind !== "App" ||
    term.fun.kind !== "App" ||
    term.fun.fun.kind !== "Const" ||
    term.fun.fun.name !== state.context.data.equalityName
  )
    return undefined;
  const left = etaContractAtom(term.fun.arg);
  const right = etaContractAtom(term.arg);
  const check = (old: BlastTerm, replacement: BlastTerm): [BlastTerm, BlastTerm] | undefined =>
    substOccur(old, replacement) ? undefined : [old, replacement];
  if (left.kind === "Skolem") return check(left, right);
  if (right.kind === "Skolem") return check(right, left);
  if (left.kind === "Free") return check(left, right);
  if (right.kind === "Free") return check(right, left);
  return undefined;
};

interface Substituted {
  readonly changed: readonly Formula[];
  readonly kept: readonly Formula[];
}

// Substitutes through the branch if the formula is an equality with a substitutable variable.
// Moves the affected formulae and literals back to the safe formulae, but it is not clear where
// they should go: this could make proofs fail.
export const equalSubst = (
  state: BlastState,
  formula: BlastTerm,
  branch: Branch,
): Branch | undefined => {
  const oriented = orientEquality(state, formula);
  if (oriented === undefined) return undefined;
  const subst = (term: BlastTerm) => substAtomic(oriented[0], oriented[1], term);
  const subForms = (forms: readonly Formula[], changed: readonly Formula[]): Substituted =>
    forms.reduceRight<Substituted>(
      (result, form) => {
        const substituted = subst(form.term);
        return blastAconv(substituted, form.term)
          ? { changed: result.changed, kept: [form, ...result.kept] }
          : { changed: [{ term: substituted, md: form.md }, ...result.changed], kept: result.kept };
      },
      { changed, kept: [] },
    );
  const lits = branch.lits.reduceRight<{ changed: readonly Formula[]; lits: readonly BlastTerm[] }>(
    (result, lit) => {
      const substituted = subst(lit);
      return blastAconv(substituted, lit)
        ? { changed: result.changed, lits: [substituted, ...result.lits] }
        : { changed: [{ term: substituted, md: true }, ...result.changed], lits: result.lits };
    },
    { changed: [], lits: [] },
  );
  const frames = branch.pairs.reduceRight<{
    changed: readonly Formula[];
    frames: readonly Level[];
  }>(
    (result, level) => {
      const safe = subForms(level.safe, result.changed);
      const unsafe = subForms(level.unsafe, safe.changed);
      return {
        changed: unsafe.changed,
        frames: [{ safe: safe.kept, unsafe: unsafe.kept }, ...result.frames],
      };
    },
    { changed: lits.changed, frames: [] },
  );
  return {
    pairs: [{ safe: frames.changed, unsafe: [] }, ...frames.frames],
    lits: lits.lits,
    vars: branch.vars,
    lim: branch.lim,
  };
};

// Tries to unify complementary literals, giving the tactic that closes the branch.
const eAssumeTac = (state: BlastState) => orElseGoal(eqAssumeTac, assumeTac(state.context.limits));

// contr_tac: trying eq_contr_tac first increases the effort, slowing reconstruction.
const eContrTac = (state: BlastState) =>
  thenGoal(ematchTac(state.context.limits, [state.context.data.notE]), eAssumeTac(state));

const close = (
  state: BlastState,
  left: BlastTerm,
  right: BlastTerm,
  tactic: (state: BlastState) => GoalTactic,
) => (unify(state, [], left, right) ? tactic(state) : undefined);

export const tryClose = (
  state: BlastState,
  formula: BlastTerm,
  literal: BlastTerm,
): GoalTactic | undefined => {
  const notName = state.context.data.notName;
  const formulaGoal = destConstApp(formula, GOAL_NAME);
  if (formulaGoal !== undefined) return close(state, formulaGoal, literal, eAssumeTac);
  const literalGoal = destConstApp(literal, GOAL_NAME);
  if (literalGoal !== undefined) return close(state, formula, literalGoal, eAssumeTac);
  const formulaNot = destConstApp(formula, notName);
  if (formulaNot !== undefined) return close(state, formulaNot, literal, eContrTac);
  const literalNot = destConstApp(literal, notName);
  if (literalNot !== undefined) return close(state, formula, literalNot, eContrTac);
  return undefined;
};

// Were there Skolem terms in the premise? Must not chase variables.
const hasSkolem = (term: BlastTerm): boolean => {
  switch (term.kind) {
    case "Skolem":
      return true;
    case "Abs":
      return hasSkolem(term.body);
    case "App":
      return hasSkolem(term.fun) || hasSkolem(term.arg);
    default:
      return false;
  }
};

// Attaches the may-duplicate flag to new formulae: those with Skolem terms may be duplicated.
export const joinMd = (md: boolean, terms: readonly BlastTerm[]): Formula[] =>
  terms.map((term) => ({ term, md: hasSkolem(term) || md }));

// Whether any of the last count assignments of the trail below top occurs in vars or their
// instantiations.
const clashVar = (state: BlastState, vars: readonly BlastTerm[], count: number, top: number) => {
  if (vars.length === 0) return false;
  for (
    let remaining = count, position = top - 1;
    remaining !== 0 && position >= 0;
    remaining -= 1
  ) {
    const ref = state.trail[position];
    if (vars.some((term) => varOccur(ref, term))) return true;
    position -= 1;
  }
  return false;
};

// Deletes the choice points for goals the latest inference proved, provided no variable of the
// next branch was updated. nbrs is the number of branches just before closing this one. Does not
// prune at the very end, to allow backtracking over bad proofs.
export const prune = (
  state: BlastState,
  nbrs: number,
  nxtVars: readonly BlastTerm[],
  choices: Choices,
): Choices => {
  if (nbrs === 1) return choices;
  let last = choices;
  let ntrl = state.trail.length;
  for (let current = choices; current !== undefined; current = current.tail) {
    const choice = current.head;
    if (choice.nbrs < nbrs) return last;
    if (choice.nbrs > nbrs) continue;
    if (clashVar(state, nxtVars, ntrl - choice.ntrl, ntrl)) return last;
    last = current.tail;
    ntrl = choice.ntrl;
  }
  return last;
};

export const nextVars = (brs: readonly Branch[]) =>
  brs.length === 0 ? [] : brs[0].vars.map((ref) => mkBlastVar(ref));

// Adds the literal, handling *Goal* and detecting duplicates. A new *Goal* turns the other goals
// into negations.
export const addLit = (state: BlastState, term: BlastTerm, lits: readonly BlastTerm[]) => {
  const goal = destConstApp(term, GOAL_NAME);
  if (goal === undefined) return insTerm(term, lits);
  const notName = state.context.data.notName;
  const isBad = (lit: BlastTerm) => {
    if (isGoal(lit)) return true;
    const negated = destConstApp(lit, notName);
    return negated !== undefined && blastAconv(goal, negated);
  };
  const change = (lit: BlastTerm): BlastTerm[] => {
    const inner = destConstApp(lit, GOAL_NAME) ?? destConstApp(lit, notName);
    if (inner === undefined) return [lit];
    return blastAconv(goal, inner) ? [] : [negate(state, inner)];
  };
  return [
    mkBlastApp(mkBlastConst(GOAL_NAME), goal),
    ...(lits.some(isBad) ? lits.flatMap(change) : lits),
  ];
};

// The penalty for a branching factor: log2 seems a little too severe.
export const log4 = (count: number): number => (count < 4 ? 0 : 1 + log4(Math.floor(count / 4)));

// Whether term might be an instance of pattern, to detect recursive rules such as transitivity.
export const match = (state: BlastState, pattern: BlastTerm, term: BlastTerm): boolean => {
  if (pattern.kind === "Var") return true;
  if (pattern.kind === "Const" && term.kind === "Const") {
    const notName = state.context.data.notName;
    return (
      (pattern.name === GOAL_NAME && term.name === notName) ||
      (pattern.name === notName && term.name === GOAL_NAME) ||
      (pattern.name === term.name &&
        pattern.typargs.length === term.typargs.length &&
        pattern.typargs.every((arg, index) => match(state, arg, term.typargs[index])))
    );
  }
  if (pattern.kind === "Free" && term.kind === "Free") return pattern.name === term.name;
  if (pattern.kind === "Bound" && term.kind === "Bound") return pattern.index === term.index;
  if (pattern.kind === "Abs" && term.kind === "Abs") return match(state, pattern.body, term.body);
  if (pattern.kind === "App" && term.kind === "App")
    return match(state, pattern.fun, term.fun) && match(state, pattern.arg, term.arg);
  return false;
};
