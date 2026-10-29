// Ported from Isabelle2025's Provers/blast.ML. Copyright (c) 1986-2025 University of Cambridge,
// Technische Universitaet Muenchen, and contributors, see LICENSE.
//
// Blast's prototerms: untyped terms whose variables are mutable references, so that unification
// updates them in place and backtracking resets them from the trail. Constants carry their type
// arguments as terms, so that overloading is tracked faithfully.

import { typargs, type TypargPosition } from "../../pure/consts";
import {
  dummyT,
  mkApp,
  mkBound,
  mkConst,
  mkFree,
  mkVar,
  type Term,
  type Typ,
} from "../../pure/term";

// A variable's assignment: term option Unsynchronized.ref, compared by identity.
export interface VarRef {
  value: BlastTerm | undefined;
}

export type BlastTerm =
  | { readonly kind: "Const"; readonly name: string; readonly typargs: readonly BlastTerm[] }
  | { readonly kind: "Skolem"; readonly name: string; readonly args: readonly VarRef[] }
  | { readonly kind: "Free"; readonly name: string }
  | { readonly kind: "Var"; readonly ref: VarRef }
  | { readonly kind: "Bound"; readonly index: number }
  | { readonly kind: "Abs"; readonly name: string; readonly body: BlastTerm }
  | { readonly kind: "App"; readonly fun: BlastTerm; readonly arg: BlastTerm };

export interface ConstType {
  readonly typargs: readonly TypargPosition[];
}

export const GOAL_NAME = "*Goal*";
export const FALSE_NAME = "*False*";

export const mkBlastConst = (name: string, typargs: readonly BlastTerm[] = []): BlastTerm => ({
  kind: "Const",
  name,
  typargs,
});
export const mkBlastVar = (ref: VarRef): BlastTerm => ({ kind: "Var", ref });
export const mkBlastBound = (index: number): BlastTerm => ({ kind: "Bound", index });
export const mkBlastApp = (fun: BlastTerm, arg: BlastTerm): BlastTerm => ({
  kind: "App",
  fun,
  arg,
});

export const listBlastComb = (head: BlastTerm, args: readonly BlastTerm[]) =>
  args.reduce((result, arg) => mkBlastApp(result, arg), head);

// Const (c, _) $ t: the argument of a constant applied to one term, if the term is one.
export const destConstApp = (term: BlastTerm, name: string): BlastTerm | undefined =>
  term.kind === "App" && term.fun.kind === "Const" && term.fun.name === name ? term.arg : undefined;

export const mkGoal = (term: BlastTerm) => mkBlastApp(mkBlastConst(GOAL_NAME), term);

export const isGoal = (term: BlastTerm) => destConstApp(term, GOAL_NAME) !== undefined;

// Tests whether two terms are alpha-convertible, chasing instantiations.
export const blastAconv = (left: BlastTerm, right: BlastTerm): boolean => {
  if (left.kind === "Const" && right.kind === "Const")
    return left.name === right.name && blastAconvs(left.typargs, right.typargs);
  if (left.kind === "Skolem" && right.kind === "Skolem") return left.name === right.name;
  if (left.kind === "Free" && right.kind === "Free") return left.name === right.name;
  if (left.kind === "Var" && left.ref.value !== undefined) return blastAconv(left.ref.value, right);
  if (right.kind === "Var" && right.ref.value !== undefined)
    return blastAconv(left, right.ref.value);
  if (left.kind === "Var" && right.kind === "Var") return left.ref === right.ref;
  if (left.kind === "Bound" && right.kind === "Bound") return left.index === right.index;
  if (left.kind === "Abs" && right.kind === "Abs") return blastAconv(left.body, right.body);
  if (left.kind === "App" && right.kind === "App")
    return blastAconv(left.fun, right.fun) && blastAconv(left.arg, right.arg);
  return false;
};

const blastAconvs = (lefts: readonly BlastTerm[], rights: readonly BlastTerm[]) =>
  lefts.length === rights.length && lefts.every((left, index) => blastAconv(left, rights[index]));

export const memTerm = (term: BlastTerm, terms: readonly BlastTerm[]) =>
  terms.some((other) => blastAconv(term, other));

export const insTerm = (term: BlastTerm, terms: readonly BlastTerm[]) =>
  memTerm(term, terms) ? terms : [term, ...terms];

export const memVar = (ref: VarRef, refs: readonly VarRef[]) => refs.includes(ref);

const insVar = (ref: VarRef, refs: readonly VarRef[]) =>
  memVar(ref, refs) ? refs : [ref, ...refs];

// Accumulates the unassigned variables of a term, suppressing duplicates.
export const addTermVars = (term: BlastTerm, refs: readonly VarRef[]): readonly VarRef[] => {
  switch (term.kind) {
    case "Skolem":
      return addVarsVars(term.args, refs);
    case "Var":
      return term.ref.value === undefined
        ? insVar(term.ref, refs)
        : addTermVars(term.ref.value, refs);
    case "Const":
      return addTermsVars(term.typargs, refs);
    case "Abs":
      return addTermVars(term.body, refs);
    case "App":
      return addTermVars(term.fun, addTermVars(term.arg, refs));
    default:
      return refs;
  }
};

export const addTermsVars = (terms: readonly BlastTerm[], refs: readonly VarRef[]) =>
  terms.reduce((result, term) => addTermVars(term, result), refs);

const addVarsVars = (vars: readonly VarRef[], refs: readonly VarRef[]) =>
  vars.reduce(
    (result, ref) =>
      ref.value === undefined ? insVar(ref, result) : addTermVars(ref.value, result),
    refs,
  );

// Chases the assignments of the variables, returning the unassigned ones.
export const varsInVars = (refs: readonly VarRef[]) => addVarsVars(refs, []);

const incrBv = (increment: number, level: number, term: BlastTerm): BlastTerm => {
  switch (term.kind) {
    case "Bound":
      return term.index >= level ? mkBlastBound(term.index + increment) : term;
    case "Abs":
      return { kind: "Abs", name: term.name, body: incrBv(increment, level + 1, term.body) };
    case "App":
      return mkBlastApp(incrBv(increment, level, term.fun), incrBv(increment, level, term.arg));
    default:
      return term;
  }
};

export const incrBlastBoundvars = (increment: number, term: BlastTerm) =>
  increment === 0 ? term : incrBv(increment, 0, term);

// member (op =) (loose_bnos term) 0, which does not chase variables.
export const hasLooseBound0 = (term: BlastTerm, level = 0): boolean => {
  switch (term.kind) {
    case "Bound":
      return term.index === level;
    case "Abs":
      return hasLooseBound0(term.body, level + 1);
    case "App":
      return hasLooseBound0(term.fun, level) || hasLooseBound0(term.arg, level);
    default:
      return false;
  }
};

export const blastSubstBound = (arg: BlastTerm, body: BlastTerm): BlastTerm => {
  const subst = (term: BlastTerm, level: number): BlastTerm => {
    switch (term.kind) {
      case "Bound":
        if (term.index < level) return term;
        return term.index === level ? incrBlastBoundvars(level, arg) : mkBlastBound(term.index - 1);
      case "Abs":
        return { kind: "Abs", name: term.name, body: subst(term.body, level + 1) };
      case "App":
        return mkBlastApp(subst(term.fun, level), subst(term.arg, level));
      default:
        return term;
    }
  };
  return subst(body, 0);
};

// Normalizes, but not the bodies of abstractions.
export const norm = (term: BlastTerm): BlastTerm => {
  switch (term.kind) {
    case "Skolem":
      return { kind: "Skolem", name: term.name, args: varsInVars(term.args) };
    case "Const":
      return mkBlastConst(term.name, term.typargs.map(norm));
    case "Var":
      return term.ref.value === undefined ? term : norm(term.ref.value);
    case "App": {
      const fun = norm(term.fun);
      return fun.kind === "Abs"
        ? norm(blastSubstBound(term.arg, fun.body))
        : mkBlastApp(fun, norm(term.arg));
    }
    default:
      return term;
  }
};

const blastHeadOf = (term: BlastTerm): BlastTerm =>
  term.kind === "App" ? blastHeadOf(term.fun) : term;

const wkNormAux = (term: BlastTerm): BlastTerm => {
  switch (term.kind) {
    case "Var":
      return term.ref.value === undefined ? term : wkNorm(term.ref.value);
    case "App": {
      const fun = wkNormAux(term.fun);
      return fun.kind === "Abs"
        ? wkNorm(blastSubstBound(term.arg, fun.body))
        : mkBlastApp(fun, term.arg);
    }
    case "Abs": {
      const body = wkNormAux(term.body);
      if (body.kind !== "App") return { kind: "Abs", name: term.name, body };
      const arg = wkNorm(body.arg);
      return hasLooseBound0(body.fun) || arg.kind !== "Bound" || arg.index !== 0
        ? { kind: "Abs", name: term.name, body }
        : wkNorm(incrBlastBoundvars(-1, body.fun));
    }
    default:
      return term;
  }
};

// Weak, one-level normalization for unification; eta-contracts where it can.
export const wkNorm = (term: BlastTerm): BlastTerm => {
  const head = blastHeadOf(term);
  return head.kind === "Const" || head.kind === "Skolem" || head.kind === "Free"
    ? term
    : wkNormAux(term);
};

// Does variable ref occur in term? Dangling bound variables count as occurrences too.
export const varOccur = (ref: VarRef, term: BlastTerm): boolean => {
  const occ = (level: number, current: BlastTerm): boolean => {
    switch (current.kind) {
      case "Var":
        return (
          ref === current.ref || (current.ref.value !== undefined && occ(level, current.ref.value))
        );
      case "Skolem":
        return current.args.some((arg) => occ(level, mkBlastVar(arg)));
      case "Bound":
        return level <= current.index;
      case "Abs":
        return occ(level + 1, current.body);
      case "App":
        return occ(level, current.arg) || occ(level, current.fun);
      default:
        return false;
    }
  };
  return occ(0, term);
};

// Sign.const_typargs. Constants the map lacks are the ones a theory declares, which have none.
const constTypargs = (consts: ReadonlyMap<string, ConstType>, name: string, type: Typ) => {
  const declared = consts.get(name);
  return declared === undefined ? [] : typargs(declared.typargs, type);
};

const fromType = (tvars: Map<string, BlastTerm>, type: Typ): BlastTerm => {
  if (type.kind === "Type")
    return listBlastComb(
      mkBlastConst(type.name),
      type.args.map((arg) => fromType(tvars, arg)),
    );
  if (type.kind === "TFree") return { kind: "Free", name: type.name };
  const key = `${type.name}.${type.index}`;
  const known = tvars.get(key);
  if (known !== undefined) return known;
  const fresh = mkBlastVar({ value: undefined });
  tvars.set(key, fresh);
  return fresh;
};

export const fromConst = (
  consts: ReadonlyMap<string, ConstType>,
  tvars: Map<string, BlastTerm>,
  name: string,
  type: Typ,
) =>
  mkBlastConst(
    name,
    constTypargs(consts, name, type).map((arg) => fromType(tvars, arg)),
  );

// Converts a real term to a prototerm, eta-contracting it.
export const fromTerm = (consts: ReadonlyMap<string, ConstType>, term: Term): BlastTerm => {
  const vars = new Map<string, BlastTerm>();
  const tvars = new Map<string, BlastTerm>();
  const from = (current: Term): BlastTerm => {
    switch (current.kind) {
      case "Const":
        return fromConst(consts, tvars, current.name, current.type);
      case "Free":
        return { kind: "Free", name: current.name };
      case "Bound":
        return mkBlastBound(current.index);
      case "Var": {
        const key = `${current.name}.${current.index}`;
        const known = vars.get(key);
        if (known !== undefined) return known;
        const fresh = mkBlastVar({ value: undefined });
        vars.set(key, fresh);
        return fresh;
      }
      case "Abs": {
        const body = from(current.body);
        return body.kind === "App" &&
          body.arg.kind === "Bound" &&
          body.arg.index === 0 &&
          !hasLooseBound0(body.fun)
          ? incrBlastBoundvars(-1, body.fun)
          : { kind: "Abs", name: current.name, body };
      }
      case "App":
        return mkBlastApp(from(current.fun), from(current.arg));
    }
  };
  return from(term);
};

const dummyVar = mkVar("etc", 0, dummyT);

// Converts a prototerm to a real term with dummy types for net lookup, stopping at depth.
export const toTerm = (depth: number, term: BlastTerm): Term => {
  if (depth === 0) return dummyVar;
  switch (term.kind) {
    case "Const":
    case "Skolem":
      return mkConst(term.name, dummyT);
    case "Free":
      return mkFree(term.name, dummyT);
    case "Bound":
      return mkBound(term.index);
    case "App":
      return mkApp(toTerm(depth, term.fun), toTerm(depth - 1, term.arg));
    default:
      return dummyVar;
  }
};

export const stripTrueprop = (trueprop: string, term: BlastTerm) =>
  destConstApp(term, trueprop) ?? term;

// A1 ==> ... ==> An ==> B goes to [A1, ..., An], where B is not an implication.
export const stripBlastImpPrems = (trueprop: string, term: BlastTerm): BlastTerm[] =>
  term.kind === "App" &&
  term.fun.kind === "App" &&
  term.fun.fun.kind === "Const" &&
  term.fun.fun.name === "Pure.imp"
    ? [stripTrueprop(trueprop, term.fun.arg), ...stripBlastImpPrems(trueprop, term.arg)]
    : [];

// A1 ==> ... ==> An ==> B goes to B, where B is not an implication.
export const stripBlastImpConcl = (trueprop: string, term: BlastTerm): BlastTerm =>
  term.kind === "App" &&
  term.fun.kind === "App" &&
  term.fun.fun.kind === "Const" &&
  term.fun.fun.name === "Pure.imp"
    ? stripBlastImpConcl(trueprop, term.arg)
    : stripTrueprop(trueprop, term);
