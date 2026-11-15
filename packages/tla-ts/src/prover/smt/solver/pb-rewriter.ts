// Ported from Z3 (src/ast/pb_decl_plugin.h, src/ast/pb_decl_plugin.cpp,
// src/ast/rewriter/pb_rewriter.cpp, src/ast/rewriter/pb_rewriter_def.h), MIT license, see
// z3-license.txt.
import {
  type AstManager,
  FAMILY_PB,
  OP_AT_LEAST_K,
  OP_AT_MOST_K,
  OP_PB_EQ,
  OP_PB_GE,
  OP_PB_LE,
  SORT_BOOL,
} from "./ast";
import { L_FALSE, L_TRUE, L_UNDEF } from "./lbool";
import { getGcd, getLcm, Rational } from "./rational";
import type { Rewrite } from "./rewriter-tpl";

const INT32_LIMIT = 2n ** 31n;

interface PbArg {
  expr: number;
  coeff: Rational;
}

export const isPb = (manager: AstManager, expr: number) => manager.getFamily(expr) === FAMILY_PB;

export const getPbK = (manager: AstManager, decl: number) => manager.getPbParameters(decl)[0];

export const getPbCoeff = (manager: AstManager, decl: number, index: number) => {
  const op = manager.funcDecls[decl].op;
  return op === OP_AT_MOST_K || op === OP_AT_LEAST_K
    ? Rational.one
    : manager.getPbParameters(decl)[index + 1];
};

export const hasUnitCoefficients = (manager: AstManager, decl: number) =>
  manager.funcDecls[decl].domain.every((_, index) =>
    getPbCoeff(manager, decl, index).equals(Rational.one),
  );

const isUnsigned = (value: Rational) =>
  value.isInt() && value.num >= 0n && value.num < 2n * INT32_LIMIT;

const isInt32 = (value: Rational) =>
  value.isInt() && value.num >= -INT32_LIMIT && value.num < INT32_LIMIT;

const mkPbApp = (manager: AstManager, op: number, parameters: Rational[], args: number[]) =>
  manager.mkApp(
    manager.mkPbDecl(
      op,
      parameters,
      args.map(() => SORT_BOOL),
    ),
    args,
    SORT_BOOL,
  );

const normalize = (coeffs: readonly Rational[], k: Rational) => {
  if (coeffs.every((coeff) => coeff.isInt())) return { coeffs: [...coeffs], k };
  const scale = Rational.of(coeffs.reduce((lcm, coeff) => getLcm(lcm, coeff.den), 1n));
  return { coeffs: coeffs.map((coeff) => coeff.mul(scale)), k: k.mul(scale) };
};

export const mkPbLe = (
  manager: AstManager,
  coeffs: readonly Rational[],
  args: number[],
  k: Rational,
) => {
  const normalized = normalize(coeffs, k);
  const bound = normalized.k.floor();
  const isAllOnes = normalized.coeffs.every((coeff) => coeff.equals(Rational.one));
  return isAllOnes && isUnsigned(k) && isInt32(bound)
    ? mkPbApp(manager, OP_AT_MOST_K, [bound], args)
    : mkPbApp(manager, OP_PB_LE, [bound, ...normalized.coeffs], args);
};

export const mkPbGe = (
  manager: AstManager,
  coeffs: readonly Rational[],
  args: number[],
  k: Rational,
) => {
  const normalized = normalize(coeffs, k);
  const bound = normalized.k.ceil();
  const isAllOnes = normalized.coeffs.every((coeff) => coeff.equals(Rational.one));
  return isAllOnes && isUnsigned(k)
    ? mkPbApp(manager, OP_AT_LEAST_K, [bound], args)
    : mkPbApp(manager, OP_PB_GE, [bound, ...normalized.coeffs], args);
};

export const mkPbEq = (
  manager: AstManager,
  coeffs: readonly Rational[],
  args: number[],
  k: Rational,
) => {
  const normalized = normalize(coeffs, k);
  if (!normalized.k.isInt()) return manager.falseExpr;
  if (args.length === 0) return normalized.k.isZero() ? manager.trueExpr : manager.falseExpr;
  return mkPbApp(manager, OP_PB_EQ, [normalized.k, ...normalized.coeffs], args);
};

// ast_util's mk_not.
const mkNot = (manager: AstManager, expr: number) =>
  manager.isNot(expr) ? manager.getArg(expr, 0) : manager.mkNot(expr);

const mkAnd = (manager: AstManager, args: number[]) =>
  args.length === 0 ? manager.trueExpr : manager.mkAnd(args);

const unique = (manager: AstManager, args: PbArg[], bound: { k: Rational }) => {
  for (const arg of args)
    if (manager.isNot(arg.expr)) {
      arg.expr = mkNot(manager, arg.expr);
      bound.k = bound.k.sub(arg.coeff);
      arg.coeff = arg.coeff.neg();
    }
  const kept = args.filter((arg) => {
    if (arg.expr === manager.trueExpr) bound.k = bound.k.sub(arg.coeff);
    return arg.expr !== manager.trueExpr && arg.expr !== manager.falseExpr;
  });
  kept.sort((first, second) => first.expr - second.expr);
  const coalesced: PbArg[] = [];
  for (const arg of kept) {
    const last = coalesced[coalesced.length - 1];
    if (last !== undefined && last.expr === arg.expr) last.coeff = last.coeff.add(arg.coeff);
    else coalesced.push({ ...arg });
  }
  args.splice(0, args.length, ...coalesced.filter((arg) => !arg.coeff.isZero()));
};

const normalizePb = (manager: AstManager, args: PbArg[], bound: { k: Rational }, isEq: boolean) => {
  let sum = Rational.zero;
  for (const arg of args) {
    if (arg.coeff.isNegative()) {
      bound.k = bound.k.sub(arg.coeff);
      arg.coeff = arg.coeff.neg();
      arg.expr = negate(manager, arg.expr);
    }
    sum = sum.add(arg.coeff);
  }
  if (!isEq && bound.k.compare(Rational.zero) <= 0) {
    args.length = 0;
    bound.k = Rational.zero;
    return L_TRUE;
  }
  if (isEq && bound.k.isZero() && args.length === 0) return L_TRUE;
  if (sum.compare(bound.k) < 0) {
    args.length = 0;
    bound.k = Rational.one;
    return L_FALSE;
  }
  if (isEq && bound.k.equals(sum)) {
    for (const arg of args) arg.coeff = Rational.one;
    bound.k = Rational.fromNumber(args.length);
    return L_UNDEF;
  }
  if (!args.every((arg) => arg.coeff.isInt())) {
    const scale = Rational.of(args.reduce((lcm, arg) => getLcm(lcm, arg.coeff.den), bound.k.den));
    bound.k = bound.k.mul(scale);
    for (const arg of args) arg.coeff = arg.coeff.mul(scale);
  }
  if (isEq && bound.k.isNegative()) return L_FALSE;
  if (isEq) return L_UNDEF;
  sum = Rational.zero;
  for (const arg of args) {
    if (arg.coeff.compare(bound.k) > 0) arg.coeff = bound.k;
    sum = sum.add(arg.coeff);
  }
  if (sum.equals(bound.k)) {
    for (const arg of args) arg.coeff = Rational.one;
    bound.k = Rational.fromNumber(args.length);
  }
  let gcd = 0n;
  for (let index = 0; gcd !== 1n && index < args.length; index++) {
    const coeff = args[index].coeff;
    if (!coeff.equals(bound.k)) gcd = gcd === 0n ? coeff.num : getGcd(gcd, coeff.num);
  }
  if (gcd === 0n) {
    for (const arg of args) arg.coeff = Rational.one;
    bound.k = Rational.one;
  } else if (gcd > 1n) {
    const k = bound.k.num;
    const newK = k / gcd + (k % gcd === 0n ? 0n : 1n);
    for (const arg of args)
      arg.coeff = Rational.of(arg.coeff.equals(bound.k) ? newK : arg.coeff.num / gcd);
    bound.k = Rational.of(newK);
  }
  if (!bound.k.equals(Rational.one)) {
    let min = args[0].coeff;
    let max = args[0].coeff;
    for (const arg of args.slice(1)) {
      if (arg.coeff.compare(min) < 0) min = arg.coeff;
      if (arg.coeff.compare(max) > 0) max = arg.coeff;
    }
    const n0 = bound.k.div(max);
    const n1 = n0.floor();
    const n2 = bound.k.div(min).ceil().sub(Rational.one);
    if (n1.equals(n2) && !n0.isInt()) {
      for (const arg of args) arg.coeff = Rational.one;
      bound.k = n1.add(Rational.one);
    }
  }
  return L_UNDEF;
};

const negate = (manager: AstManager, expr: number) =>
  expr === manager.trueExpr
    ? manager.falseExpr
    : expr === manager.falseExpr
      ? manager.trueExpr
      : mkNot(manager, expr);

const prune = (manager: AstManager, args: PbArg[], bound: { k: Rational }, isEq: boolean) => {
  if (isEq) return;
  let nlt = Rational.zero;
  let occ = 0;
  for (let index = 0; nlt.compare(bound.k) < 0 && index < args.length; index++)
    if (args[index].coeff.compare(bound.k) < 0) {
      nlt = nlt.add(args[index].coeff);
      occ++;
    }
  if (occ === 0 || nlt.compare(bound.k) >= 0) return;
  for (let index = 0; index < args.length; index++)
    if (args[index].coeff.compare(bound.k) < 0) {
      args[index] = args[args.length - 1];
      args.pop();
      index--;
    }
  unique(manager, args, bound);
  normalizePb(manager, args, bound, isEq);
};

// pb_rewriter::mk_app_core.
export const mkPbAppCore = (
  manager: AstManager,
  decl: number,
  args: readonly number[],
): number | Rewrite => {
  const op = manager.funcDecls[decl].op;
  const isNegated = op === OP_AT_MOST_K || op === OP_PB_LE;
  const vec = args.map((expr, index) => {
    const coeff = getPbCoeff(manager, decl, index);
    return { expr, coeff: isNegated ? coeff.neg() : coeff };
  });
  const bound = { k: isNegated ? getPbK(manager, decl).neg() : getPbK(manager, decl) };
  const isEq = op === OP_PB_EQ;
  unique(manager, vec, bound);
  const isSat = normalizePb(manager, vec, bound, isEq);
  prune(manager, vec, bound, isEq);
  if (isSat === L_TRUE) return manager.trueExpr;
  if (isSat === L_FALSE) return manager.falseExpr;
  const isAllUnit = vec.every((arg) => arg.coeff.equals(Rational.one));
  const exprs = vec.map((arg) => arg.expr);
  const coeffs = vec.map((arg) => arg.coeff);
  let slack = coeffs.reduce((sum, coeff) => sum.add(coeff), Rational.zero);
  let k = bound.k;
  const size = vec.length;
  if (isEq) {
    if (size === 0) return k.isZero() ? manager.trueExpr : manager.falseExpr;
    if (k.isZero()) return mkNot(manager, manager.mkOr(exprs));
    if (k.equals(Rational.one) && isAllUnit && size === 1) return exprs[0];
    if (slack.equals(k)) return mkAnd(manager, exprs);
    return mkPbEq(manager, coeffs, exprs, k);
  }
  if (isAllUnit && k.equals(Rational.one) && size < 10) return manager.mkOr(exprs);
  if (isAllUnit && k.equals(Rational.fromNumber(size))) return mkAnd(manager, exprs);
  const conj: number[] = [];
  const disj: number[] = [];
  const restArgs: number[] = [];
  const restCoeffs: Rational[] = [];
  for (const [index, coeff] of coeffs.entries()) {
    if (slack.compare(coeff.add(k)) < 0) {
      conj.push(exprs[index]);
      slack = slack.sub(coeff);
      k = k.sub(coeff);
    } else if (coeff.compare(k) >= 0 && k.isPositive()) disj.push(exprs[index]);
    else {
      restArgs.push(exprs[index]);
      restCoeffs.push(coeff);
    }
  }
  if (restArgs.length > 0) disj.push(mkPbGe(manager, restCoeffs, restArgs, k));
  if (disj.length > 0) conj.push(manager.mkOr(disj));
  const result = mkAnd(manager, conj);
  return disj.length > 1 || conj.length > 1 ? { expr: result, depth: 3 } : result;
};
