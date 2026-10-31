// Ported from Isabelle2025's Pure/envir.ML. Copyright (c) 1986-2025 University of Cambridge,
// Technische Universitaet Muenchen, and contributors, see LICENSE.
//
// Environments of assignments to schematic variables, and beta and eta normalization.

import { TlaIsabelleError } from "../../../errors";
import {
  emptyTable,
  fastIndexnameOrd,
  hasKey,
  isEmptyTable,
  lookupTable,
  minTable,
  indexnameOrd,
  updateTable,
  type IndexKey,
  type Table,
} from "./table";
import {
  binderTypes as plainBinderTypes,
  flagsOf,
  funT,
  HAS_ETA_REDEX,
  HAS_REDEX,
  HAS_VAR,
  isDependent,
  listComb,
  maxidxOfTerm,
  mkAbs,
  mkApp,
  mkBound,
  mkVar,
  substBound,
  updateAbs,
  updateApp,
  incrBoundvars,
  fastypeOf1,
  aconv,
  type Term,
  type Typ,
  type Var,
} from "./term";
import { devar, emptyTyEnv, normType, substType, unifiedTypes, type TyEnv } from "./type";

export interface Binding {
  readonly type: Typ;
  readonly term: Term;
}

export type TEnv = Table<IndexKey, Binding>;

export interface Envir {
  readonly maxidx: number;
  readonly tenv: TEnv;
  readonly tyenv: TyEnv;
}

export const emptyTEnv: TEnv = emptyTable(fastIndexnameOrd);

export const emptyEnvir = (maxidx: number): Envir => ({
  maxidx,
  tenv: emptyTEnv,
  tyenv: emptyTyEnv,
});

export const initEnvir = emptyEnvir(-1);

export const isEmptyEnvir = (envir: Envir) => isEmptyTable(envir.tenv) && isEmptyTable(envir.tyenv);

// radixstring (26, "a", n)
const radixString = (value: number): string => {
  const digits: number[] = [];
  let remaining = value;
  do {
    digits.unshift(remaining % 26);
    remaining = Math.floor(remaining / 26);
  } while (remaining > 0);
  return digits.map((digit) => String.fromCharCode(97 + digit)).join("");
};

// Envir.genvars: fresh variables with an index above every present one.
export const genvars = (name: string, envir: Envir, types: readonly Typ[]): [Envir, Var[]] => {
  const index = envir.maxidx + 1;
  const vars = types.map((type, position) =>
    mkVar(types.length === 1 ? name : name + radixString(position), index, type),
  );
  return [{ ...envir, maxidx: index }, vars];
};

export const genvar = (name: string, envir: Envir, type: Typ): [Envir, Var] => {
  const [updated, vars] = genvars(name, envir, [type]);
  return [updated, vars[0]];
};

// Envir.lookup1: lookup without chasing type assignments, for environments from matching.
export const lookup1 = (tenv: TEnv, variable: Var): Term | undefined => {
  const binding = lookupTable(tenv, variable);
  if (binding === undefined) return undefined;
  if (!eqTypExact(variable.type, binding.type))
    throw new TlaIsabelleError("TYPE", "Variable has two distinct types");
  return binding.term;
};

const eqTypExact = (left: Typ, right: Typ) => unifiedTypes(emptyTyEnv, left, right);

export const lookup = (envir: Envir, variable: Var): Term | undefined => {
  const binding = lookupTable(envir.tenv, variable);
  if (binding === undefined) return undefined;
  if (!unifiedTypes(envir.tyenv, variable.type, binding.type))
    throw new TlaIsabelleError("TYPE", "Variable has two distinct types");
  return binding.term;
};

export const update = (variable: Var, term: Term, envir: Envir): Envir => {
  if (hasKey(envir.tenv, variable))
    throw new TlaIsabelleError("TERM", "Envir.update: duplicate assignment");
  return {
    ...envir,
    tenv: updateTable(
      envir.tenv,
      { name: variable.name, index: variable.index },
      { type: variable.type, term },
    ),
  };
};

// Envir.above: whether the least index updated exceeds limit.
export const above = (envir: Envir, limit: number) => {
  const term = minTable(envir.tenv);
  const type = minTable(envir.tyenv);
  return (
    (term === undefined || term[0].index > limit) && (type === undefined || type[0].index > limit)
  );
};

// Envir.vupdate: an assignment that suppresses higher indexes between variables.
export const vupdate = (variable: Var, term: Term, envir: Envir): Envir => {
  if (term.kind !== "Var") return update(variable, term, envir);
  if (variable.name === term.name && variable.index === term.index) return envir;
  if (indexnameOrd(variable, term) < 0) {
    const assigned = lookup(envir, term);
    return assigned === undefined
      ? update(term, mkVar(variable.name, variable.index, term.type), envir)
      : vupdate(variable, assigned, envir);
  }
  return update(variable, term, envir);
};

export const couldBetaContract = (term: Term) => (flagsOf(term) & HAS_REDEX) !== 0;

const normTerm1 = (tenv: TEnv, term: Term): Term => {
  if ((flagsOf(term) & (HAS_VAR | HAS_REDEX)) === 0) return term;
  switch (term.kind) {
    case "Var": {
      const assigned = lookup1(tenv, term);
      return assigned === undefined ? term : normTerm1(tenv, assigned);
    }
    case "Abs":
      return updateAbs(term, normTerm1(tenv, term.body));
    case "App": {
      if (term.fun.kind === "Abs") return normTerm1(tenv, substBound(term.arg, term.fun.body));
      const fun = normTerm1(tenv, term.fun);
      if (fun.kind === "Abs") return normTerm1(tenv, substBound(term.arg, fun.body));
      return updateApp(term, fun, normTerm1(tenv, term.arg));
    }
    default:
      return term;
  }
};

const normTerm2 = (envir: Envir, term: Term): Term => {
  if (maxidxOfTerm(term) < 0 && (flagsOf(term) & HAS_REDEX) === 0) return term;
  switch (term.kind) {
    case "Const":
    case "Free": {
      const type = normType(envir.tyenv, term.type);
      return type === term.type ? term : { ...term, type };
    }
    case "Var": {
      const assigned = lookup(envir, term);
      if (assigned !== undefined) return normTerm2(envir, assigned);
      const type = normType(envir.tyenv, term.type);
      return type === term.type ? term : { ...term, type };
    }
    case "Abs":
      return updateAbs(term, normTerm2(envir, term.body), normType(envir.tyenv, term.type));
    case "App": {
      if (term.fun.kind === "Abs") return normTerm2(envir, substBound(term.arg, term.fun.body));
      const fun = normTerm2(envir, term.fun);
      if (fun.kind === "Abs") return normTerm2(envir, substBound(term.arg, fun.body));
      return updateApp(term, fun, normTerm2(envir, term.arg));
    }
    default:
      return term;
  }
};

// Envir.norm_term: instantiates the environment and beta-normalizes.
export const normTerm = (envir: Envir, term: Term): Term => {
  if (isEmptyEnvir(envir) && !couldBetaContract(term)) return term;
  return isEmptyTable(envir.tyenv) ? normTerm1(envir.tenv, term) : normTerm2(envir, term);
};

export const betaNorm = (term: Term) => normTerm(initEnvir, term);

// Envir.head_norm: normalizes the head only, for unification.
export const headNorm = (envir: Envir, term: Term): Term => {
  if ((flagsOf(term) & (HAS_VAR | HAS_REDEX)) === 0) return term;
  switch (term.kind) {
    case "Var": {
      const assigned = lookup(envir, term);
      return assigned === undefined ? term : headNorm(envir, assigned);
    }
    case "Abs":
      return updateAbs(term, headNorm(envir, term.body));
    case "App": {
      if (term.fun.kind === "Abs") return headNorm(envir, substBound(term.arg, term.fun.body));
      const fun = headNorm(envir, term.fun);
      if (fun.kind === "Abs") return headNorm(envir, substBound(term.arg, fun.body));
      return fun === term.fun ? term : mkApp(fun, term.arg);
    }
    default:
      return term;
  }
};

export const etaLong = (types: readonly Typ[], term: Term): Term => {
  if (term.kind === "Abs")
    return mkAbs(term.name, term.type, etaLong([term.type, ...types], term.body));
  const [head, args] = stripCombLocal(term);
  if (head.kind === "Abs") return etaLong(types, betaNorm(term));
  const binders = plainBinderTypes(fastypeOf1(types, term));
  const count = binders.length;
  const inner = [...binders].reverse().concat(types);
  const long = (current: Term) => etaLong(inner, current);
  const body = listComb(incrBoundvars(count, head), [
    ...args.map((arg) => long(incrBoundvars(count, arg))),
    ...binders.map((_type, position) => long(mkBound(count - 1 - position))),
  ]);
  return binders.reduceRight((result, type) => mkAbs("x", type, result), body);
};

const stripCombLocal = (term: Term): [Term, Term[]] => {
  const args: Term[] = [];
  let current = term;
  while (current.kind === "App") {
    args.unshift(current.arg);
    current = current.fun;
  }
  return [current, args];
};

const decrementLoose = (term: Term, level: number): Term => {
  switch (term.kind) {
    case "Bound":
      return term.index >= level ? mkBound(term.index - 1) : term;
    case "Abs":
      return updateAbs(term, decrementLoose(term.body, level + 1));
    case "App":
      return updateApp(term, decrementLoose(term.fun, level), decrementLoose(term.arg, level));
    default:
      return term;
  }
};

export const couldEtaContract = (term: Term) => (flagsOf(term) & HAS_ETA_REDEX) !== 0;

const etaSame = (term: Term): Term => {
  if (!couldEtaContract(term)) return term;
  if (term.kind === "Abs") {
    const body = etaSame(term.body);
    if (body.kind === "App" && body.arg.kind === "Bound" && body.arg.index === 0) {
      if (isDependent(body.fun))
        return body === term.body ? term : mkAbs(term.name, term.type, body);
      return decrementLoose(body.fun, 0);
    }
    return body === term.body ? term : mkAbs(term.name, term.type, body);
  }
  if (term.kind === "App") return updateApp(term, etaSame(term.fun), etaSame(term.arg));
  return term;
};

// Envir.eta_contract
export const etaContract = (term: Term) => (couldEtaContract(term) ? etaSame(term) : term);

export const betaEtaContract = (term: Term) => etaContract(betaNorm(term));

export const aeconv = (left: Term, right: Term) =>
  aconv(left, right) || aconv(etaContract(left), etaContract(right));

export const envBodyType = (envir: Envir, type: Typ): Typ => {
  if (type.kind === "Type" && type.name === "fun") return envBodyType(envir, type.args[1]);
  if (type.kind === "TVar") {
    const assigned = lookupTable(envir.tyenv, type);
    return assigned === undefined ? type : envBodyType(envir, assigned);
  }
  return type;
};

export const envBinderTypes = (envir: Envir, type: Typ): Typ[] => {
  if (type.kind === "Type" && type.name === "fun")
    return [type.args[0], ...envBinderTypes(envir, type.args[1])];
  if (type.kind === "TVar") {
    const assigned = lookupTable(envir.tyenv, type);
    return assigned === undefined ? [] : envBinderTypes(envir, assigned);
  }
  return [];
};

// Envir.fastype: the type of a term, chasing type assignments at applications.
export const fastype = (envir: Envir, types: readonly Typ[], term: Term): Typ => {
  switch (term.kind) {
    case "App": {
      const type = devar(envir.tyenv, fastype(envir, types, term.fun));
      if (type.kind === "Type" && type.name === "fun") return type.args[1];
      throw new TlaIsabelleError("TYPE", "fastype: expected function type");
    }
    case "Bound": {
      const type = types[term.index];
      if (type === undefined) throw new TlaIsabelleError("TYPE", "fastype: Bound");
      return type;
    }
    case "Abs":
      return funT(term.type, fastype(envir, [term.type, ...types], term.body));
    default:
      return term.type;
  }
};

// Envir.subst_term: instantiates without chasing variables.
const substTermAux = (tyenv: TyEnv, tenv: TEnv, term: Term): Term => {
  if (maxidxOfTerm(term) < 0) return term;
  switch (term.kind) {
    case "Const":
    case "Free": {
      const type = isEmptyTable(tyenv) ? term.type : substType(tyenv, term.type);
      return type === term.type ? term : { ...term, type };
    }
    case "Var": {
      const assigned = lookup1(tenv, term);
      if (assigned !== undefined) return assigned;
      const type = isEmptyTable(tyenv) ? term.type : substType(tyenv, term.type);
      return type === term.type ? term : { ...term, type };
    }
    case "Bound":
      return term;
    case "Abs":
      return updateAbs(
        term,
        substTermAux(tyenv, tenv, term.body),
        isEmptyTable(tyenv) ? term.type : substType(tyenv, term.type),
      );
    case "App":
      return updateApp(
        term,
        substTermAux(tyenv, tenv, term.fun),
        substTermAux(tyenv, tenv, term.arg),
      );
  }
};

export const substTerm = (tyenv: TyEnv, tenv: TEnv, term: Term) =>
  isEmptyTable(tenv) && isEmptyTable(tyenv) ? term : substTermAux(tyenv, tenv, term);
