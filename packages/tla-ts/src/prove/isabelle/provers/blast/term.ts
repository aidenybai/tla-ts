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

const NO_TYPARGS: readonly BlastTerm[] = [];

export const mkBlastConst = (name: string, typargs = NO_TYPARGS): BlastTerm => ({
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
  if (left === right) return true;
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

export const sameVars = (left: readonly VarRef[], right: readonly VarRef[]) =>
  left.length === right.length && left.every((ref, index) => ref === right[index]);

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

const substBoundAt = (arg: BlastTerm, level: number, term: BlastTerm): BlastTerm => {
  switch (term.kind) {
    case "Bound":
      if (term.index < level) return term;
      return term.index === level ? incrBlastBoundvars(level, arg) : mkBlastBound(term.index - 1);
    case "Abs":
      return { kind: "Abs", name: term.name, body: substBoundAt(arg, level + 1, term.body) };
    case "App":
      return mkBlastApp(substBoundAt(arg, level, term.fun), substBoundAt(arg, level, term.arg));
    default:
      return term;
  }
};

export const blastSubstBound = (arg: BlastTerm, body: BlastTerm) => substBoundAt(arg, 0, body);

// Normalizes, but not the bodies of abstractions. Returns the very same term where nothing
// changes, so normalizing a normal formula allocates nothing.
export const norm = (term: BlastTerm): BlastTerm => {
  switch (term.kind) {
    case "Skolem": {
      const args = varsInVars(term.args);
      return sameVars(args, term.args) ? term : { kind: "Skolem", name: term.name, args };
    }
    case "Const": {
      if (term.typargs.length === 0) return term;
      const typargs = term.typargs.map(norm);
      return typargs.every((arg, index) => arg === term.typargs[index])
        ? term
        : mkBlastConst(term.name, typargs);
    }
    case "Var":
      return term.ref.value === undefined ? term : norm(term.ref.value);
    case "App": {
      const fun = norm(term.fun);
      if (fun.kind === "Abs") return norm(blastSubstBound(term.arg, fun.body));
      const arg = norm(term.arg);
      return fun === term.fun && arg === term.arg ? term : mkBlastApp(fun, arg);
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
const occurs = (ref: VarRef, level: number, term: BlastTerm): boolean => {
  switch (term.kind) {
    case "Var":
      return (
        ref === term.ref || (term.ref.value !== undefined && occurs(ref, level, term.ref.value))
      );
    case "Skolem":
      return term.args.some(
        (arg) => ref === arg || (arg.value !== undefined && occurs(ref, level, arg.value)),
      );
    case "Bound":
      return level <= term.index;
    case "Abs":
      return occurs(ref, level + 1, term.body);
    case "App":
      return occurs(ref, level, term.arg) || occurs(ref, level, term.fun);
    default:
      return false;
  }
};

export const varOccur = (ref: VarRef, term: BlastTerm) => occurs(ref, 0, term);

// An entry of the association lists from schematic variables to prototerms that fromTerm keeps.
export interface VarEntry {
  readonly name: string;
  readonly index: number;
  readonly term: BlastTerm;
}

// AList.lookup, adding a fresh variable for a new one.
const lookupVar = (entries: VarEntry[], name: string, index: number): BlastTerm => {
  const known = entries.find((entry) => entry.index === index && entry.name === name);
  if (known !== undefined) return known.term;
  const fresh = mkBlastVar({ value: undefined });
  entries.push({ name, index, term: fresh });
  return fresh;
};

const fromType = (tvars: VarEntry[], type: Typ): BlastTerm => {
  if (type.kind === "Type")
    return listBlastComb(
      mkBlastConst(type.name),
      type.args.map((arg) => fromType(tvars, arg)),
    );
  if (type.kind === "TFree") return { kind: "Free", name: type.name };
  return lookupVar(tvars, type.name, type.index);
};

export const fromConst = (
  consts: ReadonlyMap<string, ConstType>,
  tvars: VarEntry[],
  name: string,
  type: Typ,
) => {
  const declared = consts.get(name);
  // Sign.const_typargs. Constants the map lacks are the ones a theory declares, which have none.
  return declared === undefined || declared.typargs.length === 0
    ? mkBlastConst(name)
    : mkBlastConst(
        name,
        typargs(declared.typargs, type).map((arg) => fromType(tvars, arg)),
      );
};

const fromTermAux = (
  consts: ReadonlyMap<string, ConstType>,
  vars: VarEntry[],
  tvars: VarEntry[],
  term: Term,
): BlastTerm => {
  switch (term.kind) {
    case "Const":
      return fromConst(consts, tvars, term.name, term.type);
    case "Free":
      return { kind: "Free", name: term.name };
    case "Bound":
      return mkBlastBound(term.index);
    case "Var":
      return lookupVar(vars, term.name, term.index);
    case "Abs": {
      const body = fromTermAux(consts, vars, tvars, term.body);
      return body.kind === "App" &&
        body.arg.kind === "Bound" &&
        body.arg.index === 0 &&
        !hasLooseBound0(body.fun)
        ? incrBlastBoundvars(-1, body.fun)
        : { kind: "Abs", name: term.name, body };
    }
    case "App":
      return mkBlastApp(
        fromTermAux(consts, vars, tvars, term.fun),
        fromTermAux(consts, vars, tvars, term.arg),
      );
  }
};

// Converts a real term to a prototerm, eta-contracting it.
export const fromTerm = (consts: ReadonlyMap<string, ConstType>, term: Term): BlastTerm =>
  fromTermAux(consts, [], [], term);

// A prototerm with its variables and Skolem terms numbered, so that instantiating it with fresh
// ones gives a copy that shares the parts without them, which blast never updates.
export type Template =
  | { readonly kind: "ground"; readonly term: BlastTerm }
  | { readonly kind: "var"; readonly index: number }
  | { readonly kind: "skolem"; readonly slot: number }
  | { readonly kind: "const"; readonly name: string; readonly typargs: readonly Template[] }
  | { readonly kind: "abs"; readonly name: string; readonly body: Template }
  | { readonly kind: "app"; readonly fun: Template; readonly arg: Template };

const isGround = (template: Template) => template.kind === "ground";

// Numbers the variables in refs, adding new ones, and the Skolem terms by their place in skolems.
export const toTemplate = (
  refs: VarRef[],
  skolems: readonly BlastTerm[],
  term: BlastTerm,
): Template => {
  switch (term.kind) {
    case "Var": {
      const index = refs.indexOf(term.ref);
      if (index >= 0) return { kind: "var", index };
      refs.push(term.ref);
      return { kind: "var", index: refs.length - 1 };
    }
    case "Skolem": {
      const slot = skolems.indexOf(term);
      return slot >= 0 ? { kind: "skolem", slot } : { kind: "ground", term };
    }
    case "Const": {
      const typargs = term.typargs.map((arg) => toTemplate(refs, skolems, arg));
      return typargs.every(isGround)
        ? { kind: "ground", term }
        : { kind: "const", name: term.name, typargs };
    }
    case "Abs": {
      const body = toTemplate(refs, skolems, term.body);
      return isGround(body) ? { kind: "ground", term } : { kind: "abs", name: term.name, body };
    }
    case "App": {
      const fun = toTemplate(refs, skolems, term.fun);
      const arg = toTemplate(refs, skolems, term.arg);
      return isGround(fun) && isGround(arg) ? { kind: "ground", term } : { kind: "app", fun, arg };
    }
    default:
      return { kind: "ground", term };
  }
};

export const instantiateTemplate = (
  vars: readonly BlastTerm[],
  skolems: readonly BlastTerm[],
  template: Template,
): BlastTerm => {
  switch (template.kind) {
    case "ground":
      return template.term;
    case "var":
      return vars[template.index];
    case "skolem":
      return skolems[template.slot];
    case "const":
      return mkBlastConst(
        template.name,
        template.typargs.map((arg) => instantiateTemplate(vars, skolems, arg)),
      );
    case "abs":
      return {
        kind: "Abs",
        name: template.name,
        body: instantiateTemplate(vars, skolems, template.body),
      };
    case "app":
      return mkBlastApp(
        instantiateTemplate(vars, skolems, template.fun),
        instantiateTemplate(vars, skolems, template.arg),
      );
  }
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
