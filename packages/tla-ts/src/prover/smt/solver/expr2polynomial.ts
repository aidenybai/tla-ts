// Ported from Z3 (src/ast/expr2polynomial.cpp), MIT license, see z3-license.txt.
import {
  type AstManager,
  FAMILY_ARITH,
  KIND_APP,
  OP_ADD,
  OP_MUL,
  OP_NUM,
  OP_POWER,
  OP_SUB,
  OP_TO_REAL,
  OP_UMINUS,
  SORT_INT,
  SORT_REAL,
} from "./ast";
import type { Polynomial, PolynomialManager } from "./nlsat/polynomial";
import { getLcm, Rational } from "./rational";
import { RefVector } from "./ref-vector";

export interface PolynomialResult {
  polynomial: Polynomial;
  denominator: bigint;
}

export const toPolynomial = (
  manager: AstManager,
  pm: PolynomialManager,
  term: number,
  mkVar: (term: number) => number,
): PolynomialResult => {
  const convert = (expr: number): PolynomialResult => {
    if (manager.kinds[expr] !== KIND_APP || manager.getFamily(expr) !== FAMILY_ARITH)
      return { polynomial: pm.mkVar(mkVar(expr)), denominator: 1n };
    const op = manager.getOp(expr);
    switch (op) {
      case OP_NUM: {
        const value = manager.getRationalValue(expr);
        return { polynomial: pm.mkConst(value.num), denominator: value.den };
      }
      case OP_ADD:
      case OP_SUB: {
        const args = manager.getArgs(expr).map(convert);
        const denominator = args.reduce((lcm, arg) => getLcm(lcm, arg.denominator), 1n);
        let polynomial = pm.zero;
        for (const [index, arg] of args.entries()) {
          const scaled = pm.mulConst(denominator / arg.denominator, arg.polynomial);
          polynomial =
            index === 0
              ? scaled
              : op === OP_ADD
                ? pm.add(polynomial, scaled)
                : pm.sub(polynomial, scaled);
        }
        return { polynomial, denominator };
      }
      case OP_MUL: {
        let polynomial = pm.one;
        let denominator = 1n;
        for (const arg of manager.getArgs(expr).map(convert)) {
          polynomial = pm.mul(polynomial, arg.polynomial);
          denominator *= arg.denominator;
        }
        return { polynomial, denominator };
      }
      case OP_UMINUS: {
        const arg = convert(manager.getArg(expr, 0));
        return { polynomial: pm.neg(arg.polynomial), denominator: arg.denominator };
      }
      case OP_TO_REAL:
        return convert(manager.getArg(expr, 0));
      case OP_POWER: {
        const exponent = manager.getArg(expr, 1);
        const value = manager.isNumeral(exponent) ? manager.getRationalValue(exponent) : undefined;
        if (value === undefined || !value.isInt() || value.num <= 0n || value.num > 0xffffffffn)
          return { polynomial: pm.mkVar(mkVar(expr)), denominator: 1n };
        const base = convert(manager.getArg(expr, 0));
        return {
          polynomial: pm.pw(base.polynomial, Number(value.num)),
          denominator: base.denominator ** value.num,
        };
      }
      default:
        return { polynomial: pm.mkVar(mkVar(expr)), denominator: 1n };
    }
  };
  return convert(term);
};

export class Expr2Polynomial {
  private termToVar = new Map<number, number>();
  private varToTerm: RefVector;

  constructor(
    private manager: AstManager,
    readonly pm: PolynomialManager,
  ) {
    this.varToTerm = new RefVector(manager);
  }

  private getVar(term: number) {
    const existing = this.termToVar.get(term);
    if (existing !== undefined) return existing;
    const variable = this.varToTerm.size;
    this.termToVar.set(term, variable);
    this.varToTerm.push(term);
    return variable;
  }

  private isIntVar(variable: number) {
    return this.manager.sorts[this.varToTerm.items[variable]] === SORT_INT;
  }

  toPolynomial(term: number) {
    return toPolynomial(this.manager, this.pm, term, (expr) => this.getVar(expr));
  }

  toExpr(polynomial: Polynomial, isUsingPower: boolean) {
    const manager = this.manager;
    const isInt = polynomial.ms.every((monomial) =>
      monomial.vars.every((variable) => this.isIntVar(variable)),
    );
    const sort = isInt ? SORT_INT : SORT_REAL;
    const mkNumeral = (value: bigint) => manager.mkNumeralOfSort(Rational.of(value), sort);
    const args = polynomial.ms.map((monomial, index) => {
      const factors: number[] = [];
      const coeff = polynomial.as[index];
      if (coeff !== 1n) factors.push(mkNumeral(coeff));
      for (const [position, variable] of monomial.vars.entries()) {
        const term = this.varToTerm.items[variable];
        const base =
          this.isIntVar(variable) && !isInt ? manager.mkApp(OP_TO_REAL, [term], SORT_REAL) : term;
        const degree = monomial.degrees[position];
        if (isUsingPower && degree > 1)
          factors.push(manager.mkApp(OP_POWER, [base, mkNumeral(BigInt(degree))], SORT_REAL));
        else for (let count = 0; count < degree; count++) factors.push(base);
      }
      if (factors.length === 0) return mkNumeral(1n);
      return factors.length === 1 ? factors[0] : manager.mkApp(OP_MUL, factors, sort);
    });
    if (args.length === 0) return mkNumeral(0n);
    return args.length === 1 ? args[0] : manager.mkApp(OP_ADD, args, sort);
  }

  release() {
    this.varToTerm.reset();
  }
}
