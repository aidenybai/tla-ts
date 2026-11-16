// Ported from Z3 (src/smt/theory_lra.cpp, src/sat/smt/arith_solver.cpp), MIT license, see
// z3-license.txt.
import {
  type AstManager,
  OP_ADD,
  OP_GE,
  OP_LE,
  OP_MUL,
  OP_TO_REAL,
  SORT_BOOL,
  SORT_INT,
  SORT_REAL,
} from "./ast";
import { getIdentityHash, ObjMap } from "./hashtable";
import type { LarSolver } from "./lp/lar-solver";
import type { LarTerm } from "./lp/lar-term";
import { getGcd, getLcm, Rational } from "./rational";

// term2coeffs: the term over the theory variables of its columns, with nested terms expanded.
export const getTermCoeffs = (solver: LarSolver, term: LarTerm) => {
  const coeffs = new ObjMap<Rational>(getIdentityHash);
  const visit = (current: LarTerm, coeff: Rational) => {
    for (const entry of current.coeffs) {
      if (solver.hasTerm(entry[0])) {
        visit(solver.getTerm(entry[0]), coeff.mul(entry[1]));
        continue;
      }
      const thVar = solver.getExternal(entry[0]);
      const sum = (coeffs.get(thVar) ?? Rational.zero).add(entry[1].mul(coeff));
      if (coeffs.has(thVar)) coeffs.replace(thVar, sum);
      else coeffs.set(thVar, sum);
    }
  };
  visit(term, Rational.one);
  return [...coeffs];
};

// coeffs2app: Int expressions of a Real sum are coerced to Real.
export const coeffsToApp = (
  manager: AstManager,
  coeffs: [number, Rational][],
  isInt: boolean,
  getExpr: (thVar: number) => number,
) => {
  const sort = isInt ? SORT_INT : SORT_REAL;
  const summands = coeffs
    .filter((entry) => !entry[1].isZero())
    .map((entry) => {
      const original = getExpr(entry[0]);
      const expr =
        !isInt && manager.isInt(original)
          ? manager.mkApp(OP_TO_REAL, [original], SORT_REAL)
          : original;
      return entry[1].equals(Rational.one)
        ? expr
        : manager.mkApp(OP_MUL, [manager.mkNumeralOfSort(entry[1], sort), expr], sort);
    });
  return summands.length === 0
    ? manager.mkNumeralOfSort(Rational.zero, sort)
    : summands.length === 1
      ? summands[0]
      : manager.mkApp(OP_ADD, summands, sort);
};

// mk_bound: the atom term >= offset, or term <= offset, with integer coefficients reduced by their
// gcd when every variable is an integer.
export const mkBoundAtom = (
  manager: AstManager,
  solver: LarSolver,
  term: LarTerm,
  inputOffset: Rational,
  inputIsLower: boolean,
  getExpr: (thVar: number) => number,
) => {
  let coeffs = getTermCoeffs(solver, term);
  let offset = inputOffset;
  let isLower = inputIsLower;
  let lcm = offset.den;
  const isInt = coeffs.every((entry) => manager.isInt(getExpr(entry[0])));
  if (isInt) {
    for (const entry of coeffs) lcm = getLcm(lcm, entry[1].den);
    if (lcm !== 1n) {
      const scale = Rational.of(lcm);
      offset = offset.mul(scale);
      coeffs = coeffs.map((entry) => [entry[0], entry[1].mul(scale)]);
    }
    let gcd = 0n;
    for (const entry of coeffs) gcd = getGcd(gcd, entry[1].num);
    if (gcd !== 0n && gcd !== 1n) {
      const divisor = Rational.of(gcd);
      coeffs = coeffs.map((entry) => [entry[0], entry[1].div(divisor)]);
      offset = isLower ? offset.div(divisor).ceil() : offset.div(divisor).floor();
    }
  }
  if (coeffs.length > 0 && coeffs[0][1].isNegative()) {
    offset = offset.neg();
    isLower = !isLower;
    coeffs = coeffs.map((entry) => [entry[0], entry[1].neg()]);
  }
  const sort = isInt ? SORT_INT : SORT_REAL;
  return manager.mkApp(
    isLower ? OP_GE : OP_LE,
    [coeffsToApp(manager, coeffs, isInt, getExpr), manager.mkNumeralOfSort(offset, sort)],
    SORT_BOOL,
  );
};

// The sides of the equality term = offset that mk_eq internalizes.
export const mkTermEqSides = (
  manager: AstManager,
  solver: LarSolver,
  term: LarTerm,
  offset: Rational,
  getExpr: (thVar: number) => number,
) => {
  const coeffs = getTermCoeffs(solver, term);
  const isInt =
    offset.isInt() && coeffs.every((entry) => manager.isInt(getExpr(entry[0])) && entry[1].isInt());
  return [
    coeffsToApp(manager, coeffs, isInt, getExpr),
    manager.mkNumeralOfSort(offset, isInt ? SORT_INT : SORT_REAL),
  ];
};
