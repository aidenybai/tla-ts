// Ported from Isabelle2025's Provers/blast.ML. Copyright (c) 1986-2025 University of Cambridge,
// Technische Universitaet Muenchen, and contributors, see LICENSE.
//
// The object logic's data for blast, and the state of one search: the names of its Skolem
// constants and the trail of variable assignments that backtracking undoes.

import { bumpInit, bumpString } from "../../pure/name";
import type { GoalTactic } from "../../pure/tactical";
import type { Limits } from "../../pure/interrupt";
import type { List } from "../../pure/list";
import type { Thm } from "../../pure/thm";
import type { Claset } from "../classical";
import type { RuleTemplate } from "./rules";
import { blastAconv, varOccur, wkNorm, type BlastTerm, type ConstType, type VarRef } from "./term";

// BLAST_DATA, with the two rules of other structures that blast uses.
export interface BlastData {
  readonly trueprop: string;
  readonly equalityName: string;
  readonly notName: string;
  // ~P ==> P ==> R
  readonly notE: Thm;
  // (~P ==> False) ==> P
  readonly ccontr: Thm;
  readonly hypSubstTac: (limits: Limits) => GoalTactic;
  // The classical reasoner's (~P ==> P) ==> P, which Classical.dup_intr resolves with.
  readonly classical: Thm;
  // The atomize rules of Object_Logic, newest first, for atomize_prems_tac.
  readonly atomize: readonly Thm[];
}

export interface BlastContext {
  readonly limits: Limits;
  readonly claset: Claset;
  readonly data: BlastData;
  // The constants' declared types, for Sign.const_typargs.
  readonly consts: ReadonlyMap<string, ConstType>;
  // The elimination and introduction rules converted to tableau rules so far.
  readonly elimTemplates: WeakMap<Thm, RuleTemplate>;
  readonly introTemplates: WeakMap<Thm, RuleTemplate>;
}

// A formula pending on a branch, with its may-duplicate flag.
export interface Formula {
  readonly term: BlastTerm;
  readonly md: boolean;
}

// The safe and unsafe formulae of one level of a branch.
export interface Level {
  readonly safe: readonly Formula[];
  readonly unsafe: readonly Formula[];
}

export interface Branch {
  readonly pairs: readonly Level[];
  // Literals: irreducible formulae.
  readonly lits: readonly BlastTerm[];
  // The variables occurring in the branch.
  readonly vars: readonly VarRef[];
  // The resource limit.
  readonly lim: number;
}

// A choice point: the trail length and branch count when it was made, and the token its handler
// catches. The token is undefined for PROVE, the end of the search.
export interface Choice {
  readonly ntrl: number;
  readonly nbrs: number;
  readonly token: object | undefined;
}

export interface BlastState {
  readonly context: BlastContext;
  // The used names with their latest renaming, a Name.context updated in place.
  readonly names: Map<string, string | undefined>;
  // The assigned variables, latest last, so that the trail's length is ntrail.
  readonly trail: VarRef[];
}

// Raising the exception of a choice point: unwinds to the handler that owns the token. Not an
// Error, since backtracking is frequent and needs no stack trace.
class Backtrack {
  readonly token: object | undefined;
  constructor(token: object | undefined) {
    this.token = token;
  }
}

// The choice points, latest first. The last is PROVE's.
export type Choices = List<Choice> | undefined;

export const isBacktrackTo = (error: unknown, token: object | undefined) =>
  error instanceof Backtrack && error.token === token;

export const backtrack = (choices: Choices): never => {
  throw new Backtrack(choices?.head.token);
};

// Name.variant on the state's names, for names without trailing underscores.
export const gensym = (state: BlastState, name: string) => {
  const names = state.names;
  if (!names.has(name)) {
    names.set(name, undefined);
    return name;
  }
  const initial = bumpInit(name);
  let current = initial;
  while (names.has(current)) current = bumpString(names.get(current) ?? current);
  if (current !== initial) names.set(initial, current);
  names.set(current, undefined);
  return current;
};

// Restores the trail to a previous length, for backtracking.
export const clearTo = (state: BlastState, count: number) => {
  while (state.trail.length > count) {
    const ref = state.trail.pop();
    if (ref !== undefined) ref.value = undefined;
  }
};

// First-order unification with bound variables. The variables of vars are local to a rule: their
// assignments are not trailed.
const updateVar = (
  state: BlastState,
  vars: readonly VarRef[],
  variable: Extract<BlastTerm, { kind: "Var" }>,
  term: BlastTerm,
): boolean => {
  if (blastAconv(variable, term)) return true;
  if (varOccur(variable.ref, term)) return false;
  if (vars.includes(variable.ref)) variable.ref.value = term;
  else if (term.kind === "Var" && vars.includes(term.ref)) term.ref.value = variable;
  else {
    variable.ref.value = term;
    state.trail.push(variable.ref);
  }
  return true;
};

const unifyAux = (
  state: BlastState,
  vars: readonly VarRef[],
  left: BlastTerm,
  right: BlastTerm,
): boolean => {
  const normalLeft = wkNorm(left);
  const normalRight = wkNorm(right);
  if (normalLeft.kind === "Var") return updateVar(state, vars, normalLeft, normalRight);
  if (normalRight.kind === "Var") return updateVar(state, vars, normalRight, normalLeft);
  if (normalLeft.kind === "Const" && normalRight.kind === "Const")
    return (
      normalLeft.name === normalRight.name &&
      normalLeft.typargs.length === normalRight.typargs.length &&
      normalLeft.typargs.every((arg, index) =>
        unifyAux(state, vars, arg, normalRight.typargs[index]),
      )
    );
  if (normalLeft.kind === "Abs" && normalRight.kind === "Abs")
    return unifyAux(state, vars, normalLeft.body, normalRight.body);
  if (normalLeft.kind === "App" && normalRight.kind === "App")
    return (
      unifyAux(state, vars, normalLeft.fun, normalRight.fun) &&
      unifyAux(state, vars, normalLeft.arg, normalRight.arg)
    );
  return blastAconv(normalLeft, normalRight);
};

export const unify = (
  state: BlastState,
  vars: readonly VarRef[],
  left: BlastTerm,
  right: BlastTerm,
): boolean => {
  const start = state.trail.length;
  if (unifyAux(state, vars, left, right)) return true;
  clearTo(state, start);
  return false;
};
