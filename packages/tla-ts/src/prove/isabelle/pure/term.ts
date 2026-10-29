// Ported from Isabelle2025's Pure/term.ML. Copyright (c) 1986-2025 University of Cambridge,
// Technische Universitaet Muenchen, and contributors, see LICENSE.
//
// Simply typed lambda terms with de Bruijn indices. Functions that rebuild a term return the
// very same object when nothing changes, as Isabelle's Same.SAME does, so pointer equality stays a
// fast path.
//
// Unlike Isabelle, applications, abstractions and compound types record what their subterms
// contain when built: the largest index (maxidx), a bound above every loose bound variable (loose),
// whether a schematic variable, a beta redex or an eta redex occurs, and a bit for the name of each
// free variable (flags). A term has every flag of its subterms. Traversals use this to skip
// subterms they would return unchanged, which gives the same results while touching only the parts
// that change.

import { TlaIsabelleError } from "../../../errors";

export type Sort = readonly string[];

export type Typ =
  | {
      readonly kind: "Type";
      readonly name: string;
      readonly args: readonly Typ[];
      readonly maxidx: number;
    }
  | { readonly kind: "TFree"; readonly name: string; readonly sort: Sort }
  | { readonly kind: "TVar"; readonly name: string; readonly index: number; readonly sort: Sort };

export type Term =
  | { readonly kind: "Const"; readonly name: string; readonly type: Typ }
  | { readonly kind: "Free"; readonly name: string; readonly type: Typ }
  | { readonly kind: "Var"; readonly name: string; readonly index: number; readonly type: Typ }
  | { readonly kind: "Bound"; readonly index: number }
  | {
      readonly kind: "Abs";
      readonly name: string;
      readonly type: Typ;
      readonly body: Term;
      readonly loose: number;
      readonly maxidx: number;
      readonly flags: number;
    }
  | {
      readonly kind: "App";
      readonly fun: Term;
      readonly arg: Term;
      readonly loose: number;
      readonly maxidx: number;
      readonly flags: number;
    };

export type Var = Extract<Term, { kind: "Var" }>;
export type Abs = Extract<Term, { kind: "Abs" }>;
export type App = Extract<Term, { kind: "App" }>;
export type TVar = Extract<Typ, { kind: "TVar" }>;

export interface Indexname {
  readonly name: string;
  readonly index: number;
}

export const HAS_VAR = 1;
export const HAS_REDEX = 2;
export const HAS_ETA_REDEX = 4;

export const maxidxOfTyp = (type: Typ, maxidx = -1) =>
  Math.max(maxidx, type.kind === "TFree" ? -1 : type.kind === "TVar" ? type.index : type.maxidx);

export const maxidxOfTerm = (term: Term, maxidx = -1): number => {
  switch (term.kind) {
    case "Var":
      return Math.max(maxidx, term.index, maxidxOfTyp(term.type));
    case "Const":
    case "Free":
      return maxidxOfTyp(term.type, maxidx);
    case "Bound":
      return maxidx;
    default:
      return Math.max(maxidx, term.maxidx);
  }
};

// The bound on loose bound variables: every one is below it.
export const looseOf = (term: Term) =>
  term.kind === "Bound"
    ? term.index + 1
    : term.kind === "App" || term.kind === "Abs"
      ? term.loose
      : 0;

// One of the 28 bits above the others, picked by a cheap hash of the name.
const freeBit = (name: string) =>
  8 <<
  ((name.length * 31 + (name.charCodeAt(0) | 0) * 7 + (name.charCodeAt(name.length - 1) | 0)) % 28);

export const flagsOf = (term: Term) =>
  term.kind === "Var"
    ? HAS_VAR
    : term.kind === "Free"
      ? freeBit(term.name)
      : term.kind === "App" || term.kind === "Abs"
        ? term.flags
        : 0;

// Whether a subterm aconv to pattern could occur in term.
export const mayOccur = (pattern: Term, term: Term) => (flagsOf(pattern) & ~flagsOf(term)) === 0;

export const mkType = (name: string, args: readonly Typ[] = []): Typ => ({
  kind: "Type",
  name,
  args,
  maxidx: args.reduce((result, arg) => maxidxOfTyp(arg, result), -1),
});
export const mkTFree = (name: string, sort: Sort = []): Typ => ({ kind: "TFree", name, sort });
export const mkTVar = (name: string, index: number, sort: Sort = []): Typ => ({
  kind: "TVar",
  name,
  index,
  sort,
});

export const mkConst = (name: string, type: Typ): Term => ({ kind: "Const", name, type });
export const mkFree = (name: string, type: Typ): Term => ({ kind: "Free", name, type });
export const mkVar = (name: string, index: number, type: Typ): Var => ({
  kind: "Var",
  name,
  index,
  type,
});
export const mkBound = (index: number): Term => ({ kind: "Bound", index });
export const mkAbs = (name: string, type: Typ, body: Term): Term => ({
  kind: "Abs",
  name,
  type,
  body,
  loose: Math.max(looseOf(body) - 1, 0),
  maxidx: maxidxOfTerm(body, maxidxOfTyp(type)),
  flags:
    flagsOf(body) |
    (body.kind === "App" && body.arg.kind === "Bound" && body.arg.index === 0 ? HAS_ETA_REDEX : 0),
});
export const mkApp = (fun: Term, arg: Term): Term => ({
  kind: "App",
  fun,
  arg,
  loose: Math.max(looseOf(fun), looseOf(arg)),
  maxidx: maxidxOfTerm(arg, maxidxOfTerm(fun)),
  flags: flagsOf(fun) | flagsOf(arg) | (fun.kind === "Abs" ? HAS_REDEX : 0),
});

export const dummyT = mkType("dummy");
export const propT = mkType("prop");

export const funT = (domain: Typ, range: Typ) => mkType("fun", [domain, range]);

// op --->
export const funTs = (domains: readonly Typ[], range: Typ) =>
  domains.reduceRight((result, domain) => funT(domain, result), range);

export const isFunType = (type: Typ) => type.kind === "Type" && type.name === "fun";

export const domainType = (type: Typ) => {
  if (type.kind !== "Type" || type.name !== "fun")
    throw new TlaIsabelleError("TYPE", "domain_type");
  return type.args[0];
};

export const rangeType = (type: Typ) => {
  if (type.kind !== "Type" || type.name !== "fun") throw new TlaIsabelleError("TYPE", "range_type");
  return type.args[1];
};

export const binderTypes = (type: Typ): Typ[] => {
  const types: Typ[] = [];
  let current = type;
  while (current.kind === "Type" && current.name === "fun") {
    types.push(current.args[0]);
    current = current.args[1];
  }
  return types;
};

export const bodyType = (type: Typ): Typ =>
  type.kind === "Type" && type.name === "fun" ? bodyType(type.args[1]) : type;

const eqSort = (left: Sort, right: Sort) =>
  left === right ||
  (left.length === right.length && left.every((name, index) => name === right[index]));

export const eqTyp = (left: Typ, right: Typ): boolean => {
  if (left === right) return true;
  if (left.kind === "Type")
    return (
      right.kind === "Type" &&
      left.name === right.name &&
      left.args.length === right.args.length &&
      left.args.every((arg, index) => eqTyp(arg, right.args[index]))
    );
  if (left.kind === "TFree")
    return right.kind === "TFree" && left.name === right.name && eqSort(left.sort, right.sort);
  return (
    right.kind === "TVar" &&
    left.name === right.name &&
    left.index === right.index &&
    eqSort(left.sort, right.sort)
  );
};

// fastype_of1: the type of a term, with minimal checking. Types holds the types of the loose
// bound variables, innermost first.
export const fastypeOf1 = (types: readonly Typ[], term: Term): Typ => {
  switch (term.kind) {
    case "Const":
    case "Free":
    case "Var":
      return term.type;
    case "Bound": {
      const type = types[term.index];
      if (type === undefined) throw new TlaIsabelleError("TYPE", "fastype_of: Bound");
      return type;
    }
    case "Abs":
      return funT(term.type, fastypeOf1([term.type, ...types], term.body));
    case "App": {
      const type = fastypeOf1(types, term.fun);
      if (type.kind !== "Type" || type.name !== "fun")
        throw new TlaIsabelleError("TYPE", "fastype_of: expected function type");
      return type.args[1];
    }
  }
};

export const fastypeOf = (term: Term) => fastypeOf1([], term);

export const listComb = (head: Term, args: readonly Term[]) =>
  args.reduce((result, arg) => mkApp(result, arg), head);

export const stripComb = (term: Term): [Term, Term[]] => {
  const args: Term[] = [];
  let current = term;
  while (current.kind === "App") {
    args.push(current.arg);
    current = current.fun;
  }
  return [current, args.reverse()];
};

export const headOf = (term: Term): Term => {
  let current = term;
  while (current.kind === "App") current = current.fun;
  return current;
};

export const argsOf = (term: Term) => stripComb(term)[1];

export const stripAbs = (term: Term): [{ name: string; type: Typ }[], Term] => {
  const vars: { name: string; type: Typ }[] = [];
  let current = term;
  while (current.kind === "Abs") {
    vars.push({ name: current.name, type: current.type });
    current = current.body;
  }
  return [vars, current];
};

export const stripAbsBody = (term: Term): Term =>
  term.kind === "Abs" ? stripAbsBody(term.body) : term;

export const sizeOfTerm = (term: Term): number => {
  switch (term.kind) {
    case "Abs":
      return 1 + sizeOfTerm(term.body);
    case "App":
      return sizeOfTerm(term.fun) + sizeOfTerm(term.arg);
    default:
      return 1;
  }
};

export const isAllConst = (term: Term) => term.kind === "Const" && term.name === "Pure.all";

export const stripAllBody = (term: Term): Term =>
  term.kind === "App" && isAllConst(term.fun) && term.arg.kind === "Abs"
    ? stripAllBody(term.arg.body)
    : term;

export const stripAllVars = (term: Term): { name: string; type: Typ }[] =>
  term.kind === "App" && isAllConst(term.fun) && term.arg.kind === "Abs"
    ? [{ name: term.arg.name, type: term.arg.type }, ...stripAllVars(term.arg.body)]
    : [];

// Rebuilds an application, keeping the original object when neither part changed.
export const updateApp = (term: App, fun: Term, arg: Term): Term =>
  fun === term.fun && arg === term.arg ? term : mkApp(fun, arg);

export const updateAbs = (term: Abs, body: Term, type: Typ = term.type): Term =>
  body === term.body && type === term.type ? term : mkAbs(term.name, type, body);

// incr_bv: increments the bound variables at or above level by increment.
const incrBvAt = (increment: number, level: number, term: Term): Term => {
  if (looseOf(term) <= level) return term;
  switch (term.kind) {
    case "Bound":
      return mkBound(term.index + increment);
    case "Abs":
      return updateAbs(term, incrBvAt(increment, level + 1, term.body));
    case "App":
      return updateApp(
        term,
        incrBvAt(increment, level, term.fun),
        incrBvAt(increment, level, term.arg),
      );
    default:
      return term;
  }
};

export const incrBv = (increment: number, level: number, term: Term) =>
  increment === 0 ? term : incrBvAt(increment, level, term);

export const incrBoundvars = (increment: number, term: Term) => incrBv(increment, 0, term);

// loose_bvar: whether term has a loose bound variable at level or beyond.
export const looseBvar = (term: Term, level: number) => looseOf(term) > level;

export const looseBvar1 = (term: Term, level: number): boolean => {
  if (looseOf(term) <= level) return false;
  switch (term.kind) {
    case "Bound":
      return term.index === level;
    case "App":
      return looseBvar1(term.fun, level) || looseBvar1(term.arg, level);
    case "Abs":
      return looseBvar1(term.body, level + 1);
    default:
      return false;
  }
};

export const isOpen = (term: Term) => looseBvar(term, 0);
export const isDependent = (term: Term) => looseBvar1(term, 0);

// loose_bnos: the loose bound variables, in Isabelle's insertion order.
export const looseBnos = (term: Term): number[] => {
  const numbers: number[] = [];
  const add = (current: Term, level: number) => {
    switch (current.kind) {
      case "Bound":
        if (current.index >= level && !numbers.includes(current.index - level))
          numbers.unshift(current.index - level);
        return;
      case "Abs":
        add(current.body, level + 1);
        return;
      case "App":
        add(current.arg, level);
        add(current.fun, level);
        return;
      default:
        return;
    }
  };
  add(term, 0);
  return numbers;
};

// subst_bounds: Bound i becomes args[i]; loose bound variables beyond shift down.
const substBoundsAt = (args: readonly Term[], level: number, term: Term): Term => {
  if (looseOf(term) <= level) return term;
  switch (term.kind) {
    case "Bound":
      return term.index - level < args.length
        ? incrBoundvars(level, args[term.index - level])
        : mkBound(term.index - args.length);
    case "Abs":
      return updateAbs(term, substBoundsAt(args, level + 1, term.body));
    case "App":
      return updateApp(
        term,
        substBoundsAt(args, level, term.fun),
        substBoundsAt(args, level, term.arg),
      );
    default:
      return term;
  }
};

export const substBounds = (args: readonly Term[], body: Term) =>
  args.length === 0 ? body : substBoundsAt(args, 0, body);

export const substBound = (arg: Term, body: Term) => substBounds([arg], body);

export const betapply = (fun: Term, arg: Term) =>
  fun.kind === "Abs" ? substBound(arg, fun.body) : mkApp(fun, arg);

export const betapplys = (fun: Term, args: readonly Term[]) =>
  args.reduce((result, arg) => betapply(result, arg), fun);

export const aconv = (left: Term, right: Term): boolean => {
  if (left === right) return true;
  switch (left.kind) {
    case "App":
      return right.kind === "App" && aconv(left.fun, right.fun) && aconv(left.arg, right.arg);
    case "Abs":
      return right.kind === "Abs" && aconv(left.body, right.body) && eqTyp(left.type, right.type);
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
  }
};

// Structural equality including the names of abstractions, ML's (op =) on terms.
export const eqTerm = (left: Term, right: Term): boolean => {
  if (left === right) return true;
  switch (left.kind) {
    case "App":
      return right.kind === "App" && eqTerm(left.fun, right.fun) && eqTerm(left.arg, right.arg);
    case "Abs":
      return (
        right.kind === "Abs" &&
        left.name === right.name &&
        eqTyp(left.type, right.type) &&
        eqTerm(left.body, right.body)
      );
    default:
      return aconv(left, right);
  }
};

// could_unify: a fast filter, false only if the normal terms can't unify.
const matchRands = (left: Term, right: Term): boolean => {
  let currentLeft = left;
  let currentRight = right;
  while (currentLeft.kind === "App" && currentRight.kind === "App") {
    if (!couldUnify(currentLeft.arg, currentRight.arg)) return false;
    currentLeft = currentLeft.fun;
    currentRight = currentRight.fun;
  }
  return true;
};

export const couldUnify = (left: Term, right: Term): boolean => {
  const leftHead = headOf(left);
  const rightHead = headOf(right);
  if (rightHead.kind === "Var" || leftHead.kind === "Var") return true;
  if (leftHead.kind === "Abs" || rightHead.kind === "Abs") return true;
  if (leftHead.kind === "Const" && rightHead.kind === "Const")
    return leftHead.name === rightHead.name && matchRands(left, right);
  if (leftHead.kind === "Free" && rightHead.kind === "Free")
    return leftHead.name === rightHead.name && matchRands(left, right);
  if (leftHead.kind === "Bound" && rightHead.kind === "Bound")
    return leftHead.index === rightHead.index && matchRands(left, right);
  return false;
};

// abstract_over: replaces the occurrences of pattern with Bound, ready to become an Abs body.
const abstractAt = (pattern: Term, level: number, term: Term): Term => {
  if (!mayOccur(pattern, term)) return term;
  if (aconv(pattern, term)) return mkBound(level);
  switch (term.kind) {
    case "Abs":
      return updateAbs(term, abstractAt(pattern, level + 1, term.body));
    case "App":
      return updateApp(
        term,
        abstractAt(pattern, level, term.fun),
        abstractAt(pattern, level, term.arg),
      );
    default:
      return term;
  }
};

export const abstractOver = (pattern: Term, body: Term) => abstractAt(pattern, 0, body);

const baseName = (name: string) => name.slice(name.lastIndexOf(".") + 1);

export const termName = (term: Term) =>
  term.kind === "Const"
    ? baseName(term.name)
    : term.kind === "Free" || term.kind === "Var"
      ? term.name
      : "uu";

export const lambdaName = (name: string, variable: Term, body: Term) =>
  mkAbs(name === "" ? termName(variable) : name, fastypeOf(variable), abstractOver(variable, body));

export const lambda = (variable: Term, body: Term) => lambdaName("", variable, body);

export const absfree = (name: string, type: Typ, body: Term) =>
  mkAbs(name, type, abstractOver(mkFree(name, type), body));

export const mapTypes = (mapType: (type: Typ) => Typ, term: Term): Term => {
  const visit = (current: Term): Term => {
    switch (current.kind) {
      case "Const":
      case "Free": {
        const type = mapType(current.type);
        return type === current.type ? current : { ...current, type };
      }
      case "Var": {
        const type = mapType(current.type);
        return type === current.type ? current : { ...current, type };
      }
      case "Bound":
        return current;
      case "Abs":
        return updateAbs(current, visit(current.body), mapType(current.type));
      case "App":
        return updateApp(current, visit(current.fun), visit(current.arg));
    }
  };
  return visit(term);
};

export const mapAtyps = (mapAtyp: (type: Typ) => Typ, type: Typ): Typ => {
  if (type.kind !== "Type") return mapAtyp(type);
  const args = type.args.map((arg) => mapAtyps(mapAtyp, arg));
  return args.every((arg, index) => arg === type.args[index]) ? type : mkType(type.name, args);
};

export const mapAterms = (mapAterm: (term: Term) => Term, term: Term): Term => {
  switch (term.kind) {
    case "Abs":
      return updateAbs(term, mapAterms(mapAterm, term.body));
    case "App":
      return updateApp(term, mapAterms(mapAterm, term.fun), mapAterms(mapAterm, term.arg));
    default:
      return mapAterm(term);
  }
};

export const foldAterms = <State>(
  visit: (term: Term, state: State) => State,
  term: Term,
  state: State,
): State => {
  switch (term.kind) {
    case "App":
      return foldAterms(visit, term.arg, foldAterms(visit, term.fun, state));
    case "Abs":
      return foldAterms(visit, term.body, state);
    default:
      return visit(term, state);
  }
};

// fold_aterms over the schematic variables only, skipping the subterms without one.
export const foldVars = <State>(
  visit: (variable: Var, state: State) => State,
  term: Term,
  state: State,
): State => {
  if ((flagsOf(term) & HAS_VAR) === 0) return state;
  switch (term.kind) {
    case "App":
      return foldVars(visit, term.arg, foldVars(visit, term.fun, state));
    case "Abs":
      return foldVars(visit, term.body, state);
    case "Var":
      return visit(term, state);
    default:
      return state;
  }
};

export const foldAtyps = <State>(
  visit: (type: Typ, state: State) => State,
  type: Typ,
  state: State,
): State =>
  type.kind === "Type"
    ? type.args.reduce((result, arg) => foldAtyps(visit, arg, result), state)
    : visit(type, state);

export const foldTypes = <State>(
  visit: (type: Typ, state: State) => State,
  term: Term,
  state: State,
): State => {
  switch (term.kind) {
    case "Const":
    case "Free":
    case "Var":
      return visit(term.type, state);
    case "Bound":
      return state;
    case "Abs":
      return foldTypes(visit, term.body, visit(term.type, state));
    case "App":
      return foldTypes(visit, term.arg, foldTypes(visit, term.fun, state));
  }
};

export const existsSubterm = (predicate: (term: Term) => boolean, term: Term): boolean => {
  if (predicate(term)) return true;
  if (term.kind === "App")
    return existsSubterm(predicate, term.fun) || existsSubterm(predicate, term.arg);
  if (term.kind === "Abs") return existsSubterm(predicate, term.body);
  return false;
};

export const existsSubtype = (predicate: (type: Typ) => boolean, type: Typ): boolean =>
  predicate(type) ||
  (type.kind === "Type" && type.args.some((arg) => existsSubtype(predicate, arg)));

export const existsType = (predicate: (type: Typ) => boolean, term: Term): boolean => {
  switch (term.kind) {
    case "Const":
    case "Free":
    case "Var":
      return predicate(term.type);
    case "Bound":
      return false;
    case "Abs":
      return predicate(term.type) || existsType(predicate, term.body);
    case "App":
      return existsType(predicate, term.fun) || existsType(predicate, term.arg);
  }
};

export const eqIndexname = (left: Indexname, right: Indexname) =>
  left.index === right.index && left.name === right.name;

const sameVar = (left: Var, right: Var) =>
  left.name === right.name && left.index === right.index && eqTyp(left.type, right.type);

// add_vars: the schematic variables, latest first, as Isabelle's insert builds the list.
export const addVars = (term: Term, vars: Var[]): Var[] =>
  foldVars(
    (current, result: Var[]) =>
      !result.some((other) => sameVar(other, current)) ? [current, ...result] : result,
    term,
    vars,
  );

export const addTVarsT = (type: Typ, tvars: TVar[]): TVar[] =>
  foldAtyps(
    (current, result: TVar[]) =>
      current.kind === "TVar" &&
      !result.some(
        (other) =>
          other.name === current.name &&
          other.index === current.index &&
          eqSort(other.sort, current.sort),
      )
        ? [current, ...result]
        : result,
    type,
    tvars,
  );

export const addTVars = (term: Term, tvars: TVar[]) =>
  foldTypes((type, result: TVar[]) => addTVarsT(type, result), term, tvars);

export const addFreeNames = (term: Term, names: string[]): string[] =>
  foldAterms(
    (current, result: string[]) =>
      current.kind === "Free" && !result.includes(current.name)
        ? [current.name, ...result]
        : result,
    term,
    names,
  );

export const addFrees = (term: Term, frees: Term[]): Term[] =>
  foldAterms(
    (current, result: Term[]) =>
      current.kind === "Free" && !result.some((other) => aconv(other, current))
        ? [current, ...result]
        : result,
    term,
    frees,
  );

export const addTFreeNames = (term: Term, names: string[]): string[] =>
  foldTypes(
    (type, result: string[]) =>
      foldAtyps(
        (current, inner: string[]) =>
          current.kind === "TFree" && !inner.includes(current.name)
            ? [current.name, ...inner]
            : inner,
        type,
        result,
      ),
    term,
    names,
  );

export const isSchematic = (term: Term) => maxidxOfTerm(term) >= 0;

// match_bvs: the pairs of corresponding abstraction names while two terms look alike.
export const matchBvs = (
  left: Term,
  right: Term,
  pairs: [string, string][],
): [string, string][] => {
  if (left.kind === "Abs" && right.kind === "Abs") {
    const added: [string, string][] =
      left.name !== "" && right.name !== "" ? [[left.name, right.name], ...pairs] : pairs;
    return matchBvs(left.body, right.body, added);
  }
  if (left.kind === "App" && right.kind === "App")
    return matchBvs(left.fun, right.fun, matchBvs(left.arg, right.arg, pairs));
  return pairs;
};

export const matchBvars = (left: Term, right: Term, pairs: [string, string][]) =>
  matchBvs(stripAbsBody(left), stripAbsBody(right), pairs);

export const mapAbsVars = (rename: (name: string) => string, term: Term): Term => {
  switch (term.kind) {
    case "Abs": {
      const name = rename(term.name);
      const body = mapAbsVars(rename, term.body);
      return name === term.name ? updateAbs(term, body) : mkAbs(name, term.type, body);
    }
    case "App":
      return updateApp(term, mapAbsVars(rename, term.fun), mapAbsVars(rename, term.arg));
    default:
      return term;
  }
};

// rename_abs: renames the abstractions of term after those of obj where pat matches obj.
export const renameAbs = (pattern: Term, object: Term, term: Term): Term | undefined => {
  const renaming = new Map<string, string>();
  matchBvs(pattern, object, []).forEach(([from, to]) => {
    if (!renaming.has(from)) renaming.set(from, to);
  });
  if ([...renaming].every(([from, to]) => from === to)) return undefined;
  const renamed = mapAbsVars((name) => renaming.get(name) ?? name, term);
  return renamed === term ? undefined : renamed;
};

// subst_free: replaces subterms by the first pair whose left side they equal.
export const substFree = (pairs: readonly [Term, Term][], term: Term): Term => {
  if (pairs.length === 0) return term;
  const visit = (current: Term): Term => {
    const pair = pairs.find(([from]) => aconv(from, current));
    if (pair) return pair[1];
    if (current.kind === "Abs") return updateAbs(current, visit(current.body));
    if (current.kind === "App") return updateApp(current, visit(current.fun), visit(current.arg));
    return current;
  };
  return visit(term);
};
