// Ported from Isabelle2025's Provers/blast.ML. Copyright (c) 1986-2025 University of Cambridge, Technische Universitaet Muenchen, and contributors, see LICENSE.

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

export interface VarRef {
  value: BlastTerm | undefined;
}

// Every prototerm lists every field in this order, unused ones undefined, so V8 sees one object layout.
interface Fields {
  readonly name: string;
  readonly typargs: readonly BlastTerm[];
  readonly args: readonly VarRef[];
  readonly ref: VarRef;
  readonly index: number;
  readonly body: BlastTerm;
  readonly fun: BlastTerm;
  readonly arg: BlastTerm;
}

type Prototerm<Kind extends string, Used extends keyof Fields> = { readonly kind: Kind } & Pick<
  Fields,
  Used
> & { readonly [Key in Exclude<keyof Fields, Used>]: undefined };

export type BlastTerm =
  | Prototerm<"Const", "name" | "typargs">
  | Prototerm<"Skolem", "name" | "args">
  | Prototerm<"Free", "name">
  | Prototerm<"Var", "ref">
  | Prototerm<"Bound", "index">
  | Prototerm<"Abs", "name" | "body">
  | Prototerm<"App", "fun" | "arg">;

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
  args: undefined,
  ref: undefined,
  index: undefined,
  body: undefined,
  fun: undefined,
  arg: undefined,
});
export const mkBlastSkolem = (name: string, args: readonly VarRef[]): BlastTerm => ({
  kind: "Skolem",
  name,
  typargs: undefined,
  args,
  ref: undefined,
  index: undefined,
  body: undefined,
  fun: undefined,
  arg: undefined,
});
export const mkBlastFree = (name: string): BlastTerm => ({
  kind: "Free",
  name,
  typargs: undefined,
  args: undefined,
  ref: undefined,
  index: undefined,
  body: undefined,
  fun: undefined,
  arg: undefined,
});
export const mkBlastVar = (ref: VarRef): BlastTerm => ({
  kind: "Var",
  name: undefined,
  typargs: undefined,
  args: undefined,
  ref,
  index: undefined,
  body: undefined,
  fun: undefined,
  arg: undefined,
});
export const mkBlastBound = (index: number): BlastTerm => ({
  kind: "Bound",
  name: undefined,
  typargs: undefined,
  args: undefined,
  ref: undefined,
  index,
  body: undefined,
  fun: undefined,
  arg: undefined,
});
export const mkBlastAbs = (name: string, body: BlastTerm): BlastTerm => ({
  kind: "Abs",
  name,
  typargs: undefined,
  args: undefined,
  ref: undefined,
  index: undefined,
  body,
  fun: undefined,
  arg: undefined,
});
export const mkBlastApp = (fun: BlastTerm, arg: BlastTerm): BlastTerm => ({
  kind: "App",
  name: undefined,
  typargs: undefined,
  args: undefined,
  ref: undefined,
  index: undefined,
  body: undefined,
  fun,
  arg,
});

export const listBlastComb = (head: BlastTerm, args: readonly BlastTerm[]) =>
  args.reduce((result, arg) => mkBlastApp(result, arg), head);

export const destConstApp = (term: BlastTerm, name: string): BlastTerm | undefined =>
  term.kind === "App" && term.fun.kind === "Const" && term.fun.name === name ? term.arg : undefined;

export const mkGoal = (term: BlastTerm) => mkBlastApp(mkBlastConst(GOAL_NAME), term);

export const isGoal = (term: BlastTerm) => destConstApp(term, GOAL_NAME) !== undefined;

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

export const insTerm = (term: BlastTerm, terms: readonly BlastTerm[]) =>
  terms.some((other) => blastAconv(term, other)) ? terms : [term, ...terms];

export const sameVars = (left: readonly VarRef[], right: readonly VarRef[]) =>
  left.length === right.length && left.every((ref, index) => ref === right[index]);

const insVar = (ref: VarRef, refs: readonly VarRef[]) =>
  refs.includes(ref) ? refs : [ref, ...refs];

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

export const varsInVars = (refs: readonly VarRef[]) => addVarsVars(refs, []);

const incrBv = (increment: number, level: number, term: BlastTerm): BlastTerm => {
  switch (term.kind) {
    case "Bound":
      return term.index >= level ? mkBlastBound(term.index + increment) : term;
    case "Abs":
      return mkBlastAbs(term.name, incrBv(increment, level + 1, term.body));
    case "App":
      return mkBlastApp(incrBv(increment, level, term.fun), incrBv(increment, level, term.arg));
    default:
      return term;
  }
};

export const incrBlastBoundvars = (increment: number, term: BlastTerm) =>
  increment === 0 ? term : incrBv(increment, 0, term);

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
      return mkBlastAbs(term.name, substBoundAt(arg, level + 1, term.body));
    case "App":
      return mkBlastApp(substBoundAt(arg, level, term.fun), substBoundAt(arg, level, term.arg));
    default:
      return term;
  }
};

export const blastSubstBound = (arg: BlastTerm, body: BlastTerm) => substBoundAt(arg, 0, body);

export const norm = (term: BlastTerm): BlastTerm => {
  switch (term.kind) {
    case "Skolem": {
      const args = varsInVars(term.args);
      return sameVars(args, term.args) ? term : mkBlastSkolem(term.name, args);
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

const blastHeadOf = (term: BlastTerm) => {
  let head = term;
  while (head.kind === "App") head = head.fun;
  return head;
};

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
      if (body.kind !== "App") return mkBlastAbs(term.name, body);
      const arg = wkNorm(body.arg);
      return hasLooseBound0(body.fun) || arg.kind !== "Bound" || arg.index !== 0
        ? mkBlastAbs(term.name, body)
        : wkNorm(incrBlastBoundvars(-1, body.fun));
    }
    default:
      return term;
  }
};

export const wkNorm = (term: BlastTerm): BlastTerm => {
  const head = blastHeadOf(term);
  return head.kind === "Const" || head.kind === "Skolem" || head.kind === "Free"
    ? term
    : wkNormAux(term);
};

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

export interface VarEntry {
  readonly name: string;
  readonly index: number;
  readonly term: BlastTerm;
}

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
  if (type.kind === "TFree") return mkBlastFree(type.name);
  return lookupVar(tvars, type.name, type.index);
};

export const fromConst = (
  consts: ReadonlyMap<string, ConstType>,
  tvars: VarEntry[],
  name: string,
  type: Typ,
) => {
  const declared = consts.get(name);
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
      return mkBlastFree(term.name);
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
        : mkBlastAbs(term.name, body);
    }
    case "App":
      return mkBlastApp(
        fromTermAux(consts, vars, tvars, term.fun),
        fromTermAux(consts, vars, tvars, term.arg),
      );
  }
};

export const fromTerm = (consts: ReadonlyMap<string, ConstType>, term: Term): BlastTerm =>
  fromTermAux(consts, [], [], term);

export type Template =
  | { readonly kind: "ground"; readonly term: BlastTerm }
  | { readonly kind: "var"; readonly index: number }
  | { readonly kind: "skolem"; readonly slot: number }
  | { readonly kind: "const"; readonly name: string; readonly typargs: readonly Template[] }
  | { readonly kind: "abs"; readonly name: string; readonly body: Template }
  | { readonly kind: "app"; readonly fun: Template; readonly arg: Template };

const isGround = (template: Template) => template.kind === "ground";

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
      return mkBlastAbs(template.name, instantiateTemplate(vars, skolems, template.body));
    case "app":
      return mkBlastApp(
        instantiateTemplate(vars, skolems, template.fun),
        instantiateTemplate(vars, skolems, template.arg),
      );
  }
};

const dummyVar = mkVar("etc", 0, dummyT);

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

const stripTrueprop = (trueprop: string, term: BlastTerm) => destConstApp(term, trueprop) ?? term;

export const stripBlastImpPrems = (trueprop: string, term: BlastTerm): BlastTerm[] =>
  term.kind === "App" &&
  term.fun.kind === "App" &&
  term.fun.fun.kind === "Const" &&
  term.fun.fun.name === "Pure.imp"
    ? [stripTrueprop(trueprop, term.fun.arg), ...stripBlastImpPrems(trueprop, term.arg)]
    : [];

export const stripBlastImpConcl = (trueprop: string, term: BlastTerm): BlastTerm =>
  term.kind === "App" &&
  term.fun.kind === "App" &&
  term.fun.fun.kind === "Const" &&
  term.fun.fun.name === "Pure.imp"
    ? stripBlastImpConcl(trueprop, term.arg)
    : stripTrueprop(trueprop, term);

export const splitGoalPrems = (trueprop: string, term: BlastTerm): BlastTerm[] => [
  mkGoal(stripBlastImpConcl(trueprop, term)),
  ...stripBlastImpPrems(trueprop, term),
];
