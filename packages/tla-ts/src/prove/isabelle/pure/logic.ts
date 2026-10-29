// Ported from Isabelle2025's Pure/logic.ML, the abstract syntax of the meta logic. Copyright (c)
// 1986-2025 University of Cambridge, Technische Universitaet Muenchen, and contributors, see
// LICENSE.

import { TlaIsabelleError } from "../../../errors";
import { makeNameContext, variantList, variantNames } from "./name";
import {
  addFreeNames,
  fastypeOf,
  funT,
  funTs,
  incrBoundvars,
  isDependent,
  abstractOver,
  termName,
  mapAtyps,
  mkAbs,
  mkApp,
  mkBound,
  mkConst,
  mkFree,
  mkTVar,
  mkVar,
  propT,
  substBounds,
  type Term,
  type Typ,
} from "./term";

export interface Binder {
  readonly name: string;
  readonly type: Typ;
}

export const allConst = (type: Typ) => mkConst("Pure.all", funT(funT(type, propT), propT));

export const isAll = (term: Term) =>
  term.kind === "App" &&
  term.fun.kind === "Const" &&
  term.fun.name === "Pure.all" &&
  term.arg.kind === "Abs";

export const listAll = (vars: readonly Binder[], body: Term): Term =>
  vars.reduceRight<Term>(
    (result, variable) =>
      mkApp(allConst(variable.type), mkAbs(variable.name, variable.type, result)),
    body,
  );

// Logic.dependent_all_name
export const dependentAllName = (name: string, variable: Term, body: Term) => {
  const abstracted = abstractOver(variable, body);
  const type = fastypeOf(variable);
  return isDependent(abstracted)
    ? mkApp(allConst(type), mkAbs(name === "" ? termName(variable) : name, type, abstracted))
    : body;
};

export const mkEquals = (left: Term, right: Term) => {
  const type = fastypeOf(left);
  return mkApp(mkApp(mkConst("Pure.eq", funTs([type, type], propT)), left), right);
};

const isConstApp2 = (
  term: Term,
  name: string,
): term is Extract<Term, { kind: "App" }> & {
  fun: Extract<Term, { kind: "App" }>;
} =>
  term.kind === "App" &&
  term.fun.kind === "App" &&
  term.fun.fun.kind === "Const" &&
  term.fun.fun.name === name;

export const isEquals = (term: Term) => isConstApp2(term, "Pure.eq");

export const destEquals = (term: Term): [Term, Term] => {
  if (!isConstApp2(term, "Pure.eq")) throw new TlaIsabelleError("TERM", "dest_equals");
  return [term.fun.arg, term.arg];
};

export const implies = mkConst("Pure.imp", funTs([propT, propT], propT));

export const mkImplies = (premise: Term, conclusion: Term) =>
  mkApp(mkApp(implies, premise), conclusion);

export const isImplies = (term: Term) => isConstApp2(term, "Pure.imp");

export const destImplies = (term: Term): [Term, Term] => {
  if (!isConstApp2(term, "Pure.imp")) throw new TlaIsabelleError("TERM", "dest_implies");
  return [term.fun.arg, term.arg];
};

export const listImplies = (premises: readonly Term[], conclusion: Term) =>
  premises.reduceRight((result, premise) => mkImplies(premise, result), conclusion);

export const stripImpPrems = (term: Term): Term[] => {
  const premises: Term[] = [];
  let current = term;
  while (isConstApp2(current, "Pure.imp")) {
    premises.push(current.fun.arg);
    current = current.arg;
  }
  return premises;
};

export const stripImpConcl = (term: Term): Term => {
  let current = term;
  while (isConstApp2(current, "Pure.imp")) current = current.arg;
  return current;
};

// Logic.strip_prems: removes count premises, returning them reversed onto premises.
export const stripPrems = (
  count: number,
  premises: readonly Term[],
  term: Term,
): [Term[], Term] => {
  if (count === 0) return [[...premises], term];
  if (!isConstApp2(term, "Pure.imp")) throw new TlaIsabelleError("TERM", "strip_prems");
  return stripPrems(count - 1, [term.fun.arg, ...premises], term.arg);
};

export const countPrems = (term: Term) => stripImpPrems(term).length;

export const nthPrem = (index: number, term: Term): Term => {
  const premise = stripImpPrems(term)[index - 1];
  if (index < 1 || premise === undefined) throw new TlaIsabelleError("TERM", "nth_prem");
  return premise;
};

export const protectConst = mkConst("Pure.prop", funT(propT, propT));

export const protect = (term: Term) => mkApp(protectConst, term);

export const isProtected = (term: Term) =>
  term.kind === "App" && term.fun.kind === "Const" && term.fun.name === "Pure.prop";

export const unprotect = (term: Term) => {
  if (term.kind !== "App" || term.fun.kind !== "Const" || term.fun.name !== "Pure.prop")
    throw new TlaIsabelleError("TERM", "unprotect");
  return term.arg;
};

export const mkTerm = (term: Term) =>
  mkApp(mkConst("Pure.term", funT(fastypeOf(term), propT)), term);

// Logic.combound: term(Bound (start+count-1), ..., Bound start).
export const combound = (term: Term, start: number, count: number): Term =>
  count > 0 ? mkApp(combound(term, start + 1, count - 1), mkBound(start)) : term;

// Logic.rlist_abs: ([xn, ..., x1], body) to %x1 ... xn. body.
export const rlistAbs = (binders: readonly Binder[], body: Term) =>
  binders.reduce((result, binder) => mkAbs(binder.name, binder.type, result), body);

const incrTVar = (increment: number, type: Typ) =>
  increment === 0
    ? type
    : mapAtyps(
        (atom) =>
          atom.kind === "TVar" ? mkTVar(atom.name, atom.index + increment, atom.sort) : atom,
        type,
      );

// Logic.incr_indexes_operation: lifts the variables over the types and increments their indexes.
export const incrIndexesFixed = (
  fixed: readonly string[],
  types: readonly Typ[],
  increment: number,
  level: number,
  term: Term,
): Term => {
  if (fixed.length === 0 && types.length === 0 && increment === 0) return term;
  const count = types.length;
  const incr = (depth: number, current: Term): Term => {
    switch (current.kind) {
      case "Var":
        return combound(
          mkVar(
            current.name,
            current.index + increment,
            funTs(types, incrTVar(increment, current.type)),
          ),
          depth,
          count,
        );
      case "Free":
        return fixed.includes(current.name)
          ? combound(
              mkFree(current.name, funTs(types, incrTVar(increment, current.type))),
              depth,
              count,
            )
          : mkFree(current.name, incrTVar(increment, current.type));
      case "Abs":
        return mkAbs(
          current.name,
          incrTVar(increment, current.type),
          incr(depth + 1, current.body),
        );
      case "App":
        return mkApp(incr(depth, current.fun), incr(depth, current.arg));
      case "Const":
        return mkConst(current.name, incrTVar(increment, current.type));
      case "Bound":
        return current;
    }
  };
  return incr(level, term);
};

export const incrIndexes = (types: readonly Typ[], increment: number, term: Term) =>
  incrIndexesFixed([], types, increment, 0, term);

const isAllAbs = (
  term: Term,
): term is Extract<Term, { kind: "App" }> & {
  arg: Extract<Term, { kind: "Abs" }>;
} =>
  term.kind === "App" &&
  term.fun.kind === "Const" &&
  term.fun.name === "Pure.all" &&
  term.arg.kind === "Abs";

// Logic.lift_abs: lifts a term over the parameters of a goal.
export const liftAbs = (increment: number, goal: Term, term: Term): Term => {
  const lift = (types: Typ[], current: Term): Term => {
    if (isConstApp2(current, "Pure.imp")) return lift(types, current.arg);
    if (isAllAbs(current))
      return mkAbs(
        current.arg.name,
        current.arg.type,
        lift([current.arg.type, ...types], current.arg.body),
      );
    return incrIndexes([...types].reverse(), increment, term);
  };
  return lift([], goal);
};

// Logic.lift_all: lifts a proposition over the parameters and premises of a goal.
export const liftAll = (increment: number, goal: Term, term: Term): Term => {
  const lift = (types: Typ[], current: Term): Term => {
    if (isConstApp2(current, "Pure.imp"))
      return mkApp(mkApp(current.fun.fun, current.fun.arg), lift(types, current.arg));
    if (isAllAbs(current))
      return mkApp(
        current.fun,
        mkAbs(
          current.arg.name,
          current.arg.type,
          lift([current.arg.type, ...types], current.arg.body),
        ),
      );
    return incrIndexes([...types].reverse(), increment, term);
  };
  return lift([], goal);
};

export const stripAssumsHyp = (term: Term): Term[] => {
  let hyps: Term[] = [];
  let current = term;
  for (;;) {
    if (isConstApp2(current, "Pure.imp")) {
      hyps = [current.fun.arg, ...hyps];
      current = current.arg;
    } else if (isAllAbs(current)) {
      hyps = hyps.map((hyp) => incrBoundvars(1, hyp));
      current = current.arg.body;
    } else return hyps.reverse();
  }
};

export const stripAssumsConcl = (term: Term): Term => {
  let current = term;
  for (;;) {
    if (isConstApp2(current, "Pure.imp")) current = current.arg;
    else if (isAllAbs(current)) current = current.arg.body;
    else return current;
  }
};

export const stripParams = (term: Term): Binder[] => {
  const params: Binder[] = [];
  let current = term;
  for (;;) {
    if (isConstApp2(current, "Pure.imp")) current = current.arg;
    else if (isAllAbs(current)) {
      params.push({ name: current.arg.name, type: current.arg.type });
      current = current.arg.body;
    } else return params;
  }
};

const isMeta = (term: Term) =>
  isConstApp2(term, "Pure.eq") ||
  isConstApp2(term, "Pure.imp") ||
  (term.kind === "App" && term.fun.kind === "Const" && term.fun.name === "Pure.all");

export const hasMetaPrems = (term: Term): boolean => {
  if (isConstApp2(term, "Pure.imp")) return isMeta(term.fun.arg) || hasMetaPrems(term.arg);
  if (isAllAbs(term)) return hasMetaPrems(term.arg.body);
  return false;
};

// Logic.remove_params: drops count parameters and premise number index.
const removeParams = (count: number, index: number, term: Term): Term => {
  if (count === 0 && index <= 0) return term;
  if (isConstApp2(term, "Pure.imp"))
    return index === 1
      ? removeParams(count, index - 1, term.arg)
      : mkImplies(incrBoundvars(count, term.fun.arg), removeParams(count, index - 1, term.arg));
  if (isAllAbs(term)) return removeParams(count - 1, index, term.arg.body);
  if (index > 0) throw new TlaIsabelleError("TERM", "remove_params");
  return term;
};

// Logic.flatten_params: moves all parameters to the front, renaming them apart.
export const flattenParams = (index: number, term: Term) => {
  const params = stripParams(term);
  const names = variantList(
    [],
    params.map((param) => param.name),
  );
  const vars = params.map((param, position) => ({ name: names[position], type: param.type }));
  return listAll(vars, removeParams(vars.length, index, term));
};

export const listRenameParams = (names: readonly string[], term: Term): Term => {
  if (isConstApp2(term, "Pure.imp"))
    return mkImplies(term.fun.arg, listRenameParams(names, term.arg));
  if (names.length > 0 && isAllAbs(term))
    return mkApp(
      term.fun,
      mkAbs(names[0], term.arg.type, listRenameParams(names.slice(1), term.arg.body)),
    );
  return term;
};

// Logic.strip_assums_imp: strips at most count premises.
const stripAssumsImp = (count: number, hyps: Term[], term: Term): [Term[], Term] => {
  if (count === 0) return [hyps, term];
  if (isConstApp2(term, "Pure.imp"))
    return stripAssumsImp(count - 1, [term.fun.arg, ...hyps], term.arg);
  return [hyps, term];
};

const stripAssumsAll = (params: Binder[], term: Term): [Binder[], Term] =>
  isAllAbs(term)
    ? stripAssumsAll([{ name: term.arg.name, type: term.arg.type }, ...params], term.arg.body)
    : [params, term];

// Logic.assum_pairs: the disagreement pairs, one for each assumption of the lifted premise.
export const assumPairs = (count: number, term: Term): [Term, Term][] => {
  const [params, body] = stripAssumsAll([], term);
  const [hyps, conclusion] = stripAssumsImp(count, [], body);
  const target = rlistAbs(params, conclusion);
  return [...hyps].reverse().map((hyp): [Term, Term] => [rlistAbs(params, hyp), target]);
};

export interface AssumProblems {
  readonly abstract: (term: Term) => Term;
  readonly hyps: Term[];
  readonly conclusion: Term;
}

export const assumProblems = (count: number, term: Term): AssumProblems => {
  const [params, body] = stripAssumsAll([], term);
  const [hyps, conclusion] = stripAssumsImp(count, [], body);
  return { abstract: (inner) => rlistAbs(params, inner), hyps: [...hyps].reverse(), conclusion };
};

// Logic.goal_params
export const goalParams = (state: Term, index: number): [Term, Term[]] => {
  const goal = nthPrem(index, state);
  const params = stripParams(goal);
  const names = variantNames(
    params.map((param) => param.name),
    makeNameContext(addFreeNames(goal, [])),
  );
  return [goal, params.map((param, position) => mkFree(names[position], param.type)).reverse()];
};

export const conclOfGoal = (state: Term, index: number) => {
  const [goal, frees] = goalParams(state, index);
  return substBounds(frees, stripAssumsConcl(goal));
};

export const premsOfGoal = (state: Term, index: number) => {
  const [goal, frees] = goalParams(state, index);
  return stripAssumsHyp(goal).map((hyp) => substBounds(frees, hyp));
};
