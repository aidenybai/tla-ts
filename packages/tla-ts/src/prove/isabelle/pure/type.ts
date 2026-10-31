// Ported from Isabelle2025's Pure/type.ML, the matching and unification of types. Copyright (c)
// 1986-2025 University of Cambridge, Technische Universitaet Muenchen, and contributors, see
// LICENSE.
//
// Every type variable of Isabelle/TLA+ has the empty sort, so the order-sorted unification of
// Type.unify never meets a sort constraint and coincides with Type.raw_unify.

import { TlaIsabelleError } from "../../../errors";
import {
  emptyTable,
  fastIndexnameOrd,
  lookupTable,
  updateTable,
  hasKey,
  isEmptyTable,
  type IndexKey,
  type Table,
} from "./table";
import { eqTyp, mkType, type Typ } from "./term";

export type TyEnv = Table<IndexKey, Typ>;

export const emptyTyEnv: TyEnv = emptyTable(fastIndexnameOrd);

export const lookupTyEnv = (tyenv: TyEnv, name: IndexKey) => lookupTable(tyenv, name);

// Type.devar: chases the assignments of a type variable.
export const devar = (tyenv: TyEnv, type: Typ): Typ => {
  let current = type;
  while (current.kind === "TVar") {
    const assigned = lookupTable(tyenv, current);
    if (assigned === undefined) return current;
    current = assigned;
  }
  return current;
};

const occurs = (name: IndexKey, tyenv: TyEnv, type: Typ): boolean => {
  if (type.kind === "Type") return type.args.some((arg) => occurs(name, tyenv, arg));
  if (type.kind === "TFree") return false;
  if (type.index === name.index && type.name === name.name) return true;
  const assigned = lookupTable(tyenv, type);
  return assigned !== undefined && occurs(name, tyenv, assigned);
};

const updateNew = (tyenv: TyEnv, name: IndexKey, type: Typ): TyEnv => {
  if (hasKey(tyenv, name)) throw new TlaIsabelleError("TYPE", "Type.unify: duplicate assignment");
  return updateTable(tyenv, { name: name.name, index: name.index }, type);
};

// Type.unify: undefined where Isabelle raises TUNIFY.
export const unifyTypes = (left: Typ, right: Typ, tyenv: TyEnv): TyEnv | undefined => {
  const leftType = devar(tyenv, left);
  const rightType = devar(tyenv, right);
  if (leftType.kind === "TVar" && rightType.kind === "TVar") {
    if (leftType.index === rightType.index && leftType.name === rightType.name) return tyenv;
    return updateNew(tyenv, rightType, leftType);
  }
  if (leftType.kind === "TVar")
    return occurs(leftType, tyenv, rightType) ? undefined : updateNew(tyenv, leftType, rightType);
  if (rightType.kind === "TVar")
    return occurs(rightType, tyenv, leftType) ? undefined : updateNew(tyenv, rightType, leftType);
  if (leftType.kind === "Type" && rightType.kind === "Type") {
    if (leftType.name !== rightType.name) return undefined;
    return leftType.args.reduce<TyEnv | undefined>(
      (result, arg, index) =>
        result === undefined ? undefined : unifyTypes(arg, rightType.args[index], result),
      tyenv,
    );
  }
  return eqTyp(leftType, rightType) ? tyenv : undefined;
};

// Type.raw_match: undefined where Isabelle raises TYPE_MATCH.
export const matchTypes = (pattern: Typ, object: Typ, tyenv: TyEnv): TyEnv | undefined => {
  if (pattern.kind === "TVar") {
    const assigned = lookupTable(tyenv, pattern);
    if (assigned === undefined) return updateNew(tyenv, pattern, object);
    return eqTyp(assigned, object) ? tyenv : undefined;
  }
  if (pattern.kind === "Type") {
    if (object.kind !== "Type" || pattern.name !== object.name) return undefined;
    if (pattern.args.length !== object.args.length) return undefined;
    return pattern.args.reduce<TyEnv | undefined>(
      (result, arg, index) =>
        result === undefined ? undefined : matchTypes(arg, object.args[index], result),
      tyenv,
    );
  }
  return object.kind === "TFree" && object.name === pattern.name ? tyenv : undefined;
};

// Type.could_unify
export const couldUnifyTypes = (left: Typ, right: Typ): boolean => {
  if (left.kind === "TVar" || right.kind === "TVar") return true;
  if (left.kind === "Type" && right.kind === "Type")
    return (
      left.name === right.name &&
      left.args.length === right.args.length &&
      left.args.every((arg, index) => couldUnifyTypes(arg, right.args[index]))
    );
  return left.kind === "TFree" && right.kind === "TFree" && left.name === right.name;
};

// Envir.norm_type: instantiates the assigned type variables, chasing chains.
export const normType = (tyenv: TyEnv, type: Typ): Typ => {
  if (type.kind === "TFree") return type;
  if (type.kind === "TVar") {
    const assigned = lookupTable(tyenv, type);
    return assigned === undefined ? type : normType(tyenv, assigned);
  }
  const args = type.args.map((arg) => normType(tyenv, arg));
  return args.every((arg, index) => arg === type.args[index]) ? type : mkType(type.name, args);
};

// Envir.subst_type: instantiates without chasing.
export const substType = (tyenv: TyEnv, type: Typ): Typ => {
  if (type.kind === "TFree") return type;
  if (type.kind === "TVar") return lookupTable(tyenv, type) ?? type;
  const args = type.args.map((arg) => substType(tyenv, arg));
  return args.every((arg, index) => arg === type.args[index]) ? type : mkType(type.name, args);
};

// Type.unified: equality modulo the environment. Isabelle2025 compares each argument with itself,
// so arguments never differ.
export const unifiedTypes = (tyenv: TyEnv, left: Typ, right: Typ): boolean => {
  if (isEmptyTable(tyenv)) return eqTyp(left, right);
  const leftType = devar(tyenv, left);
  const rightType = devar(tyenv, right);
  if (leftType.kind === "Type" && rightType.kind === "Type")
    return leftType.name === rightType.name && leftType.args.length === rightType.args.length;
  return eqTyp(leftType, rightType);
};
