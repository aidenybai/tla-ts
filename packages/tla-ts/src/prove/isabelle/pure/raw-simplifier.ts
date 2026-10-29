// Ported from Isabelle2025's Pure/raw_simplifier.ML, the simpset and its rewrite rules. Copyright
// (c) 1986-2025 University of Cambridge, Technische Universitaet Muenchen, and contributors, see
// LICENSE.
//
// Isabelle/TLA+ declares no congruence procedures, so the simpset leaves them out.

import { TlaIsabelleError } from "../../../errors";
import { etaContract } from "./envir";
import { symmetricThm } from "./drule";
import { destEquals, isEquals, occs, stripImpConcl, stripImpPrems } from "./logic";
import { deleteTermSafe, emptyNet, insertNet, keyOfTerm, type Net } from "./net";
import { isFirstOrder, isPattern, matches } from "./pattern";
import { emptyTable, type Table } from "./table";
import { emptyTEnv } from "./envir";
import { emptyTyEnv } from "./type";
import {
  aconv,
  existsSubterm,
  existsType,
  foldVars,
  eqTyp,
  headOf,
  type Term,
  type Typ,
  type Var,
} from "./term";
import { rs, type Thm } from "./thm";
import { eqThmProp, noTac, type GoalTactic } from "./tactical";
import type { Limits } from "./tactic";

export interface Rrule {
  readonly thm: Thm;
  readonly lhs: Term;
  readonly elhs: Term;
  readonly extra: boolean;
  readonly fo: boolean;
  readonly perm: boolean;
}

export interface Procedure {
  readonly name: string;
  readonly lhs: Term;
  readonly proc: (context: SimpContext, term: Term) => Thm | undefined;
}

export interface Solver {
  readonly name: string;
  readonly tactic: (context: SimpContext) => GoalTactic;
}

export interface MkRews {
  readonly mk: (thm: Thm, context: SimpContext) => Thm[];
  readonly mkEqTrue: (thm: Thm) => Thm | undefined;
}

export interface CongName {
  readonly isConst: boolean;
  readonly name: string;
}

export interface Simpset {
  readonly rules: Net<Rrule>;
  readonly prems: readonly Thm[];
  readonly depth: number;
  readonly congs: Table<string, Thm>;
  readonly weakCongs: readonly CongName[];
  readonly simprocs: Net<Procedure>;
  readonly mkRews: MkRews;
  readonly subgoalTac: (context: SimpContext) => GoalTactic;
  readonly loopTacs: readonly {
    readonly name: string;
    readonly tactic: (context: SimpContext) => GoalTactic;
  }[];
  readonly unsafeSolvers: readonly Solver[];
  readonly safeSolvers: readonly Solver[];
}

// The part of an Isabelle proof context that the simplifier reads: the simpset, the time limits,
// and the counter that names the free variables standing for bound ones.
export interface SimpContext {
  readonly limits: Limits;
  readonly simpset: Simpset;
  readonly bounds: number;
}

export const SIMP_DEPTH_LIMIT = 40;

export const congKey = (name: CongName) => `${name.isConst ? "1" : "0"}${name.name}`;

export const congName = (term: Term): CongName | undefined =>
  term.kind === "Const"
    ? { isConst: true, name: term.name }
    : term.kind === "Free"
      ? { isConst: false, name: term.name }
      : undefined;

const varsOf = (term: Term) => foldVars((atom, result: Var[]) => [...result, atom], term, []);

const hasVar = (vars: readonly Var[], variable: Var) =>
  vars.some(
    (other) =>
      other.name === variable.name &&
      other.index === variable.index &&
      eqTyp(other.type, variable.type),
  );

const addTVarKeys = (type: Typ, keys: Set<string>) => {
  if (type.kind === "TVar") keys.add(`${type.index}:${type.name}`);
  if (type.kind === "Type") for (const arg of type.args) addTVarKeys(arg, keys);
  return keys;
};

const hasNewTVar = (type: Typ, keys: ReadonlySet<string>): boolean => {
  if (type.kind === "TVar") return !keys.has(`${type.index}:${type.name}`);
  if (type.kind === "Type") return type.args.some((arg) => hasNewTVar(arg, keys));
  return false;
};

// rewrite_rule_extra_vars: whether the right-hand sides have variables outside the left-hand side
// and the premises.
export const rewriteRuleExtraVars = (
  prems: readonly Term[],
  elhs: Term,
  erhss: readonly Term[],
) => {
  const terms = [elhs, ...prems];
  const vars = terms.flatMap(varsOf);
  const tvars = new Set<string>();
  for (const term of terms)
    existsType((type) => {
      addTVarKeys(type, tvars);
      return false;
    }, term);
  return erhss.some(
    (erhs) =>
      existsType((type) => hasNewTVar(type, tvars), erhs) ||
      existsSubterm((sub) => sub.kind === "Var" && !hasVar(vars, sub), erhs),
  );
};

const mkRrule2 = (thm: Thm, lhs: Term, elhs: Term, perm: boolean): Rrule => ({
  thm,
  lhs,
  elhs,
  extra: rewriteRuleExtraVars([], elhs, [
    ...thm.tpairs.flatMap((pair) => [pair[0], pair[1]]),
    thm.prop,
  ]),
  fo: isFirstOrder(elhs) || !isPattern(elhs),
  perm,
});

const vperm = (left: Term, right: Term): boolean => {
  if (left.kind === "Var" && right.kind === "Var") return true;
  if (left.kind === "Abs" && right.kind === "Abs") return vperm(left.body, right.body);
  if (left.kind === "App" && right.kind === "App")
    return vperm(left.fun, right.fun) && vperm(left.arg, right.arg);
  return aconvExact(left, right);
};

const aconvExact = (left: Term, right: Term): boolean => {
  if (left.kind !== right.kind) return false;
  switch (left.kind) {
    case "Const":
    case "Free":
      return right.kind === left.kind && left.name === right.name && eqTyp(left.type, right.type);
    case "Var":
      return (
        right.kind === "Var" &&
        left.name === right.name &&
        left.index === right.index &&
        eqTyp(left.type, right.type)
      );
    case "Bound":
      return right.kind === "Bound" && left.index === right.index;
    case "Abs":
      return (
        right.kind === "Abs" &&
        left.name === right.name &&
        eqTyp(left.type, right.type) &&
        aconvExact(left.body, right.body)
      );
    case "App":
      return (
        right.kind === "App" && aconvExact(left.fun, right.fun) && aconvExact(left.arg, right.arg)
      );
  }
};

const isVarPerm = (left: Term, right: Term) => {
  if (!vperm(left, right)) return false;
  const leftVars = varsOf(left);
  const rightVars = varsOf(right);
  return (
    leftVars.every((variable) => hasVar(rightVars, variable)) &&
    rightVars.every((variable) => hasVar(leftVars, variable))
  );
};

interface Decomposed {
  readonly prems: Term[];
  readonly lhs: Term;
  readonly elhs: Term;
  readonly rhs: Term;
  readonly perm: boolean;
}

export const decompSimp = (thm: Thm): Decomposed => {
  const prems = stripImpPrems(thm.prop);
  const concl = stripImpConcl(thm.prop);
  if (!isEquals(concl)) throw new TlaIsabelleError("ERROR", "Rewrite rule not a meta-equality");
  const [lhs, rhs] = destEquals(concl);
  const elhs = etaContract(lhs);
  const erhs = etaContract(rhs);
  const perm = isVarPerm(elhs, erhs) && !aconv(elhs, erhs) && elhs.kind !== "Var";
  return { prems, lhs, elhs, rhs, perm };
};

interface RawRrule {
  readonly thm: Thm;
  readonly lhs: Term;
  readonly elhs: Term;
  readonly perm: boolean;
}

const mkEqTrue = (context: SimpContext, thm: Thm): RawRrule[] => {
  const eqTrue = context.simpset.mkRews.mkEqTrue(thm);
  if (eqTrue === undefined) return [];
  const decomposed = decompSimp(eqTrue);
  return [{ thm: eqTrue, lhs: decomposed.lhs, elhs: decomposed.elhs, perm: false }];
};

const rruleEqTrue = (
  context: SimpContext,
  thm: Thm,
  lhs: Term,
  elhs: Term,
  rhs: Term,
  original: Thm,
): RawRrule[] => {
  const rrule = { thm, lhs, elhs, perm: false };
  return rewriteRuleExtraVars([], lhs, [rhs]) ? [...mkEqTrue(context, original), rrule] : [rrule];
};

const mkRrule = (context: SimpContext, thm: Thm): RawRrule[] => {
  const decomposed = decompSimp(thm);
  if (decomposed.perm) return [{ thm, lhs: decomposed.lhs, elhs: decomposed.elhs, perm: true }];
  if (
    rewriteRuleExtraVars(decomposed.prems, decomposed.lhs, [decomposed.rhs]) ||
    decomposed.elhs.kind === "Var"
  )
    return mkEqTrue(context, thm);
  return rruleEqTrue(context, thm, decomposed.lhs, decomposed.elhs, decomposed.rhs, thm);
};

// default_reorient: catches looping rules and stupid orientations.
const defaultReorient = (prems: readonly Term[], lhs: Term, rhs: Term) =>
  rewriteRuleExtraVars(prems, lhs, [rhs]) ||
  headOf(lhs).kind === "Var" ||
  [rhs, ...prems].some((term) => occs(lhs, term)) ||
  (prems.length === 0 && matches(lhs, rhs, emptyTyEnv, emptyTEnv)) ||
  (lhs.kind === "Const" && rhs.kind !== "Const");

const orientRrule = (context: SimpContext, thm: Thm): RawRrule[] => {
  const decomposed = decompSimp(thm);
  if (decomposed.perm) return [{ thm, lhs: decomposed.lhs, elhs: decomposed.elhs, perm: true }];
  if (!defaultReorient(decomposed.prems, decomposed.lhs, decomposed.rhs))
    return rruleEqTrue(context, thm, decomposed.lhs, decomposed.elhs, decomposed.rhs, thm);
  if (defaultReorient(decomposed.prems, decomposed.rhs, decomposed.lhs))
    return mkEqTrue(context, thm);
  const symmetric = (() => {
    try {
      return rs(thm, symmetricThm);
    } catch (error) {
      if (error instanceof TlaIsabelleError && error.exception === "THM") return undefined;
      throw error;
    }
  })();
  if (symmetric === undefined) return [];
  const flipped = decompSimp(symmetric);
  return rruleEqTrue(context, symmetric, flipped.lhs, flipped.elhs, flipped.rhs, thm);
};

// extract_safe_rrules: the rewrite rules of an assumption, oriented to avoid loops.
export const extractSafeRrules = (context: SimpContext, thm: Thm): RawRrule[] =>
  context.simpset.mkRews.mk(thm, context).flatMap((rew) => orientRrule(context, rew));

const eqRrule = (left: Rrule, right: Rrule) => eqThmProp(left.thm, right.thm);

export const insertRrule = (raw: RawRrule, simpset: Simpset): Simpset => {
  const rrule = mkRrule2(raw.thm, raw.lhs, raw.elhs, raw.perm);
  const rules = insertNet(eqRrule, keyOfTerm(rrule.elhs), rrule, simpset.rules);
  return rules === undefined ? simpset : { ...simpset, rules };
};

export const delRrule = (raw: RawRrule, simpset: Simpset): Simpset => {
  const rrule = mkRrule2(raw.thm, raw.lhs, raw.elhs, raw.perm);
  return { ...simpset, rules: deleteTermSafe(eqRrule, rrule.elhs, rrule, simpset.rules) };
};

export const addSimps = (context: SimpContext, thms: readonly Thm[]): Simpset =>
  thms
    .flatMap((thm) => context.simpset.mkRews.mk(thm, context))
    .flatMap((rew) => mkRrule(context, rew))
    .reduce((simpset, raw) => insertRrule(raw, simpset), context.simpset);

export const delSimps = (context: SimpContext, thms: readonly Thm[]): Simpset =>
  thms
    .flatMap((thm) => context.simpset.mkRews.mk(thm, context))
    .flatMap((rew) => mkRrule(context, rew))
    .reduce((simpset, raw) => delRrule(raw, simpset), context.simpset);

// mk_procrule: the rewrite rule a simplification procedure proves.
export const mkProcrule = (thm: Thm): Rrule[] => {
  const decomposed = decompSimp(thm);
  if (rewriteRuleExtraVars(decomposed.prems, decomposed.lhs, [decomposed.rhs])) return [];
  return [mkRrule2(thm, decomposed.lhs, decomposed.elhs, false)];
};

export const addPrems = (thms: readonly Thm[], simpset: Simpset): Simpset => ({
  ...simpset,
  prems: [...thms, ...simpset.prems],
});

// Rebuilds a rule net from Net.entries, as the reference simpset lists them.
export const rulesFromEntries = (thms: readonly Thm[]): Net<Rrule> =>
  thms.reduceRight<Net<Rrule>>((net, thm) => {
    const decomposed = decompSimp(thm);
    const rrule = mkRrule2(thm, decomposed.lhs, decomposed.elhs, decomposed.perm);
    return insertNet(() => false, keyOfTerm(rrule.elhs), rrule, net) ?? net;
  }, emptyNet);

export const emptyCongs: Table<string, Thm> = emptyTable((left: string, right: string) =>
  left === right ? 0 : left < right ? -1 : 1,
);

// empty_ss: rewrites with meta-equalities only, and solves no subgoal.
export const emptySimpset: Simpset = {
  rules: emptyNet,
  prems: [],
  depth: 0,
  congs: emptyCongs,
  weakCongs: [],
  simprocs: emptyNet,
  mkRews: {
    mk: (thm) => (isEquals(stripImpConcl(thm.prop)) ? [thm] : []),
    mkEqTrue: () => undefined,
  },
  subgoalTac: () => () => noTac,
  loopTacs: [],
  unsafeSolvers: [],
  safeSolvers: [],
};
