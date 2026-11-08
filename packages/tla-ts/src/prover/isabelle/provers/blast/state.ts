// Ported from Isabelle2025's Provers/blast.ML. Copyright (c) 1986-2025 University of Cambridge,
// Technische Universitaet Muenchen, and contributors, see LICENSE.

import { bumpInit, bumpString } from "../../pure/name";
import type { GoalTactic } from "../../pure/tactical";
import type { Limits } from "../../pure/interrupt";
import type { List } from "../../pure/list";
import type { Thm } from "../../pure/thm";
import type { Claset } from "../classical";
import type { RuleTemplate } from "./rules";
import { blastAconv, varOccur, wkNorm, type BlastTerm, type ConstType, type VarRef } from "./term";

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
  readonly consts: ReadonlyMap<string, ConstType>;
  readonly elimTemplates: WeakMap<Thm, RuleTemplate>;
  readonly introTemplates: WeakMap<Thm, RuleTemplate>;
}

export interface Formula {
  readonly term: BlastTerm;
  readonly md: boolean;
}

export interface Level {
  readonly safe: readonly Formula[];
  readonly unsafe: readonly Formula[];
}

export interface Branch {
  readonly pairs: readonly Level[];
  readonly lits: readonly BlastTerm[];
  readonly vars: readonly VarRef[];
  readonly lim: number;
}

// The token is undefined for PROVE, the end of the search.
export interface Choice {
  readonly ntrl: number;
  readonly nbrs: number;
  readonly token: object | undefined;
}

export interface BlastState {
  readonly context: BlastContext;
  readonly names: Map<string, string | undefined>;
  // Latest last, so that the trail's length is ntrail.
  readonly trail: VarRef[];
}

// Not an Error, since backtracking is frequent and needs no stack trace.
class Backtrack {
  readonly token: object | undefined;
  constructor(token: object | undefined) {
    this.token = token;
  }
}

// Latest first. The last is PROVE's.
export type Choices = List<Choice> | undefined;

export const isBacktrackTo = (error: unknown, token: object | undefined) =>
  error instanceof Backtrack && error.token === token;

export const backtrack = (choices: Choices): never => {
  throw new Backtrack(choices?.head.token);
};

// For names without trailing underscores.
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

export const clearTo = (state: BlastState, count: number) => {
  while (state.trail.length > count) {
    const ref = state.trail.pop();
    if (ref !== undefined) ref.value = undefined;
  }
};

// The variables of vars are local to a rule: their assignments are not trailed.
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
