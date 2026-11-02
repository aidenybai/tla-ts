// Ported from Isabelle2025's Pure/thm.ML. Copyright (c) 1986-2025 University of Cambridge,
// Technische Universitaet Muenchen, and contributors, see LICENSE.
//
// The term operations behind Thm.bicompose, which builds the theorem itself in thm.ts.

import { TlaIsabelleError } from "../../../errors";
import { normTerm, type Envir } from "./envir";
import { allConst, mkImplies } from "./logic";
import { unifyTypesEnvir } from "./pattern";
import type { Thm } from "./thm";
import { normType } from "./type";
import { eqTyp, foldVars, matchBvars, mkAbs, mkApp, mkVar, type Term, type Typ } from "./term";
import type { Tpair } from "./unify";

const isImpApp = (
  term: Term,
): term is Extract<Term, { kind: "App" }> & { fun: Extract<Term, { kind: "App" }> } =>
  term.kind === "App" &&
  term.fun.kind === "App" &&
  term.fun.fun.kind === "Const" &&
  term.fun.fun.name === "Pure.imp";

const isAllApp = (
  term: Term,
): term is Extract<Term, { kind: "App" }> & { arg: Extract<Term, { kind: "Abs" }> } =>
  term.kind === "App" &&
  term.fun.kind === "Const" &&
  term.fun.name === "Pure.all" &&
  term.arg.kind === "Abs";

export const stripApply = (apply: (term: Term) => Term, lifted: Term, term: Term): Term => {
  if (isImpApp(lifted) && isImpApp(term))
    return mkApp(mkApp(lifted.fun.fun, term.fun.arg), stripApply(apply, lifted.arg, term.arg));
  if (isAllApp(lifted) && isAllApp(term))
    return mkApp(
      lifted.fun,
      mkAbs(term.arg.name, term.arg.type, stripApply(apply, lifted.arg.body, term.arg.body)),
    );
  return apply(term);
};

const stripLifted = (lifted: Term, term: Term): Term => {
  if (isImpApp(lifted) && isImpApp(term)) return stripLifted(lifted.arg, term.arg);
  if (isAllApp(lifted) && isAllApp(term)) return stripLifted(lifted.arg.body, term.arg.body);
  return term;
};

const addVarNames = (term: Term, names: Set<string>) =>
  foldVars((atom, result: Set<string>) => result.add(atom.name), term, names);

const makeDistinct = (pairs: readonly [string, string][]) => {
  const table = new Map<string, string>();
  for (const pair of pairs) if (!table.has(pair[0])) table.set(pair[0], pair[1]);
  return table;
};

// Thm.rename_bvars: renames bound variables and some unknowns of the new premises after the
// names in the disagreement pairs.
export const renameBvars = (
  dpairs: readonly Tpair[],
  tpairs: readonly Tpair[],
  lifted: Term,
  premises: readonly Term[],
): ((term: Term) => Term) | undefined => {
  const pairs = dpairs.reduceRight<[string, string][]>(
    (result, pair) => matchBvars(pair[0], pair[1], result),
    [],
  );
  if (pairs.length === 0) return undefined;
  const unknowns = new Set<string>();
  for (const pair of dpairs) addVarNames(pair[0], unknowns);
  for (const pair of tpairs) {
    addVarNames(pair[0], unknowns);
    addVarNames(pair[1], unknowns);
  }
  const premiseUnknowns = new Set<string>();
  for (const premise of premises) addVarNames(stripLifted(lifted, premise), premiseUnknowns);
  const filtered = pairs.filter(
    (pair) => premiseUnknowns.has(pair[0]) && !unknowns.has(pair[0]) && !unknowns.has(pair[1]),
  );
  const distinct = filtered.filter(
    (pair, position) => filtered.findIndex((other) => other[0] === pair[0]) === position,
  );
  const unchanged = new Set(
    [...premiseUnknowns].filter((name) => !distinct.some((pair) => pair[0] === name)),
  );
  const delClashing = (
    isClash: boolean,
    xs: Set<string>,
    ys: Set<string>,
    rest: readonly [string, string][],
    kept: [string, string][],
  ): [string, string][] => {
    if (rest.length === 0) return isClash ? delClashing(false, xs, new Set(xs), kept, []) : kept;
    const [pair, ...others] = rest;
    if (ys.has(pair[1]))
      return delClashing(true, new Set(xs).add(pair[0]), new Set(ys).add(pair[0]), others, kept);
    return delClashing(isClash, xs, new Set(ys).add(pair[1]), others, [pair, ...kept]);
  };
  const vars = makeDistinct(delClashing(false, unchanged, new Set(unchanged), distinct, []));
  const bounds = makeDistinct(pairs);
  if (
    [...vars].every((pair) => pair[0] === pair[1]) &&
    [...bounds].every((pair) => pair[0] === pair[1])
  )
    return undefined;
  const rename = (term: Term): Term => {
    switch (term.kind) {
      case "Var": {
        const name = vars.get(term.name) ?? term.name;
        return name === term.name ? term : mkVar(name, term.index, term.type);
      }
      case "Abs":
        return mkAbs(bounds.get(term.name) ?? term.name, term.type, rename(term.body));
      case "App":
        return mkApp(rename(term.fun), rename(term.arg));
      default:
        return term;
    }
  };
  return rename;
};

export const stripAssums2 = (lifted: Term, goal: Term): Tpair => {
  if (isImpApp(lifted) && isImpApp(goal)) return stripAssums2(lifted.arg, goal.arg);
  if (isAllApp(lifted) && isAllApp(goal)) {
    const [left, right] = stripAssums2(lifted.arg.body, goal.arg.body);
    return [
      mkAbs(lifted.arg.name, lifted.arg.type, left),
      mkAbs(lifted.arg.name, lifted.arg.type, right),
    ];
  }
  return [lifted, goal];
};

export const normTermSkip = (envir: Envir, count: number, term: Term): Term => {
  if (count === 0) return normTerm(envir, term);
  if (isAllApp(term)) {
    const type = normType(envir.tyenv, term.arg.type);
    return mkApp(
      allConst(type),
      mkAbs(term.arg.name, type, normTermSkip(envir, count, term.arg.body)),
    );
  }
  if (isImpApp(term)) return mkImplies(term.fun.arg, normTermSkip(envir, count - 1, term.arg));
  throw new TlaIsabelleError("ERROR", "norm_term_skip: too few assumptions??");
};

export const unifyVarTypes = (first: Thm, second: Thm, envir: Envir): Envir | undefined => {
  const vars = new Map<string, Typ[]>();
  const add = (term: Term) =>
    foldVars(
      (atom, result: Map<string, Typ[]>) => {
        const key = `${atom.index}:${atom.name}`;
        const types = result.get(key) ?? [];
        if (!types.some((type) => eqTyp(type, atom.type))) result.set(key, [atom.type, ...types]);
        return result;
      },
      term,
      vars,
    );
  for (const thm of [first, second]) {
    for (const pair of thm.tpairs) {
      add(pair[0]);
      add(pair[1]);
    }
    add(thm.prop);
  }
  let current: Envir | undefined = envir;
  for (const types of vars.values())
    for (const type of types.slice(1))
      current = current && unifyTypesEnvir(types[0], type, current);
  return current;
};
