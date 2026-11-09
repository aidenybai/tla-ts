// Ported from Z3 (src/nlsat/tactic/goal2nlsat.cpp, src/ast/expr2polynomial.cpp), MIT license, see
// z3-license.txt.
import { SmtTacticError, SmtUnsupportedError } from "../../../errors";
import {
  type AstManager,
  FAMILY_ARITH,
  FAMILY_BASIC,
  KIND_APP,
  OP_ACOS,
  OP_ACOSH,
  OP_ADD,
  OP_AND,
  OP_ASIN,
  OP_ASINH,
  OP_ATAN,
  OP_ATAN2,
  OP_ATANH,
  OP_COS,
  OP_COSH,
  OP_DISTINCT,
  OP_EQ,
  OP_EXP,
  OP_FALSE,
  OP_GE,
  OP_IMPLIES,
  OP_ITE,
  OP_LE,
  OP_LOG,
  OP_MUL,
  OP_NOT,
  OP_NUM,
  OP_OR,
  OP_PI,
  OP_POWER,
  OP_SIN,
  OP_SINH,
  OP_SUB,
  OP_TAN,
  OP_TANH,
  OP_TO_REAL,
  OP_TRUE,
  OP_UMINUS,
  OP_XOR,
  SORT_BOOL,
  SORT_INT,
  SORT_REAL,
} from "./ast";
import { getLcm } from "./rational";
import { flipKind } from "./nlsat/atoms";
import type { Polynomial } from "./nlsat/polynomial";
import type { NlsatSolver } from "./nlsat/solver";
import type { IneqKind } from "./nlsat/types";

interface PolynomialResult {
  polynomial: Polynomial;
  denominator: bigint;
}

const TRANSCENDENTAL_OPS = new Set([
  OP_SIN,
  OP_COS,
  OP_TAN,
  OP_ASIN,
  OP_ACOS,
  OP_ATAN,
  OP_SINH,
  OP_COSH,
  OP_TANH,
  OP_ASINH,
  OP_ACOSH,
  OP_ATANH,
  OP_EXP,
  OP_ATAN2,
  OP_LOG,
  OP_PI,
]);

export const goal2nlsat = (
  manager: AstManager,
  forms: readonly number[],
  solver: NlsatSolver,
  t2x: Map<number, number>,
  a2b: Map<number, number>,
) => {
  const pm = solver.pm;

  const mkVarPolynomial = (term: number): PolynomialResult => {
    let variable = t2x.get(term);
    if (variable === undefined) {
      variable = solver.mkVar(manager.sorts[term] === SORT_INT);
      t2x.set(term, variable);
    }
    return { polynomial: pm.mkVar(variable), denominator: 1n };
  };

  const toPolynomial = (term: number): PolynomialResult => {
    if (manager.kinds[term] !== KIND_APP || manager.getFamily(term) !== FAMILY_ARITH)
      return mkVarPolynomial(term);
    const op = manager.getOp(term);
    if (TRANSCENDENTAL_OPS.has(op))
      throw new SmtUnsupportedError("transcendental functions in nlsat");
    switch (op) {
      case OP_NUM: {
        const value = manager.getRationalValue(term);
        return { polynomial: pm.mkConst(value.num), denominator: value.den };
      }
      case OP_ADD:
      case OP_SUB: {
        const args = manager.getArgs(term).map(toPolynomial);
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
        for (const arg of manager.getArgs(term).map(toPolynomial)) {
          polynomial = pm.mul(polynomial, arg.polynomial);
          denominator *= arg.denominator;
        }
        return { polynomial, denominator };
      }
      case OP_UMINUS: {
        const arg = toPolynomial(manager.getArg(term, 0));
        return { polynomial: pm.neg(arg.polynomial), denominator: arg.denominator };
      }
      case OP_TO_REAL:
        return toPolynomial(manager.getArg(term, 0));
      case OP_POWER: {
        const exponent = manager.getArg(term, 1);
        const value = manager.isNumeral(exponent) ? manager.getRationalValue(exponent) : undefined;
        if (value === undefined || !value.isInt() || value.num <= 0n || value.num > 0xffffffffn)
          return mkVarPolynomial(term);
        const base = toPolynomial(manager.getArg(term, 0));
        const power = Number(value.num);
        return {
          polynomial: pm.pw(base.polynomial, power),
          denominator: base.denominator ** value.num,
        };
      }
      default:
        return mkVarPolynomial(term);
    }
  };

  const processIneq = (atom: number, kind: IneqKind) => {
    const lhs = toPolynomial(manager.getArg(atom, 0));
    const rhs = toPolynomial(manager.getArg(atom, 1));
    const lcm = getLcm(lhs.denominator, rhs.denominator);
    const polynomial = pm.addmul(
      lcm / lhs.denominator,
      lhs.polynomial,
      -(lcm / rhs.denominator),
      rhs.polynomial,
    );
    if (pm.isConst(polynomial)) {
      const sign = pm.isZero(polynomial) ? 0 : polynomial.as[0] > 0n ? 1 : -1;
      const isTrue = kind === "EQ" ? sign === 0 : kind === "LT" ? sign < 0 : sign > 0;
      return isTrue ? 0 : 1;
    }
    const factors = pm.factor(polynomial);
    return solver.mkIneqLiteral(
      factors.constant < 0n ? flipKind(kind) : kind,
      factors.factors,
      factors.degrees.map((degree) => degree % 2 === 0),
    );
  };

  const processBoolVar = (atom: number) => {
    const existing = a2b.get(atom);
    if (existing !== undefined) return 2 * existing;
    const boolVar = solver.mkBoolVar();
    a2b.set(atom, boolVar);
    return 2 * boolVar;
  };

  const processAtom = (atom: number) => {
    if (manager.kinds[atom] !== KIND_APP) return processBoolVar(atom);
    const op = manager.getOp(atom);
    const family = manager.getFamily(atom);
    if (op === OP_EQ) {
      const sort = manager.sorts[manager.getArg(atom, 0)];
      return sort === SORT_INT || sort === SORT_REAL
        ? processIneq(atom, "EQ")
        : processBoolVar(atom);
    }
    if (op === OP_LE) return processIneq(atom, "GT") ^ 1;
    if (op === OP_GE) return processIneq(atom, "LT") ^ 1;
    if (family === FAMILY_BASIC) {
      if (op === OP_TRUE || op === OP_FALSE)
        throw new SmtTacticError("apply simplify before applying nlsat");
      if ([OP_AND, OP_OR, OP_XOR, OP_NOT, OP_IMPLIES, OP_ITE].includes(op))
        throw new SmtTacticError("convert goal into cnf before applying nlsat");
      if (op === OP_DISTINCT)
        throw new SmtTacticError(
          "eliminate distinct operator (use tactic '(using-params simplify :blast-distinct true)') before applying nlsat",
        );
    }
    if (family === FAMILY_ARITH)
      throw new SmtTacticError("apply purify-arith before applying nlsat");
    return processBoolVar(atom);
  };

  const processLiteral = (form: number) => {
    let atom = form;
    let isNeg = false;
    while (manager.isNot(atom)) {
      atom = manager.getArg(atom, 0);
      isNeg = !isNeg;
    }
    const literal = processAtom(atom);
    return isNeg ? literal ^ 1 : literal;
  };

  if (forms.some((form) => hasTermIte(manager, form)))
    throw new SmtTacticError("eliminate term-ite before applying nlsat");
  for (const form of forms) {
    const literals = manager.getOp(form) === OP_OR ? manager.getArgs(form) : [form];
    solver.mkExternalClause(literals.map(processLiteral), null);
  }
};

const hasTermIte = (manager: AstManager, form: number) => {
  const seen = new Set<number>();
  const todo = [form];
  for (let expr = todo.pop(); expr !== undefined; expr = todo.pop()) {
    if (seen.has(expr) || manager.kinds[expr] !== KIND_APP) continue;
    seen.add(expr);
    if (manager.getOp(expr) === OP_ITE && manager.sorts[expr] !== SORT_BOOL) return true;
    manager.pushArgs(expr, todo);
  }
  return false;
};
