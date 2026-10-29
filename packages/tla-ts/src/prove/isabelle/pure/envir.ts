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
  funT,
  isDependent,
  listComb,
  mkAbs,
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

export const couldBetaContract = (term: Term): boolean => {
  if (term.kind === "App")
    return term.fun.kind === "Abs" || couldBetaContract(term.fun) || couldBetaContract(term.arg);
  if (term.kind === "Abs") return couldBetaContract(term.body);
  return false;
};

const normTerm1 = (tenv: TEnv, term: Term): Term => {
  const norm = (current: Term): Term => {
    switch (current.kind) {
      case "Var": {
        const assigned = lookup1(tenv, current);
        return assigned === undefined ? current : norm(assigned);
      }
      case "Abs":
        return updateAbs(current, norm(current.body));
      case "App": {
        if (current.fun.kind === "Abs") return norm(substBound(current.arg, current.fun.body));
        const fun = norm(current.fun);
        if (fun.kind === "Abs") return norm(substBound(current.arg, fun.body));
        return updateApp(current, fun, norm(current.arg));
      }
      default:
        return current;
    }
  };
  return norm(term);
};

const normTerm2 = (envir: Envir, term: Term): Term => {
  const normT = (type: Typ) => normType(envir.tyenv, type);
  const norm = (current: Term): Term => {
    switch (current.kind) {
      case "Const":
      case "Free": {
        const type = normT(current.type);
        return type === current.type ? current : { ...current, type };
      }
      case "Var": {
        const assigned = lookup(envir, current);
        if (assigned !== undefined) return norm(assigned);
        const type = normT(current.type);
        return type === current.type ? current : { ...current, type };
      }
      case "Abs":
        return updateAbs(current, norm(current.body), normT(current.type));
      case "App": {
        if (current.fun.kind === "Abs") return norm(substBound(current.arg, current.fun.body));
        const fun = norm(current.fun);
        if (fun.kind === "Abs") return norm(substBound(current.arg, fun.body));
        return updateApp(current, fun, norm(current.arg));
      }
      default:
        return current;
    }
  };
  return norm(term);
};

// Envir.norm_term: instantiates the environment and beta-normalizes.
export const normTerm = (envir: Envir, term: Term): Term => {
  if (isEmptyEnvir(envir) && !couldBetaContract(term)) return term;
  return isEmptyTable(envir.tyenv) ? normTerm1(envir.tenv, term) : normTerm2(envir, term);
};

export const betaNorm = (term: Term) => normTerm(initEnvir, term);

// Envir.head_norm: normalizes the head only, for unification.
export const headNorm = (envir: Envir, term: Term): Term => {
  const norm = (current: Term): Term => {
    switch (current.kind) {
      case "Var": {
        const assigned = lookup(envir, current);
        return assigned === undefined ? current : headNorm(envir, assigned);
      }
      case "Abs":
        return updateAbs(current, norm(current.body));
      case "App": {
        if (current.fun.kind === "Abs") return norm(substBound(current.arg, current.fun.body));
        const fun = norm(current.fun);
        if (fun.kind === "Abs") return norm(substBound(current.arg, fun.body));
        return fun === current.fun ? current : { kind: "App", fun, arg: current.arg };
      }
      default:
        return current;
    }
  };
  return norm(term);
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

export const couldEtaContract = (term: Term): boolean => {
  if (term.kind === "Abs")
    return (
      (term.body.kind === "App" && term.body.arg.kind === "Bound" && term.body.arg.index === 0) ||
      couldEtaContract(term.body)
    );
  if (term.kind === "App") return couldEtaContract(term.fun) || couldEtaContract(term.arg);
  return false;
};

const etaSame = (term: Term): Term => {
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
export const substTerm = (tyenv: TyEnv, tenv: TEnv, term: Term): Term => {
  const substT = (type: Typ) => (isEmptyTable(tyenv) ? type : substType(tyenv, type));
  const visit = (current: Term): Term => {
    switch (current.kind) {
      case "Const":
      case "Free": {
        const type = substT(current.type);
        return type === current.type ? current : { ...current, type };
      }
      case "Var": {
        const assigned = lookup1(tenv, current);
        if (assigned !== undefined) return assigned;
        const type = substT(current.type);
        return type === current.type ? current : { ...current, type };
      }
      case "Bound":
        return current;
      case "Abs":
        return updateAbs(current, visit(current.body), substT(current.type));
      case "App":
        return updateApp(current, visit(current.fun), visit(current.arg));
    }
  };
  return isEmptyTable(tenv) && isEmptyTable(tyenv) ? term : visit(term);
};
