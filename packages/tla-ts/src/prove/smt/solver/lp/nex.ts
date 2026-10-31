// Ported from Z3 (src/math/lp/nex.h), MIT license, see z3-license.txt. The nonlinear expressions
// that horner splits into cross-nested forms: scalars, variables, products of powers with a
// coefficient, and sums. Products and sums are mutable, since nex_creator simplifies them in place
// and cross_nested rewrites their children.
import { Rational } from "../rational";
import { getPower } from "./dep-intervals";

export interface NexScalar {
  readonly kind: "scalar";
  readonly value: Rational;
}

export interface NexVar {
  readonly kind: "var";
  readonly variable: number;
}

export interface NexPow {
  readonly expr: Nex;
  readonly power: number;
}

export interface NexMul {
  readonly kind: "mul";
  coeff: Rational;
  children: NexPow[];
}

export interface NexSum {
  readonly kind: "sum";
  children: Nex[];
}

export type Nex = NexScalar | NexVar | NexMul | NexSum;

export const isElementary = (expr: Nex) => expr.kind === "scalar" || expr.kind === "var";

export const isZeroScalar = (expr: Nex) => expr.kind === "scalar" && expr.value.isZero();

export const containsVar = (expr: Nex, variable: number): boolean => {
  if (expr.kind === "var") return expr.variable === variable;
  if (expr.kind === "mul") return expr.children.some((child) => containsVar(child.expr, variable));
  return false;
};

export const getDegree = (expr: Nex): number => {
  if (expr.kind === "scalar") return 0;
  if (expr.kind === "var") return 1;
  if (expr.kind === "mul")
    return expr.children.reduce((degree, child) => degree + getDegree(child.expr) * child.power, 0);
  return expr.children.reduce((degree, child) => Math.max(degree, getDegree(child)), 0);
};

export const isLinear = (expr: Nex): boolean => {
  if (expr.kind === "mul") return getDegree(expr) < 2;
  if (expr.kind === "sum") return expr.children.every(isLinear);
  return true;
};

// is_a_linear_term: a linear combination of at least two variables.
export const isALinearTerm = (sum: NexSum) => {
  let numberOfNonScalars = 0;
  for (const child of sum.children) {
    const degree = getDegree(child);
    if (degree === 0) continue;
    if (degree > 1) return false;
    numberOfNonScalars++;
  }
  return numberOfNonScalars > 1;
};

// get_powers_from_mul: refills powers with the power of each variable child.
export const getPowersFromMul = (mul: NexMul, powers: Map<number, number>) => {
  powers.clear();
  for (const child of mul.children)
    if (child.expr.kind === "var") powers.set(child.expr.variable, child.power);
};

export const getNexVal = (expr: Nex, getVarVal: (variable: number) => Rational): Rational => {
  if (expr.kind === "scalar") return expr.value;
  if (expr.kind === "var") return getVarVal(expr.variable);
  if (expr.kind === "sum")
    return expr.children.reduce(
      (value, child) => value.add(getNexVal(child, getVarVal)),
      Rational.zero,
    );
  return expr.children.reduce(
    (value, child) => value.mul(getPower(getNexVal(child.expr, getVarVal), child.power)),
    expr.coeff,
  );
};

export const getVarsOfExpr = (expr: Nex): Set<number> => {
  if (expr.kind === "scalar") return new Set();
  if (expr.kind === "var") return new Set([expr.variable]);
  const children = expr.kind === "sum" ? expr.children : expr.children.map((child) => child.expr);
  return new Set(children.flatMap((child) => [...getVarsOfExpr(child)]));
};

const printNexPow = (child: NexPow) => {
  const printed = printNex(child.expr);
  if (child.power === 1) return isElementary(child.expr) ? printed : `(${printed})`;
  return isElementary(child.expr) ? `(${printed}^${child.power})` : `((${printed})^${child.power})`;
};

export const printNex = (expr: Nex): string => {
  if (expr.kind === "scalar") return expr.value.toString();
  if (expr.kind === "var") return `j${expr.variable}`;
  // Like Z3, a coefficient other than one is followed by a space and a star before each factor.
  if (expr.kind === "mul")
    return expr.coeff.equals(Rational.one)
      ? expr.children.map(printNexPow).join("*")
      : `${expr.coeff.toString()} ${expr.children.map((child) => `*${printNexPow(child)}`).join("")}`;
  return expr.children
    .map((child, index) => {
      const printed = printNex(child);
      if (!isElementary(child)) return index === 0 ? `(${printed})` : `+(${printed})`;
      return index === 0 || printed.startsWith("-") ? printed : `+${printed}`;
    })
    .join("");
};
