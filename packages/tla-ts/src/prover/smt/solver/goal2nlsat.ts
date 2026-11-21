import { SmtTacticError } from "../../../errors";
import {
  type AstManager,
  FAMILY_ARITH,
  FAMILY_BASIC,
  KIND_APP,
  OP_AND,
  OP_ATAN2,
  OP_DISTINCT,
  OP_EQ,
  OP_FALSE,
  OP_GE,
  OP_IMPLIES,
  OP_ITE,
  OP_LE,
  OP_NOT,
  OP_OR,
  OP_PI,
  OP_TRUE,
  OP_XOR,
  SORT_BOOL,
  SORT_INT,
  SORT_REAL,
} from "./ast";
import { Expr2Polynomial } from "./expr2polynomial";
import { getLcm } from "./rational";
import { flipKind } from "./nlsat/atoms";
import { Factors, type Polynomial, PolynomialRef } from "./nlsat/polynomial";
import type { NlsatSolver } from "./nlsat/solver";
import { TRANSCENDENTAL_OPS } from "./nlsat/transcendental-eval";
import type { IneqKind } from "./nlsat/types";

export const goal2nlsat = (
  manager: AstManager,
  forms: readonly number[],
  solver: NlsatSolver,
  t2x: Map<number, number>,
  a2b: Map<number, number>,
  assumption: number | null,
  isFactoring = true,
) => {
  const pm = solver.pm;
  const expr2poly = new Expr2Polynomial(manager, pm, t2x, (isInt) => solver.mkVar(isInt));

  const factorAtom = (polynomial: Polynomial, kind: IneqKind) => {
    const factors = new Factors(pm);
    pm.factor(polynomial, factors);
    const literal = solver.mkIneqLiteral(
      factors.constant < 0n ? flipKind(kind) : kind,
      factors.factors,
      factors.degrees.map((degree) => degree % 2 === 0),
    );
    factors.reset();
    return literal;
  };

  const processIneqPolynomial = (p: PolynomialRef, kind: IneqKind) => {
    const polynomial = p.get();
    if (pm.isConst(polynomial)) {
      const sign = pm.isZero(polynomial) ? 0 : polynomial.as[0] > 0n ? 1 : -1;
      const isTrue = kind === "EQ" ? sign === 0 : kind === "LT" ? sign < 0 : sign > 0;
      return isTrue ? 0 : 1;
    }
    return isFactoring
      ? factorAtom(polynomial, kind)
      : solver.mkIneqLiteral(kind, [polynomial], [false]);
  };

  const processIneq = (atom: number, kind: IneqKind) => {
    const first = new PolynomialRef(pm);
    const second = new PolynomialRef(pm);
    const p = new PolynomialRef(pm);
    const firstDenominator = expr2poly.toPolynomial(manager.getArg(atom, 0), first);
    const secondDenominator = expr2poly.toPolynomial(manager.getArg(atom, 1), second);
    const lcm = getLcm(firstDenominator, secondDenominator);
    p.set(
      pm.addmulTerms(
        lcm / firstDenominator,
        pm.unit,
        first.get(),
        -(lcm / secondDenominator),
        pm.unit,
        second.get(),
      ),
    );
    const literal = processIneqPolynomial(p, kind);
    p.reset();
    second.reset();
    first.reset();
    return literal;
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
    solver.mkExternalClause(literals.map(processLiteral), assumption);
  }

  // The polynomial conversion treats a transcendental application, argument included, as one
  // variable, so its argument gets a variable here, through an equation unless it is one already.
  const mkArgVar = (term: number) => {
    const p = new PolynomialRef(pm);
    const denominator = expr2poly.toPolynomial(term, p);
    const polynomial = p.get();
    const monomial = polynomial.ms[0];
    if (
      denominator === 1n &&
      polynomial.ms.length === 1 &&
      polynomial.as[0] === 1n &&
      monomial.size === 1 &&
      monomial.degrees[0] === 1
    ) {
      p.reset();
      return monomial.vars[0];
    }
    const variable = solver.mkVar(false);
    const vp = new PolynomialRef(pm);
    const equation = new PolynomialRef(pm);
    vp.set(pm.mkVar(variable));
    equation.set(pm.addmulTerms(denominator, pm.unit, vp.get(), -1n, pm.unit, polynomial));
    solver.mkExternalClause([solver.mkIneqLiteral("EQ", [equation.get()], [false])], null);
    equation.reset();
    vp.reset();
    p.reset();
    return variable;
  };

  // An argument can bring in applications nested inside it, so this repeats to a fixed point.
  const seen = new Set<number>();
  let piVar: number | undefined;
  for (let isChanged = true; isChanged;) {
    const found = [...t2x].filter(
      (entry) =>
        !seen.has(entry[0]) &&
        manager.kinds[entry[0]] === KIND_APP &&
        manager.getFamily(entry[0]) === FAMILY_ARITH,
    );
    const atan2Found = found.filter((entry) => manager.getOp(entry[0]) === OP_ATAN2);
    piVar = found.find((entry) => manager.getOp(entry[0]) === OP_PI)?.[1] ?? piVar;
    isChanged = false;
    for (const [term, variable] of found) {
      const op = TRANSCENDENTAL_OPS.get(manager.getOp(term));
      if (op === undefined) continue;
      seen.add(term);
      solver.transcendentals.add(op, mkArgVar(manager.getArg(term, 0)), variable);
      isChanged = true;
    }
    for (const [term, variable] of atan2Found) {
      seen.add(term);
      const y = mkArgVar(manager.getArg(term, 0));
      solver.transcendentals.addAtan2(y, mkArgVar(manager.getArg(term, 1)), variable);
      isChanged = true;
    }
  }
  if (piVar !== undefined) solver.transcendentals.addPi(piVar);
  expr2poly.release();
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
